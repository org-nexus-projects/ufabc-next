import { sxzz } from '@sxzz/eslint-config';

export default sxzz(
  { ignores: ['node_modules/*', 'dist/*', 'out/*'] },
  { unocss: false, vue: false },
);
