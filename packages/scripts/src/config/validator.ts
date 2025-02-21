import type { MicroappConfig } from './types';
import { InvalidConfigError } from './errors';
import * as path from 'path';
import * as fs from 'fs';
import { MicroappSupportedFramework } from './supported-framework';

export class MicroappConfigValidator {
  private constructor() {}

  public static validate({
    config,
    packageJson,
    rootPath,
  }: {
    config?: MicroappConfig;
    packageJson?: any;
    rootPath?: string;
  }): void {
    packageJson = this.resolvePackageJson(packageJson, rootPath);

    if (config) {
      MicroappConfigValidator.validateConfig({ config, packageJson, rootPath });
    }

    if (rootPath) {
      MicroappSupportedFramework.determineByFolderPath(rootPath);
    }
  }

  private static resolvePackageJson(
    packageJson: any,
    rootPath?: string
  ): object {
    if (packageJson) {
      return packageJson;
    }

    if (!rootPath) {
      throw new InvalidConfigError('The package.json file is missing.');
    }

    const packageJsonPath = path.resolve(rootPath, 'package.json');
    const doesPackageJsonExist = fs.existsSync(packageJsonPath);

    if (!doesPackageJsonExist) {
      throw new InvalidConfigError('The package.json file is missing.');
    }

    return require(packageJsonPath);
  }

  private static validateConfig({
    config,
  }: {
    config: MicroappConfig;
    packageJson: any;
    rootPath?: string;
  }): void {
    MicroappConfigValidator.validateConfigName(config.name);
  }

  public static validateConfigName(name: any): void {
    if (!name) {
      throw new InvalidConfigError("The 'name' field is required.");
    }

    if (typeof name !== 'string') {
      throw new InvalidConfigError("The 'name' field must be a string.");
    }

    const isNameSlug = /^[a-z0-9-_]+$/.test(name);

    if (!isNameSlug) {
      throw new InvalidConfigError(
        "The 'name' field must be a slug with lowercase letters, numbers, hyphens, and underscores. Example: 'my-microapp' or 'my_microapp'."
      );
    }
  }
}
