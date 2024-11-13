import * as fs from 'fs';
import * as path from 'path';
import type { MicroappConfig } from './types';
import { InvalidConfigError } from './errors';
import { MicroappConfigValidator } from './validator';

export interface MicroappConfigOptions {
  rootPath?: string;
}

export class MicroappConfigReader {
  static readonly DEFAULT_FILENAME = 'microapp.json';

  private rootPath: string;

  constructor({ rootPath }: MicroappConfigOptions = {}) {
    this.rootPath = rootPath || path.resolve(process.cwd());
  }

  read(): MicroappConfig {
    const configPath = path.resolve(
      this.rootPath,
      MicroappConfigReader.DEFAULT_FILENAME
    );

    if (!fs.existsSync(configPath)) {
      throw new InvalidConfigError(
        `The '${MicroappConfigReader.DEFAULT_FILENAME}' configuration file not found.`
      );
    }

    const config: MicroappConfig = JSON.parse(
      fs.readFileSync(configPath, 'utf8')
    );

    MicroappConfigValidator.validate(config, { rootPath: this.rootPath });

    return config;
  }
}
