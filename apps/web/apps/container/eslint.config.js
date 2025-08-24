import vueConfig from 'eslint-config-custom/vue';
import globals from 'globals';

export default [
  ...vueConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.vitest,
      },
    },
  },
];
