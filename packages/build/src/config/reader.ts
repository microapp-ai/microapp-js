import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';
import type { MicroappConfig } from './types';
import { InvalidConfigError } from './invalid-config-error';

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

    this.validate(config);

    return config;
  }

  private validate(config: MicroappConfig) {
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

    const doesEntryComponentExist = fs.existsSync(
      path.resolve(this.rootPath, config.entryComponent)
    );

    if (!doesEntryComponentExist) {
      throw new InvalidConfigError(
        "The 'entryComponent' field must be a valid path."
      );
    }

    const entryComponent = require(path.resolve(
      this.rootPath,
      config.entryComponent
    ));

    const doesEntryComponentHaveDefaultExport =
      typeof entryComponent.default === 'function';

    if (!doesEntryComponentHaveDefaultExport) {
      throw new InvalidConfigError(
        "The 'entryComponent' must export a default function."
      );
    }

    if (!config.shared) {
      return;
    }

    const rootPackageJson = require(path.resolve(
      this.rootPath,
      'package.json'
    ));

    for (const [sharedPackageName, sharedPackageVersion] of Object.entries(
      config.shared
    )) {
      const versionInRootPackageJson = (rootPackageJson.dependencies || {})[
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
