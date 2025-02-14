const path = require('path');
const copy = require('rollup-plugin-copy');
const extensions = require('rollup-plugin-extensions');
const prettier = require('rollup-plugin-prettier');
const replace = require('@rollup/plugin-replace');
const { terser } = require('rollup-plugin-terser');
const typescript = require('@rollup/plugin-typescript');
const {
  createBanner,
  getBuildDirectories,
  PRETTY,
} = require('../../rollup.utils');
const { name, version } = require('./package.json');

module.exports = function rollup() {
  const { ROOT_DIR, PKG_DIR, SOURCE_DIR, OUTPUT_DIR } = getBuildDirectories(
    name,
    'user-preferences'
  );

  const banner = createBanner('Microapp User Preferences', version);

  const modules = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/index.js`,
        format: 'esm',
        sourcemap: !PRETTY,
        banner,
      },
      external: ['@microapp-io/runtime'],
      plugins: [
        extensions({ extensions: ['.ts'] }),
        typescript({
          tsconfig: path.join(__dirname, 'tsconfig.json'),
          exclude: ['tests'],
          noEmitOnError: true,
        }),
        copy({
          targets: [{ src: path.join(ROOT_DIR, 'LICENSE.md'), dest: PKG_DIR }],
          verbose: true,
        }),
        replace({
          preventAssignment: true,
          values: {
            'process.env.NODE_ENV': JSON.stringify('production'),
          },
        }),
      ].concat(PRETTY ? prettier({ parser: 'typescript' }) : []),
    },
  ];

  const webModules = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/user-preferences.development.js`,
        format: 'esm',
        sourcemap: !PRETTY,
        banner,
      },
      external: ['@microapp-io/runtime'],
      plugins: [
        extensions({ extensions: ['.ts'] }),
        typescript({
          tsconfig: path.join(__dirname, 'tsconfig.json'),
          exclude: ['tests'],
          noEmitOnError: true,
        }),
        replace({
          preventAssignment: true,
          values: {
            'process.env.NODE_ENV': JSON.stringify('development'),
          },
        }),
      ].concat(PRETTY ? prettier({ parser: 'typescript' }) : []),
    },
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/user-preferences.production.min.js`,
        format: 'esm',
        sourcemap: !PRETTY,
        banner,
      },
      external: ['@microapp-io/runtime'],
      plugins: [
        extensions({ extensions: ['.ts'] }),
        typescript({
          tsconfig: path.join(__dirname, 'tsconfig.json'),
          exclude: ['tests'],
          noEmitOnError: true,
        }),
        replace({
          preventAssignment: true,
          values: {
            'process.env.NODE_ENV': JSON.stringify('production'),
          },
        }),
        terser({ ecma: 8, safari10: true }),
      ].concat(PRETTY ? prettier({ parser: 'typescript' }) : []),
    },
  ];

  const globals = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/umd/user-preferences.development.js`,
        format: 'umd',
        sourcemap: !PRETTY,
        banner,
        name: 'MicroappUserPreferences',
        globals: {
          '@microapp-io/runtime': 'MicroappRuntime',
        },
      },
      external: ['@microapp-io/runtime'],
      plugins: [
        extensions({ extensions: ['.ts'] }),
        typescript({
          tsconfig: path.join(__dirname, 'tsconfig.json'),
          exclude: ['tests'],
          noEmitOnError: true,
        }),
        replace({
          preventAssignment: true,
          values: {
            'process.env.NODE_ENV': JSON.stringify('development'),
          },
        }),
      ].concat(PRETTY ? prettier({ parser: 'typescript' }) : []),
    },
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/umd/user-preferences.production.min.js`,
        format: 'umd',
        sourcemap: !PRETTY,
        banner,
        name: 'MicroappUserPreferences',
        globals: {
          '@microapp-io/runtime': 'MicroappRuntime',
        },
      },
      external: ['@microapp-io/runtime'],
      plugins: [
        extensions({ extensions: ['.ts'] }),
        typescript({
          tsconfig: path.join(__dirname, 'tsconfig.json'),
          exclude: ['tests'],
          noEmitOnError: true,
        }),
        replace({
          preventAssignment: true,
          values: {
            'process.env.NODE_ENV': JSON.stringify('production'),
          },
        }),
        terser(),
      ].concat(PRETTY ? prettier({ parser: 'typescript' }) : []),
    },
  ];

  return [...modules, ...webModules, ...globals];
};
