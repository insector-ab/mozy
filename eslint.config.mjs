import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import mochaPlugin from 'eslint-plugin-mocha';
import nPlugin from 'eslint-plugin-n';
import promisePlugin from 'eslint-plugin-promise';

const importRules = importPlugin.default ?? importPlugin;
const mochaRules = mochaPlugin.default ?? mochaPlugin;
const nRules = nPlugin.default ?? nPlugin;
const promiseRules = promisePlugin.default ?? promisePlugin;

const sharedGlobals = {
  ...globals.browser,
  ...globals.node,
  Atomics: 'readonly',
  SharedArrayBuffer: 'readonly'
};

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: sharedGlobals
    },
    plugins: {
      import: importRules,
      mocha: mochaRules,
      n: nRules,
      promise: promiseRules
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js']
        }
      }
    },
    rules: {
      indent: ['error', 2, { SwitchCase: 1 }],
      'lines-between-class-members': 'off',
      'mocha/no-exclusive-tests': 'error',
      'no-unused-vars': ['error', { args: 'none', ignoreRestSiblings: true }],
      'padded-blocks': 'off',
      semi: ['error', 'always'],
      'space-before-function-paren': 'off'
    }
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        ...sharedGlobals,
        ...globals.mocha
      }
    }
  }
];
