import { sxzz as eslintConfig } from '@sxzz/eslint-config';

export default eslintConfig(
  {
    ignores: ['node_modules/*', 'dist/*', 'out/*'],
    rules: {
      '@typescript-eslint/no-redeclare': ['off'],
      '@typescript-eslint/method-signature-style': ['off'],
      'import/no-default-export': ['off'],
      'no-restricted-syntax': ['off'],
      'unicorn/filename-case': ['off'],
      'node/prefer-global/process': ['off'],
    },
  },
  { prettier: false },
);
