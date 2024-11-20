import type { Compiler } from 'webpack';
import type { MicroappConfigOptions } from '../config';
import { MicroappConfigManager } from '../config';

export class MicroappNextFederationPlugin {
  static readonly DEFAULT_NAME = 'microapp';
  static readonly DEFAULT_FILENAME = 'static/chunks/remoteEntry.js';
  static readonly DEFAULT_EXPOSED_COMPONENT_ID = './Microapp';
  static readonly DEFAULT_SHARED = {};
  static readonly DEFAULT_EXTRA_OPTIONS = {
    enableImageLoaderFix: true,
    enableUrlLoaderFix: true,
    skipSharingNextInternals: false,
    automaticPageStitching: false,
  };

  constructor(private readonly options: MicroappConfigOptions = {}) {
    // NB: This is a hack to enable local webpack mode for the plugin
    process.env.NEXT_PRIVATE_LOCAL_WEBPACK = 'true';
  }

  apply(compiler: Compiler) {
    const configReader = new MicroappConfigManager(this.options);
    const config = configReader.read();

    if (!config) {
      throw new Error('Microapp config not found');
    }

    const isServer: boolean =
      (typeof compiler.options.target === 'string' &&
        compiler.options.target.includes('node')) ||
      (Array.isArray(compiler.options.target) &&
        !!compiler.options.target.find((target) => target.includes('node'))) ||
      !!compiler.options.name?.includes('server');

    if (isServer) {
      console.warn(
        'The MicroappNextFederationPlugin should only be used in client builds.'
      );
    }

    const federationConfig = {
      name: config.name || MicroappNextFederationPlugin.DEFAULT_NAME,
      filename: MicroappNextFederationPlugin.DEFAULT_FILENAME,
      exposes: {
        [MicroappNextFederationPlugin.DEFAULT_EXPOSED_COMPONENT_ID]:
          config.entryComponent,
      },
      shared: config.shared || MicroappNextFederationPlugin.DEFAULT_SHARED,
      extraOptions: MicroappNextFederationPlugin.DEFAULT_EXTRA_OPTIONS,
    };

    // NB: This is a hack to ensure that the externals are correctly ordered
    const externals = compiler.options.externals;

    if (Array.isArray(externals)) {
      const externalFunctions = externals.find((external) => {
        return typeof external === 'function';
      });

      if (externalFunctions) {
        externals.splice(externals.indexOf(externalFunctions), 1);
        externals.unshift(externalFunctions);
      }
    }

    console.info(
      'Building Microapp with the following federation config:',
      federationConfig
    );

    const { NextFederationPlugin } = require('@module-federation/nextjs-mf');
    new NextFederationPlugin(federationConfig).apply(compiler);
  }
}
