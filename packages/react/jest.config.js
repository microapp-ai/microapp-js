/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/*.test.[jt]s?(x)'],
  transform: {
    '\\.[jt]sx?$': './jest-transformer.js',
  },
  globals: {
    __DEV__: true,
  },
  moduleNameMapper: {
    '^@microapp-io/auth$': '<rootDir>/../auth/index.ts',
    '^@microapp-io/react$': '<rootDir>/index.tsx',
  },
};
