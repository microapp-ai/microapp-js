const path = require('path');
const babel = require('@rollup/plugin-babel').default;
const typescript = require('@rollup/plugin-typescript');
const copy = require('rollup-plugin-copy');
const extensions = require('rollup-plugin-extensions');
const prettier = require('rollup-plugin-prettier');
const { terser } = require('rollup-plugin-terser');

const {
  createBanner,
  getBuildDirectories,
  PRETTY,
} = require('../../rollup.utils');
const { name, version } = require('./package.json');

function getRollupConfig(
  format,
  filename,
  { includeTypesAndCopy, minify } = {}
) {
  const { ROOT_DIR, PKG_DIR, SOURCE_DIR, OUTPUT_DIR } = getBuildDirectories(
    name,
    'user-preferences'
  );

  const banner = createBanner('@microapp-io/user-preferences', version);

  return {
    input: `${SOURCE_DIR}/index.ts`,
    output: {
      file: `${OUTPUT_DIR}/${filename}`,
      format,
      sourcemap: !PRETTY,
      banner,
      ...(format === 'umd'
        ? {
            name: 'MicroappUserPreferences',
            globals: {
              '@microapp-io/runtime': 'MicroappRuntime',
            },
          }
        : {}),
    },
    external: ['@microapp-io/runtime'],
    plugins: [
      extensions({ extensions: ['.ts'] }),
      babel({
        babelHelpers: 'bundled',
        exclude: /node_modules/,
        presets: [
          ['@babel/preset-env', { loose: true }],
          '@babel/preset-typescript',
        ],
        extensions: ['.ts'],
      }),
      ...(includeTypesAndCopy === true
        ? [
            typescript({
              tsconfig: path.join(__dirname, 'tsconfig.json'),
              exclude: ['tests'],
              noEmitOnError: true,
            }),
            copy({
              targets: [
                { src: path.join(ROOT_DIR, 'LICENSE.md'), dest: PKG_DIR },
              ],
              verbose: true,
            }),
          ]
        : []),
      ...(minify === true ? [terser()] : []),
    ].concat(PRETTY ? prettier({ parser: 'babel' }) : []),
  };
}

module.exports = function rollup() {
  return [
    getRollupConfig('esm', 'index.js', { includeTypesAndCopy: true }),
    getRollupConfig('cjs', 'main.js'),
    getRollupConfig('umd', 'umd/user-preferences.development.js'),
    getRollupConfig('umd', 'umd/user-preferences.production.min.js', {
      minify: true,
    }),
  ];
};
