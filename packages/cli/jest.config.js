/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.(js|ts)'],
  transform: {
    '\\.[jt]sx?$': './jest-transformer.js',
  },
  moduleNameMapper: {
    '^@microapp-io/cli$': '<rootDir>/index.ts',
  },
};
