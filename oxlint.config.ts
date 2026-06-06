import core from "ultracite/oxlint/core";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [core],
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
    },
    {
      files: ["apps/extension/**/*.ts", "apps/extension/**/*.vue"],
      env: {
        webextensions: true,
        browser: true,
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
