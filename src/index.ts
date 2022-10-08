import path from 'node:path';

const [, , project = 'tsconfig.json'] = process.argv;

const ROOT_PATH = process.cwd();
const tsconfigPath = path.resolve(ROOT_PATH, project);

