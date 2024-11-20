import * as path from 'path';
import { MicroappNextFederationPlugin } from '../../src';
import type { Compiler } from 'webpack';

jest.mock('@module-federation/nextjs-mf', () => {
  return {
    NextFederationPlugin: jest.fn().mockImplementation(() => {
      return {
        apply: jest.fn(),
      };
    }),
  };
});

describe('MicroappNextFederationPlugin', () => {
  it('passes the correct config to the plugin', () => {
    const mockedCompiler = {
      hooks: {
        done: {
          tap: jest.fn(),
        },
      },
      options: {
        plugins: [],
      },
    } as unknown as Compiler;

    const plugin = new MicroappNextFederationPlugin({
      rootPath: path.resolve(__dirname, '../fixtures/projects/01-valid'),
    });

    plugin.apply(mockedCompiler);

    expect(
      require('@module-federation/nextjs-mf').NextFederationPlugin
    ).toHaveBeenCalledWith({
      name: '01-valid',
      filename: 'static/chunks/microapp-remote.js',
      exposes: {
        './Microapp': './index.js',
      },
      shared: {},
      extraOptions: {
        enableImageLoaderFix: true,
        enableUrlLoaderFix: true,
        skipSharingNextInternals: false,
        automaticPageStitching: false,
      },
    });
  });
});
