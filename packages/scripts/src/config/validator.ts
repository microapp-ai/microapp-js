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
      throw new InvalidConfigError(
        "The 'packageJson' field is required when 'rootPath' is not provided."
      );
    }

    const packageJsonPath = path.resolve(rootPath, 'package.json');
    const doesPackageJsonExist = fs.existsSync(packageJsonPath);

    if (!doesPackageJsonExist) {
      throw new InvalidConfigError(
        "The 'packageJson' field is required when 'rootPath' is provided."
      );
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
    if (!config.name) {
      throw new InvalidConfigError(
        "The 'name' field is required in microapp.json."
      );
    }

    if (!config.entryComponent) {
      throw new InvalidConfigError(
        "The 'entryComponent' field is required in microapp.json."
      );
    }

    const isNameSlug = /^[a-z0-9-]+$/.test(config.name);

    if (!isNameSlug) {
      throw new InvalidConfigError("The 'name' field must be a slug.");
    }

    if (!rootPath) {
      return;
    }

    const doesEntryComponentExist = fs.existsSync(
      path.resolve(rootPath, config.entryComponent)
    );

    if (!doesEntryComponentExist) {
      throw new InvalidConfigError(
        "The 'entryComponent' field must be a valid path."
      );
    }

    if (!config.shared) {
      return;
    }

    for (const [sharedPackageName, sharedPackageVersion] of Object.entries(
      config.shared
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
        sharedPackageVersion
      );

      if (!isVersionSatisfied) {
        throw new InvalidConfigError(
          `The '${sharedPackageName}' package version '${versionInRootPackageJson}' does not satisfy the constraint '${sharedPackageVersion}'.`
        );
      }
    }
  }
}
