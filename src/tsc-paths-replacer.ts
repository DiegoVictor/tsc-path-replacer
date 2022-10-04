/* eslint-disable no-restricted-syntax */
import { globbySync } from 'globby';
import path from 'node:path';

const aliasesMap = new Map();
const sourceModuleCache = new Map();
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

function getFilesFromPattern(patern: string) {
  return globbySync(replaceSlashes(patern), {
    dot: true,
    onlyFiles: true,
  });
}

function getModuleRelativePath(
  moduleSourcePath: string,
  outputFilePath: string
) {
  if (!sourceModuleCache.has(outputFilePath)) {
    sourceModuleCache.set(
      outputFilePath,
      path.resolve(
        config.rootDir,
        config.baseUrl,
        path.relative(config.outDir, outputFilePath)
      )
    );
  }

  const sourceFileFullPath = sourceModuleCache.get(outputFilePath);
  const moduleRelativePath = path.relative(
    path.dirname(sourceFileFullPath),
    moduleSourcePath
  );

  return moduleRelativePath.startsWith('.')
    ? moduleRelativePath
    : `./${moduleRelativePath}`;
}

function getModulePath(moduleName: string, file: string) {
  const result = moduleName.match(config.prefixes);
  if (result) {
    const [alias] = result;
    const relativePath = moduleName.substring(alias.length);

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
async function replace(text: string, file: string) {
  const matches = Array.from(text.matchAll(IMPORT_REGEX));

  for (const [raw, match] of matches) {
    const modulePath = getModulePath(match, file);
    if (modulePath) {
      text = text.replace(raw, raw.replace(match, modulePath));
    }
  }

  return text;
}

async function handle(file: string) {
  const content = await readFile(file, 'utf-8');
  const code = await replace(content, file);
  if (code !== content) {
    await writeFile(file, code, 'utf-8');
  }
}
