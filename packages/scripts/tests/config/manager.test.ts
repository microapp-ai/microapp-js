import * as path from 'path';
import { InvalidConfigError, MicroappConfigManager } from '../../src';

describe('MicroappConfigReader', () => {
  it('reads the config from the microapp.json file', () => {
    const reader = new MicroappConfigManager({
      rootPath: path.join(__dirname, '../fixtures/projects/01-valid'),
    });
    const config = reader.read();
    expect(config).toBeDefined();
  });

  it('returns null if the config file is missing', () => {
    const reader = new MicroappConfigManager({
      rootPath: path.join(
        __dirname,
        '../fixtures/projects/02-missing-config-file'
      ),
    });

    expect(reader.read()).toBeNull();
  });

  it('throws if the config file is missing the name field', () => {
    const reader = new MicroappConfigManager({
      rootPath: path.join(
        __dirname,
        '../fixtures/projects/03-missing-config-name'
      ),
    });

    expect(() => reader.read()).toThrow(
      new InvalidConfigError("The 'name' field is required.")
    );
  });
});
