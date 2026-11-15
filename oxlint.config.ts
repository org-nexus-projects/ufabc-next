import { defineConfig } from 'oxlint';
import core from 'ultracite/oxlint/core';

export default defineConfig({
  extends: [core],
  ignorePatterns: [
    ...(core.ignorePatterns ?? []),
    '**/tmp',
    '**/temp',
    '**/debug.js',
    'stats.html',
    'stats-*.json',
    'codegen.ts',
    '**/assets/**/*.js',
    '**/assets/**/*.css',
    '**/assets/**/*.html',
    '**/*.min.*',
  ],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  overrides: [
    {
      env: {
        browser: false,
        node: true,
      },
      files: ['apps/core/**/*.ts'],
    },
    {
      env: {
        browser: true,
      },
      files: ['apps/web/**/*.ts', 'apps/web/**/*.vue'],
      rules: {
        'unicorn/filename-case': 'off',
        'unicorn/no-array-sort': 'off',
      },
    },
    {
      env: {
        browser: true,
        webextensions: true,
      },
      files: ['apps/extension/**/*.ts', 'apps/extension/**/*.vue'],
      rules: {
        'unicorn/filename-case': 'off',
        'unicorn/no-array-sort': 'off',
      },
    },
    {
      env: {
        browser: true,
        node: true,
      },
      files: ['packages/**/*.ts'],
    },
    {
      files: ['**/*.d.ts'],
      rules: {
        'typescript/consistent-type-definitions': 'off',
      },
    },
    {
      files: ['**/*.test.ts', '**/test-utils.ts', '**/setup-tests.ts'],
      rules: {
        'typescript/no-non-null-assertion': 'off',
        'typescript/no-unsafe-type-assertion': 'off',
      },
    },
    {
      files: ['packages/services/src/index.ts'],
      rules: {
        'oxc/no-barrel-file': 'off',
      },
    },
    {
      files: ['**/*-controller.ts', '**/hooks/*.ts'],
      rules: {
        'func-style': 'off',
        'require-await': 'off',
      },
    },
    {
      files: [
        'apps/core/src/connectors/**/*.ts',
        'packages/connectors/src/**/*.ts',
      ],
      rules: {
        'eslint/no-constructor-return': 'off',
        'typescript/no-this-alias': 'off',
        'unicorn/no-this-assignment': 'off',
      },
    },
  ],
  rules: {
    'class-methods-use-this': 'off',
    complexity: ['error', 25],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'eslint/complexity': ['error', { max: 35 }],
    'eslint/max-classes-per-file': 'off',
    'eslint/no-use-before-define': ['error', { functions: false }],
    'eslint/prefer-destructuring': 'off',
    'func-style': ['error', 'declaration', { allowTypeAnnotation: true }],
    'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
    'no-eq-null': 'off',
    'node/callback-return': 'off',
    'promise/prefer-await-to-callbacks': 'off',
    'typescript/array-type': ['error', { default: 'array-simple' }],
    'typescript/consistent-return': 'off',
    'typescript/consistent-type-definitions': ['error', 'type'],
    'typescript/no-extraneous-class': 'off',
    'unicorn/no-static-only-class': 'off',
  },
});
