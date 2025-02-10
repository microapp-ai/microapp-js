const path = require('path');
const babel = require('@rollup/plugin-babel').default;
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
    'runtime'
  );

  const banner = createBanner('Microapp Runtime', version);

  // JS modules for bundlers
  const modules = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/index.js`,
        format: 'esm',
        sourcemap: !PRETTY,
        banner,
      },
      external: ['react'],
      plugins: [
        extensions({ extensions: ['.ts', '.tsx'] }),
        babel({
          babelHelpers: 'bundled',
          exclude: /node_modules/,
          presets: [
            ['@babel/preset-env', { loose: true }],
            '@babel/preset-react',
            '@babel/preset-typescript',
          ],
          plugins: ['babel-plugin-dev-expression'],
          extensions: ['.ts', '.tsx'],
        }),
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
      ].concat(PRETTY ? prettier({ parser: 'babel' }) : []),
    },
  ];

  // JS modules for <script type=module>
  const webModules = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/runtime.development.js`,
        format: 'esm',
        sourcemap: !PRETTY,
        banner,
      },
      external: ['react'],
      plugins: [
        extensions({ extensions: ['.ts', '.tsx'] }),
        babel({
          babelHelpers: 'bundled',
          exclude: /node_modules/,
          presets: [
            '@babel/preset-modules',
            '@babel/preset-react',
            '@babel/preset-typescript',
          ],
          plugins: ['babel-plugin-dev-expression'],
          extensions: ['.ts', '.tsx'],
        }),
        replace({
          preventAssignment: true,
          values: {
            'process.env.NODE_ENV': JSON.stringify('development'),
          },
        }),
      ].concat(PRETTY ? prettier({ parser: 'babel' }) : []),
    },
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/runtime.production.min.js`,
        format: 'esm',
        sourcemap: !PRETTY,
        banner,
      },
      external: ['react'],
      plugins: [
        extensions({ extensions: ['.ts', '.tsx'] }),
        babel({
          babelHelpers: 'bundled',
          exclude: /node_modules/,
          presets: [
            ['@babel/preset-modules', { loose: true }],
            ['@babel/preset-react', { useBuiltIns: true }],
            '@babel/preset-typescript',
          ],
          plugins: ['babel-plugin-dev-expression'],
          extensions: ['.ts', '.tsx'],
        }),
        replace({
          preventAssignment: true,
          values: {
            'process.env.NODE_ENV': JSON.stringify('production'),
          },
        }),
        terser({ ecma: 8, safari10: true }),
      ].concat(PRETTY ? prettier({ parser: 'babel' }) : []),
    },
  ];

  // UMD modules for <script> tags and CommonJS (node)
  const globals = [
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/umd/runtime.development.js`,
        format: 'umd',
        sourcemap: !PRETTY,
        banner,
        globals: {
          react: 'React',
        },
        name: 'MicroappRuntime',
      },
      external: ['react'],
      plugins: [
        extensions({ extensions: ['.ts', '.tsx'] }),
        babel({
          babelHelpers: 'bundled',
          exclude: /node_modules/,
          presets: [
            ['@babel/preset-env', { loose: true }],
            '@babel/preset-react',
            '@babel/preset-typescript',
          ],
          plugins: ['babel-plugin-dev-expression'],
          extensions: ['.ts', '.tsx'],
        }),
        replace({
          preventAssignment: true,
          values: {
            'process.env.NODE_ENV': JSON.stringify('development'),
          },
        }),
      ].concat(PRETTY ? prettier({ parser: 'babel' }) : []),
    },
    {
      input: `${SOURCE_DIR}/index.ts`,
      output: {
        file: `${OUTPUT_DIR}/umd/runtime.production.min.js`,
        format: 'umd',
        sourcemap: !PRETTY,
        banner,
        globals: {
          react: 'React',
        },
        name: 'MicroappRuntime',
      },
      external: ['react'],
      plugins: [
        extensions({ extensions: ['.ts', '.tsx'] }),
        babel({
          babelHelpers: 'bundled',
          exclude: /node_modules/,
          presets: [
            ['@babel/preset-env', { loose: true }],
            '@babel/preset-react',
            '@babel/preset-typescript',
          ],
          plugins: ['babel-plugin-dev-expression'],
          extensions: ['.ts', '.tsx'],
        }),
        replace({
          preventAssignment: true,
          values: {
            'process.env.NODE_ENV': JSON.stringify('production'),
          },
        }),
        terser(),
      ].concat(PRETTY ? prettier({ parser: 'babel' }) : []),
    },
  ];

  return [...modules, ...webModules, ...globals];
};
