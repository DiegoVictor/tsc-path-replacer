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

