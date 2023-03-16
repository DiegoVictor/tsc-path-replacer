# tsc-path-replacer
[![npm](https://img.shields.io/npm/v/@diegovictor/tsc-path-replacer?style=flat-square)](https://www.npmjs.com/package/@diegovictor/tsc-path-replacer)
[![eslint](https://img.shields.io/badge/eslint-8.24.0-4b32c3?style=flat-square&logo=eslint)](https://eslint.org/)
[![prettier](https://img.shields.io/badge/prettier-2.7.1-F7B93E?style=flat-square&logo=prettier)](https://prettier.io/)
[![airbnb-style](https://flat.badgen.net/badge/style-guide/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)
[![typescript](https://img.shields.io/badge/typescript-4.8.3-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](https://raw.githubusercontent.com/DiegoVictor/tsc-path-replacer/main/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

Resolve imports/requires alias according to tsconfig paths. It tries use more resources provided by Node.js, like, asynchronous methods, paralelism and a simple memory cache. (Also, it works on windows!)

### Examples
```js
// ./src/controllers/user/index.js

// this import:
import userService from '@services/user/getUsers';
// will be replaced by:
import userService from '../../services/user/getUsers';
```

Using `require`:
```js
// ./src/controllers/user/index.js

const userService = require('@services/user/getUsers');
const userService = require('../../services/user/getUsers');
```

The biggest difference from this package to another similar ones is the huge usage of the Node.js asynchronous APIs and paralelism (up to 5 files are processed at the same time).

## Table of Contents
* [Installing](#installing)
* [Usage](#usage)
* [Inspired by](#inspired-by)

# Installing
Just run:
```
npm install --save-dev @diegovictor/tsc-path-replacer
```
Or simply:
```
yarn add -D @diegovictor/tsc-path-replacer
```

# Usage
Register on your build script:
```json
"scripts": {
  "build": "tsc --project tsconfig.json && tsc-path-replacer tsconfig.json",
}
```

# Inspired by
[tsconfig-replace-paths](https://github.com/jonkwheeler/tsconfig-replace-paths)
