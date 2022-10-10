#!/usr/bin/env node

import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { run } from './tsc-paths-replacer';

const [, , project = 'tsconfig.json'] = process.argv;

const ROOT_PATH = process.cwd();
const tsconfigPath = path.resolve(ROOT_PATH, project);

function safeParse(raw: string) {
  try {
    return JSON.parse(raw);
  } catch ({ message }) {
    console.log(`Error in tsconfig.json: ${message}`);
  }
  return null;
}

stat(tsconfigPath).then(async () => {
  const raw = await readFile(tsconfigPath);

  const tsconfig = safeParse(raw.toString());
  if (tsconfig) {
    const {
      compilerOptions: { outDir, baseUrl, paths, rootDir },
    } = tsconfig;

    await run({
      outDir,
      baseUrl,
      paths,
      rootDir,
    });
  }
});
