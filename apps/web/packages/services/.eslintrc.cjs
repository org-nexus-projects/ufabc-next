module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2015,
    sourceType: 'module',
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    extraFileExtensions: ['.json'],
  },
};
