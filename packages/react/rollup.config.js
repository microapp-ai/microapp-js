const path = require('path');
const babel = require('@rollup/plugin-babel').default;
const copy = require('rollup-plugin-copy');
const extensions = require('rollup-plugin-extensions');
const prettier = require('rollup-plugin-prettier');
const replace = require('@rollup/plugin-replace');
const { terser } = require('rollup-plugin-terser');
const typescript = require('@rollup/plugin-typescript');
const {
  babelPluginReplaceVersionPlaceholder,
  createBanner,
  getBuildDirectories,
  validateReplacedVersion,
  PRETTY,
} = require('../../rollup.utils');
const { name, version } = require('./package.json');

module.exports = function rollup() {
  const { ROOT_DIR, PKG_DIR, SOURCE_DIR, OUTPUT_DIR } = getBuildDirectories(
    name,
    'react'
  );
  const banner = createBanner('Microapp React', version);

  // JS modules for bundlers
  const modules = [
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/index.js`,
        format: 'esm',
        sourcemap: !PRETTY,
        banner,
      },
      external: ['react', 'react-dom', '@microapp-io/auth'],
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
          plugins: [
            'babel-plugin-dev-expression',
            babelPluginReplaceVersionPlaceholder(),
          ],
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
        validateReplacedVersion(),
      ].concat(PRETTY ? prettier({ parser: 'babel' }) : []),
    },
  ];

  // JS modules for <script type=module>
  // Note: These are experimental. You may not even get them to work
  // unless you are using a React build with JS modules like es-react.
  const webModules = [
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/react.development.js`,
        format: 'esm',
        sourcemap: !PRETTY,
        banner,
      },
      external: ['react', '@microapp-io/auth'],
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
          plugins: [
            'babel-plugin-dev-expression',
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: ['.ts', '.tsx'],
        }),
        replace({
          preventAssignment: true,
          values: { 'process.env.NODE_ENV': JSON.stringify('development') },
        }),
        validateReplacedVersion(),
      ].concat(PRETTY ? prettier({ parser: 'babel' }) : []),
    },
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/react.production.min.js`,
        format: 'esm',
        sourcemap: !PRETTY,
        banner,
      },
      external: ['react', '@microapp-io/auth'],
      plugins: [
        extensions({ extensions: ['.ts', '.tsx'] }),
        babel({
          babelHelpers: 'bundled',
          exclude: /node_modules/,
          presets: [
            [
              '@babel/preset-modules',
              {
                // Don't spoof `.name` for Arrow Functions, which breaks when minified anyway.
                loose: true,
              },
            ],
            [
              '@babel/preset-react',
              {
                // Compile JSX Spread to Object.assign(), which is reliable in ESM browsers.
                useBuiltIns: true,
              },
            ],
            '@babel/preset-typescript',
          ],
          plugins: [
            'babel-plugin-dev-expression',
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: ['.ts', '.tsx'],
        }),
        replace({
          preventAssignment: true,
          values: { 'process.env.NODE_ENV': JSON.stringify('production') },
        }),
        validateReplacedVersion(),
        terser({ ecma: 8, safari10: true }),
      ].concat(PRETTY ? prettier({ parser: 'babel' }) : []),
    },
  ];

  // UMD modules for <script> tags and CommonJS (node)
  const globals = [
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/umd/react.development.js`,
        format: 'umd',
        sourcemap: !PRETTY,
        banner,
        globals: {
          '@microapp-io/auth': 'MicroappAuth',
          react: 'React',
        },
        name: 'MicroappReact',
      },
      external: ['react', '@microapp-io/auth'],
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
          plugins: [
            'babel-plugin-dev-expression',
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: ['.ts', '.tsx'],
        }),
        replace({
          preventAssignment: true,
          values: { 'process.env.NODE_ENV': JSON.stringify('development') },
        }),
        validateReplacedVersion(),
      ].concat(PRETTY ? prettier({ parser: 'babel' }) : []),
    },
    {
      input: `${SOURCE_DIR}/index.tsx`,
      output: {
        file: `${OUTPUT_DIR}/umd/react.production.min.js`,
        format: 'umd',
        sourcemap: !PRETTY,
        banner,
        globals: {
          '@microapp-io/auth': 'MicroappAuth',
          react: 'React',
        },
        name: 'MicroappReact',
      },
      external: ['react', '@microapp-io/auth'],
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
          plugins: [
            'babel-plugin-dev-expression',
            babelPluginReplaceVersionPlaceholder(),
          ],
          extensions: ['.ts', '.tsx'],
        }),
        replace({
          preventAssignment: true,
          values: { 'process.env.NODE_ENV': JSON.stringify('production') },
        }),
        terser(),
        validateReplacedVersion(),
      ].concat(PRETTY ? prettier({ parser: 'babel' }) : []),
    },
  ];

  // Node entry points
  const node = [
    {
      input: `${SOURCE_DIR}/node-main.js`,
      output: {
        file: `${OUTPUT_DIR}/main.js`,
        format: 'cjs',
        banner,
      },
      plugins: [].concat(PRETTY ? prettier({ parser: 'babel' }) : []),
    },
  ];

  return [...modules, ...webModules, ...globals, ...node];
};

/**
 * @typedef {import('rollup').InputOptions} RollupInputOptions
 * @typedef {import('rollup').OutputOptions} RollupOutputOptions
 * @typedef {import('rollup').RollupOptions} RollupOptions
 * @typedef {import('rollup').Plugin} RollupPlugin
 */
