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


    for (const aliasPath of aliasesMap.get(alias)) {
      const moduleSourcePath = path.resolve(aliasPath, relativePath);
      const [exists] = getFilesFromPattern(
        `${moduleSourcePath}.{js,jsx,ts,tsx,d.ts,json}`
      );

      if (exists) {
        const fileCache = moduleCache.get(file) || {};

        if (fileCache[alias]) {
          return replaceSlashes(
            `./${path.join(fileCache[alias], relativePath)}`
          );
        }

        const moduleRelativePath = getModuleRelativePath(
          moduleSourcePath,
          file
        );

        fileCache[alias] = moduleRelativePath.replace(relativePath, '');
        moduleCache.set(file, fileCache);

        return replaceSlashes(moduleRelativePath);
      }
    }

    console.log(
      `\x1b[31mSource file not found for module ${moduleName}\x1b[0m`
    );
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
