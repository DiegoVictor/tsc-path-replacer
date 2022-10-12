/* eslint-disable no-restricted-syntax */
import { sync } from 'globby';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface ConfigProps extends Record<string, any> {
  outDir: string;
  baseUrl: string;
  rootDir: string;
  paths: Record<string, string[]>;
}

const aliasesMap = new Map();
const moduleCache = new Map();

const config: Record<string, any> = {
  outDir: '',
  baseUrl: '',
  rootDir: path.resolve(process.cwd()),
  prefixes: '',
};

function replaceSlashes(text: string) {
  return text.replaceAll(path.sep, path.posix.sep);
}

function findByPattern(patern: string, onlyFiles = true) {
  return sync(replaceSlashes(patern), {
    dot: true,
    onlyFiles,
  });
}

function getModuleRelativePath(
  outputFilePath: string,
  requiredModulePath: string
) {
  const moduleRelativePath = path.relative(
    path.dirname(outputFilePath),
    requiredModulePath
  );

  return moduleRelativePath.startsWith('.')
    ? moduleRelativePath
    : `./${moduleRelativePath}`;
}

function getModulePath(moduleName: string, file: string): string | null {
  const result = moduleName.match(config.prefixes);
  if (!result) {
    return null;
  }

  const [alias] = result;
  const aliasPaths = aliasesMap.get(alias);
  if (!Array.isArray(aliasPaths) || aliasPaths.length === 0) {
    return null;
  }

  const relativePath = moduleName.substring(alias.length);
  for (const aliasPath of aliasPaths) {
    const requiredModuleFullPath = path.resolve(aliasPath, relativePath);

    const existsRequiredModule = !!findByPattern(
      replaceSlashes(requiredModuleFullPath),
      false
    );
    if (existsRequiredModule) {
      const requiredModuleRelativePath = getModuleRelativePath(
        file,
        path.relative(config.rootDir, requiredModuleFullPath)
      );

      return replaceSlashes(requiredModuleRelativePath);
    }
  }

  return null;
}

const IMPORT_REGEX = /(?:require\(|import\(?|from) ?['"]([^'"]*)['"]\)?/g;
function replace(text: string, file: string): string {
  const imports = Array.from(text.matchAll(IMPORT_REGEX));

  for (const [raw, match] of imports) {
    const modulePath = getModulePath(match, file);
    if (modulePath) {
      text = text.replace(raw, raw.replace(match, modulePath));
    }
  }

  return text;
}

async function handle(file: string): Promise<void> {
  const content = await readFile(file, 'utf-8');
  const code = replace(content, file);
  if (code !== content) {
    await writeFile(file, code, 'utf-8');
  }
}

const queue: string[] = [];
async function processQueue(files: string[]): Promise<void> {
  if (queue.length > 0) {
    const promises = queue.map(async item =>
      // eslint-disable-next-line no-use-before-define
      handle(item).then(() => enqueue(files))
    );

    queue.splice(0, queue.length);
    await Promise.all(promises);
  }
}

const QUEUE_SIZE = 5;
async function enqueue(files: string[]): Promise<void> {
  while (queue.length < QUEUE_SIZE && files.length > 0) {
    const file = files.shift();
    if (file) {
      queue.push(file);
    }
  }
  return processQueue(files);
}

export const run = async (tsConfig: ConfigProps): Promise<void> => {
  [moduleCache, aliasesMap].forEach(map => {
    map.clear();
  });

  Object.keys(tsConfig).forEach(key => {
    if (tsConfig[key]) {
      config[key] = tsConfig[key];
    }
  });

  ['rootDir', 'outDir'].forEach(key => {
    config[key] = path.resolve(config[key]);
  });

  config.prefixes = Object.keys(tsConfig.paths)
    .reduce<string[]>((prefixes, alias) => {
      const key = alias.replace(/\*$/, '');
      prefixes.push(key);

      aliasesMap.set(
        key,
        tsConfig.paths[alias].map(aliasPath =>
          path.resolve(
            config.outDir,
            config.baseUrl,
            aliasPath.replace(/\*/, '')
          )
        )
      );

      return prefixes;
    }, [])
    .join('|');

  const files = findByPattern(`${config.outDir}/**/*.{js,jsx,ts,tsx}`);
  await enqueue(files);
};
