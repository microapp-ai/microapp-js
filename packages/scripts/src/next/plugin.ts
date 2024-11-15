import type { Compiler } from 'webpack';
import { NextFederationPlugin } from '@module-federation/nextjs-mf';
import { MicroappConfigReader } from '../config';
import type { MicroappConfigOptions } from '../config';

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

  constructor(private readonly options: MicroappConfigOptions = {}) {}

  apply(compiler: Compiler) {
    const configReader = new MicroappConfigReader(this.options);
    const config = configReader.read();

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

    new NextFederationPlugin(federationConfig).apply(compiler);
  }
}
