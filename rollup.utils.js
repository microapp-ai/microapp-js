const path = require('path');
const fse = require('fs-extra');
const { version } = require('./package.json');
const majorVersion = version.split('.').shift();

const PRETTY = !!process.env.PRETTY;

/**
 * Determine the relevant directories for a rollup build, relative to the
 * current working directory and taking LOCAL_BUILD_DIRECTORY into account
 *
 * ROOT_DIR     Root directory for the repo
 * SOURCE_DIR   Source package directory we will read input files from
 * OUTPUT_DIR   Destination directory to write rollup output to
 *
 * @param {string} packageName  npm package name (i.e., @microapp-io/auth)
 * @param {string} [folderName] folder name (i.e., react). Defaults to package name
 */
function getBuildDirectories(packageName, folderName) {
  let ROOT_DIR = __dirname;
  let PKG_DIR = folderName
    ? path.join(__dirname, 'packages', folderName)
    : path.join(__dirname, 'packages', ...packageName.split('/'));

  let SOURCE_DIR = path.join(PKG_DIR, 'src');

  // Update if we're not running from root
  if (process.cwd() !== __dirname) {
    ROOT_DIR = path.dirname(path.dirname(process.cwd()));
    PKG_DIR = process.cwd();
    SOURCE_DIR = path.join(PKG_DIR, 'src');
  }

  let OUTPUT_DIR = path.join(SOURCE_DIR, '../', 'dist');

  if (process.env.LOCAL_BUILD_DIRECTORY) {
    try {
      let nodeModulesDir = path.resolve(
        process.env.LOCAL_BUILD_DIRECTORY,
        'node_modules'
      );
      fse.readdirSync(nodeModulesDir);
      OUTPUT_DIR = path.join(nodeModulesDir, ...packageName.split('/'), 'dist');
    } catch (e) {
      console.error(
        'Oops! You pointed LOCAL_BUILD_DIRECTORY to a directory that ' +
          'does not have a node_modules/ folder. Please `npm install` in that ' +
          'directory and try again.'
      );
      process.exit(1);
    }
  }

  return { ROOT_DIR, PKG_DIR, SOURCE_DIR, OUTPUT_DIR };
}

function createBanner(packageName, version) {
  return `/**
 * ${packageName} v${version}
 *
 * Copyright (c) 2023-2024 Microapp.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */`;
}

// Babel plugin to replace `const MICROAPP_JS_VERSION = "0.0.0";` with the
// current version at build time, so we can set it on `window.__microappJsVersion`
// for consumption by the Core Web Vitals Technology Report
function babelPluginReplaceVersionPlaceholder() {
  return function (babel) {
    var t = babel.types;

    const KIND = 'const';
    const NAME = 'MICROAPP_JS_VERSION';
    const PLACEHOLDER = '__MICROAPP_JS_VERSION_PLACEHOLDER__';

    return {
      visitor: {
        VariableDeclaration: {
          enter: function (path) {
            // Only operate on top-level variables
            if (!path.parentPath.isProgram()) {
              return;
            }

            let { kind, declarations } = path.node;
            if (
              kind === KIND &&
              declarations.length === 1 &&
              declarations[0].id.name === NAME &&
              declarations[0].init?.value === PLACEHOLDER
            ) {
              path.replaceWith(
                t.variableDeclaration(KIND, [
                  t.variableDeclarator(
                    t.identifier(NAME),
                    t.stringLiteral(majorVersion)
                  ),
                ])
              );
            }
          },
        },
      },
    };
  };
}

// Post-build plugin to validate that the version placeholder was replaced
function validateReplacedVersion() {
  return {
    name: 'validate-replaced-version',
    writeBundle(_, bundle) {
      Object.entries(bundle).forEach(([filename, contents]) => {
        if (!filename.endsWith('.js')) {
          return;
        }

        let requiredStrs = filename.endsWith('.min.js')
          ? [`{window.__microappJsVersion="${majorVersion}"}`]
          : [
              `const MICROAPP_JS_VERSION = "${majorVersion}";`,
              `window.__microappJsVersion = MICROAPP_JS_VERSION;`,
            ];

        requiredStrs.forEach((str) => {
          if (!contents.code.includes(str)) {
            throw new Error(
              `Expected ${filename} to include \`${str}\` but it did not`
            );
          }
        });
      });
    },
  };
}

// rollup.config.js
module.exports = {
  getBuildDirectories,
  createBanner,
  babelPluginReplaceVersionPlaceholder,
  validateReplacedVersion,
  PRETTY,
};
