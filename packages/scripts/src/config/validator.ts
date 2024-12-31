import type { MicroappConfig } from './types';
import { InvalidConfigError } from './errors';
import * as path from 'path';
import * as semver from 'semver';
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
    packageJson,
    rootPath,
  }: {
    config: MicroappConfig;
    packageJson: any;
    rootPath?: string;
  }): void {
    MicroappConfigValidator.validateConfigName(config.name);
    MicroappConfigValidator.validateConfigEntryComponent(
      config.entryComponent,
      rootPath
    );

    MicroappConfigValidator.validateConfigDependencies(
      config.shared,
      packageJson
    );
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

  public static validateConfigEntryComponent(
    entryComponent: any,
    rootPath?: string
  ): void {
    if (!entryComponent) {
      throw new InvalidConfigError("The 'entryComponent' field is required.");
    }

    if (typeof entryComponent !== 'string') {
      throw new InvalidConfigError(
        "The 'entryComponent' field must be a string."
      );
    }

    if (!rootPath) {
      return;
    }

    const doesEntryComponentExist = fs.existsSync(
      path.resolve(rootPath, entryComponent)
    );

    if (!doesEntryComponentExist) {
      throw new InvalidConfigError(
        `The 'entryComponent' field must be a valid path of a React component file. Check the file path in the folder: ${rootPath}.`
      );
    }
  }

  public static validateConfigDependencies(
    sharedConfig: any,
    packageJson: any
  ): void {
    if (!sharedConfig) {
      return;
    }

    if (typeof sharedConfig !== 'object') {
      throw new InvalidConfigError("The 'shared' field must be an object.");
    }

    for (const [sharedPackageName, sharedPackageVersion] of Object.entries(
      sharedConfig
    )) {
      const versionInRootPackageJson = (packageJson.dependencies || {})[
        sharedPackageName
      ];

      if (!versionInRootPackageJson) {
        throw new InvalidConfigError(
          `The '${sharedPackageName}' package is not listed in the package.json.`
        );
      }

      const isVersionSatisfied = semver.satisfies(
        versionInRootPackageJson,
        sharedPackageVersion as string
      );

      if (!isVersionSatisfied) {
        throw new InvalidConfigError(
          `The '${sharedPackageName}' package version '${versionInRootPackageJson}' does not satisfy the constraint '${sharedPackageVersion}'.`
        );
      }
    }
  }
}
