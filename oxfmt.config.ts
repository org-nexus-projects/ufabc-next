import { defineConfig } from 'oxfmt';
import ultracite from 'ultracite/oxfmt';

export default defineConfig({
  ...ultracite,
  ignorePatterns: [
    ...(ultracite.ignorePatterns ?? []),
    'stats.html',
    'stats-*.json',
    'web-ext.config.ts',
    '**/tmp',
    '**/temp',
    'codegen.ts',
    '**/*.min.*',
    '**/assets/**/*.{js,css,html}',
    'auto-imports.d.ts',
    'components.d.ts',
  ],
  singleQuote: true,
});
