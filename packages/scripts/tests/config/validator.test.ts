import * as path from 'path';
import { InvalidConfigError, MicroappConfigValidator } from '../../src';
import * as fs from 'fs';

describe('MicroappConfigValidator', () => {
  it('does not throw if the config is valid', () => {
    const configPath = path.join(
      __dirname,
      '../fixtures/projects/01-valid/microapp.json'
    );

    const config = require(configPath);

    expect(() => {
      MicroappConfigValidator.validate({
        config,
        rootPath: path.dirname(configPath),
      });
    }).not.toThrow();
  });

  it('throws if the config file is missing', () => {
    const configPath = path.join(
      __dirname,
      '../fixtures/projects/02-missing-config-file/microapp.json'
    );

    expect(() => {
      if (!fs.existsSync(configPath)) {
        throw new InvalidConfigError(
          "The 'microapp.json' configuration file not found."
        );
      }

      const config = require(configPath);

      MicroappConfigValidator.validate({
        config,
        rootPath: path.dirname(configPath),
      });
    }).toThrow(
      new InvalidConfigError(
        "The 'microapp.json' configuration file not found."
      )
    );
  });

  it('throws if the config file is missing the name field', () => {
    const configPath = path.join(
      __dirname,
      '../fixtures/projects/03-missing-config-name/microapp.json'
    );

    const config = require(configPath);

    expect(() => {
      MicroappConfigValidator.validate({
        config,
        rootPath: path.dirname(configPath),
      });
    }).toThrow(new InvalidConfigError("The 'name' field is required."));
  });
});
