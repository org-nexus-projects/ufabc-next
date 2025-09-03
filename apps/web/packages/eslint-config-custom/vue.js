import tanstackQueryPlugin from '@tanstack/eslint-plugin-query';
import parserTypeScript from '@typescript-eslint/parser';
import vuePlugin from 'eslint-plugin-vue';
import globals from 'globals';
import vueEslintParser from 'vue-eslint-parser';

import baseConfig from './base.js';

export default [
  ...baseConfig,
  ...vuePlugin.configs['flat/recommended'],
  ...tanstackQueryPlugin.configs['flat/recommended'],

  // ESLint for Vue files
  {
    files: ['*.vue', '**/*.vue'],
    languageOptions: {
      parser: vueEslintParser,
      parserOptions: {
        parser: parserTypeScript,
        sourceType: 'module',
        globals: {
          ...globals.browser,
          ...globals.vitest,
        },
        extraFileExtensions: ['.vue'],
      },
    },
  },

  {
    files: ['*.vue', '**/*.vue'],
    rules: {
      'vue/no-unused-components': 'error',
      'vue/no-unused-refs': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/require-explicit-emits': 'error',
      'vue/component-definition-name-casing': ['error', 'PascalCase'],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/max-attributes-per-line': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-indent': 'off',
      'vue/html-self-closing': 'off',
    },
  },

  // Test files configuration
  {
    files: [
      '**/__tests__/*.{j,t}s?(x)',
      '**/tests/unit/**/*.spec.{j,t}s?(x)',
      '**/*.test.{j,t}s?(x)',
      '**/test-utils.ts',
      '**/setup-tests.ts',
    ],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  {
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-control-regex': 'off',
      'no-case-declarations': 'off',
    },
  },
];
