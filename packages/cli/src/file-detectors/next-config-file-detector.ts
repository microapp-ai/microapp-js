import type { MicroappFileDetector } from '../file-detector';
import * as path from 'path';
import * as fs from 'fs';

export class MicroappNextConfigFileDetector implements MicroappFileDetector {
  static readonly DEFAULT_CONFIG_FILENAME = 'next.config.js';
  static readonly CONFIG_FILES = [
    'next.config.js',
    'next.config.mjs',
    'next.config.ts',
  ];

  getExistingFilePathByFolderPathOrDefault(
    folderPath: string,
    defaultPath?: string
  ): string {
    const configFilePath = MicroappNextConfigFileDetector.CONFIG_FILES.map(
      (configFile) => {
        const filePath = path.join(folderPath, configFile);
        return filePath;
      }
    ).find((filePath) => fs.existsSync(filePath));

    if (!configFilePath) {
      return (
        defaultPath || MicroappNextConfigFileDetector.DEFAULT_CONFIG_FILENAME
      );
    }

    return configFilePath;
  }
}
