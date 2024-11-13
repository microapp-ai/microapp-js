import * as path from 'path';
import { InvalidConfigError, MicroappConfigValidator } from '../../src';
import * as fs from 'fs';

describe('MicroappConfigValidator', () => {
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

      MicroappConfigValidator.validate(config, {
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
      MicroappConfigValidator.validate(config, {
        rootPath: path.dirname(configPath),
      });
    }).toThrow(
      new InvalidConfigError("The 'name' field is required in microapp.json.")
    );
  });

  it('throws if the config file is missing the entryComponent field', () => {
    const configPath = path.join(
      __dirname,
      '../fixtures/projects/04-missing-config-entry-component/microapp.json'
    );

    const config = require(configPath);

    expect(() => {
      MicroappConfigValidator.validate(config, {
        rootPath: path.dirname(configPath),
      });
    }).toThrow(
      new InvalidConfigError(
        "The 'entryComponent' field is required in microapp.json."
      )
    );
  });

  it('throws if the entryComponent is not a valid path', () => {
    const configPath = path.join(
      __dirname,
      '../fixtures/projects/05-missing-component-file/microapp.json'
    );

    const config = require(configPath);

    expect(() => {
      MicroappConfigValidator.validate(config, {
        rootPath: path.dirname(configPath),
      });
    }).toThrow(
      new InvalidConfigError("The 'entryComponent' field must be a valid path.")
    );
  });

  it('throws if the entryComponent does not have a default export', () => {
    const configPath = path.join(
      __dirname,
      '../fixtures/projects/06-missing-component-default-export/microapp.json'
    );

    const config = require(configPath);

    expect(() => {
      MicroappConfigValidator.validate(config, {
        rootPath: path.dirname(configPath),
      });
    }).toThrow(
      new InvalidConfigError(
        "The 'entryComponent' must export a default function."
      )
    );
  });

  it('throws if the shared library is not a dependency', () => {
    const configPath = path.join(
      __dirname,
      '../fixtures/projects/07-missing-shared-library/microapp.json'
    );

    const config = require(configPath);

    expect(() => {
      MicroappConfigValidator.validate(config, {
        rootPath: path.dirname(configPath),
      });
    }).toThrow(
      new InvalidConfigError(
        "The 'react' package is not listed in the package.json."
      )
    );
  });

  it('throws if the shared library version is not satisfied', () => {
    const configPath = path.join(
      __dirname,
      '../fixtures/projects/08-mismatching-shared-library-version/microapp.json'
    );

    const config = require(configPath);

    expect(() => {
      MicroappConfigValidator.validate(config, {
        rootPath: path.dirname(configPath),
      });
    }).toThrow(
      new InvalidConfigError(
        "The 'react' package version '^17.0.0' does not satisfy the constraint '^18.3.1'."
      )
    );
  });

  it('does not throw if the config is valid', () => {
    const configPath = path.join(
      __dirname,
      '../fixtures/projects/01-valid/microapp.json'
    );

    const config = require(configPath);

    expect(() => {
      MicroappConfigValidator.validate(config, {
        rootPath: path.dirname(configPath),
      });
    }).not.toThrow();
  });
});
