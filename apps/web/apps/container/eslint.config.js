import vueConfig from 'eslint-config-custom/vue';

export default [
  ...vueConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      'no-console': 'warn',
      'no-debugger': 'warn',
    },
  },
];
