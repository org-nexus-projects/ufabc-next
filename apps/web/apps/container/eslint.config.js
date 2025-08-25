import vueConfig from '@ufabc-next/eslint-config/vue';
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
