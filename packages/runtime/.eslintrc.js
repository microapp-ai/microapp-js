module.exports = {
  extends: ['../../.eslintrc.js'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  env: {
    browser: true,
    commonjs: true,
  },
  globals: {
    __DEV__: true,
  },
  rules: {
    strict: 0,
  },
};
