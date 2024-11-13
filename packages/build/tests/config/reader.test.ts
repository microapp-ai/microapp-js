import * as path from 'path';
import { InvalidConfigError, MicroappConfigReader } from '../../src';

describe('MicroappConfigReader', () => {
  it('throws if the config file is missing', () => {
    const reader = new MicroappConfigReader({
      rootPath: path.join(
        __dirname,
        '../fixtures/projects/02-missing-config-file'
      ),
    });

    expect(() => reader.read()).toThrow(
      new InvalidConfigError(
        "The 'microapp.json' configuration file not found."
      )
    );
  });

  it('throws if the config file is missing the name field', () => {
    const reader = new MicroappConfigReader({
      rootPath: path.join(
        __dirname,
        '../fixtures/projects/03-missing-config-name'
      ),
    });

    expect(() => reader.read()).toThrow(
      new InvalidConfigError("The 'name' field is required in microapp.json.")
    );
  });

  it('throws if the config file is missing the entryComponent field', () => {
    const reader = new MicroappConfigReader({
      rootPath: path.join(
        __dirname,
        '../fixtures/projects/04-missing-config-entry-component'
      ),
    });

    expect(() => reader.read()).toThrow(
      new InvalidConfigError(
        "The 'entryComponent' field is required in microapp.json."
      )
    );
  });

  it('throws if the entryComponent is not a valid path', () => {
    const reader = new MicroappConfigReader({
      rootPath: path.join(
        __dirname,
        '../fixtures/projects/05-missing-component-file'
      ),
    });

    expect(() => reader.read()).toThrow(
      new InvalidConfigError("The 'entryComponent' field must be a valid path.")
    );
  });

  it('throws if the entryComponent does not have a default export', () => {
    const reader = new MicroappConfigReader({
      rootPath: path.join(
        __dirname,
        '../fixtures/projects/06-missing-component-default-export'
      ),
    });

    expect(() => reader.read()).toThrow(
      new InvalidConfigError(
        "The 'entryComponent' must export a default function."
      )
    );
  });

  it('throws if the shared library is not a dependency', () => {
    const reader = new MicroappConfigReader({
      rootPath: path.join(
        __dirname,
        '../fixtures/projects/07-missing-shared-library'
      ),
    });

    expect(() => reader.read()).toThrow(
      new InvalidConfigError(
        "The 'react' package is not listed in the package.json."
      )
    );
  });

  it('throws if the shared library version is not satisfied', () => {
    const reader = new MicroappConfigReader({
      rootPath: path.join(
        __dirname,
        '../fixtures/projects/08-mismatching-shared-library-version'
      ),
    });

    expect(() => reader.read()).toThrow(
      new InvalidConfigError(
        "The 'react' package version '^17.0.0' does not satisfy the constraint '^18.3.1'."
      )
    );
  });

  it('reads the config from the microapp.json file', () => {
    const reader = new MicroappConfigReader({
      rootPath: path.join(__dirname, '../fixtures/projects/01-valid'),
    });
    const config = reader.read();
    expect(config).toBeDefined();
  });
});
