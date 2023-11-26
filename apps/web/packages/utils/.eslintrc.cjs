module.exports = {
  root: true,
  extends: ['custom/react'],
  parserOptions: {
    sourceType: 'module',
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    extraFileExtensions: ['.json'],
  },
};
