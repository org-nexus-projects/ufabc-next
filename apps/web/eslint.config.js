import baseConfig from '@ufabc-next/eslint-config/base';

export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        node: true,
      },
    },
  },
];
