import core from "ultracite/oxlint/core";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [core],
  rules: {
    complexity: ['error', 25],
    'eslint/complexity': ['error', { max: 35 }],
    'func-style': ['error', 'declaration'],
    'import/consistent-type-specifier-style': ['error'],
    'typescript/array-type': ['error', { default: 'array-simple' }],
    'typescript/consistent-type-definitions': ['error', 'type'],
  },
  ignorePatterns: [
    ...(core.ignorePatterns ?? []),
    "**/tmp",
    "**/temp",
    "**/debug.js",
    "stats.html",
    "stats-*.json",
    "codegen.ts",
    "**/assets/**/*.js",
    "**/assets/**/*.css",
    "**/assets/**/*.html",
    "**/*.min.*",
  ],
  options: {
    typeAware: true,
    typeCheck: false,
  },
  overrides: [
    {
      files: ["apps/core/**/*.ts"],
      env: {
        node: true,
        browser: false,
      },
    },
    {
      files: ["apps/container/**/*.ts", "apps/container/**/*.vue"],
      env: {
        browser: true,
      },
      rules: {
        "unicorn/filename-case": "off",
      },
    },
    {
      files: ["apps/extension/**/*.ts", "apps/extension/**/*.vue"],
      env: {
        webextensions: true,
        browser: true,
      },
      rules: {
        "unicorn/filename-case": "off",
      },
    },
    {
      files: ["packages/**/*.ts"],
      env: {
        node: true,
        browser: true,
      },
    },
  ],
});
