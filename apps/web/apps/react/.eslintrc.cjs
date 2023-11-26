module.exports = {
  root: true,
  extends: ['custom/react', 'custom'],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
};
