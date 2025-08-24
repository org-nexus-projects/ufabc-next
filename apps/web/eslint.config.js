import baseConfig from 'eslint-config-custom/base';

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
