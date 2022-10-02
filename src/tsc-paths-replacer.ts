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
