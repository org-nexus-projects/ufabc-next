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
      files: ['apps/container/**/*.ts', 'apps/container/**/*.vue'],
      rules: {
        'unicorn/filename-case': 'off',
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
      files: ['**/*-controller.ts'],
      rules: {
        'func-style': 'off',
        'require-await': 'off',
      },
    },
    {
      files: ['**/errors/custom-errors.ts'],
      rules: {
        'max-classes-per-file': 'off',
      },
    },
  ],
  rules: {
    complexity: ['error', 25],
    'eslint/complexity': ['error', { max: 35 }],
    'func-style': ['error', 'declaration'],
    'import/consistent-type-specifier-style': ['error', 'prefer-inline'],
    'typescript/array-type': ['error', { default: 'array-simple' }],
    'typescript/consistent-type-definitions': ['error', 'type'],
    'typescript/no-import-type-side-effects': 'off',
    'typescript/restrict-template-expressions': 'warn',
    'typescript/strict-boolean-expressions': 'warn',
  },
});
