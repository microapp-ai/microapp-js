import * as fs from 'fs';
import type { MicroappConfig } from './types';
import { MicroappConfigValidator } from './validator';
import * as path from 'path';

export interface MicroappConfigOptions {
  rootPath?: string;
}

export class MicroappConfigManager {
  private readonly rootPath: string;

  constructor({ rootPath }: MicroappConfigOptions = {}) {
    this.rootPath = rootPath || process.cwd();
  }

  read(): MicroappConfig | null {
    const configPath = path.join(this.rootPath, 'microapp.json');

    if (!fs.existsSync(configPath)) {
      return null;
    }

    const config: MicroappConfig = JSON.parse(
      fs.readFileSync(configPath, 'utf8')
    );

    MicroappConfigValidator.validate({ config, rootPath: this.rootPath });
    return config;
  }

  write(config: MicroappConfig): void {
    MicroappConfigValidator.validate({ config, rootPath: this.rootPath });
    const configPath = path.join(this.rootPath, 'microapp.json');

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
}
