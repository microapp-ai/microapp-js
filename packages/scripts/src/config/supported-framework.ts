import {
  CannotDetermineFrameworkError,
  UnsupportedFrameworkError,
} from './errors';
import * as path from 'path';
import * as fs from 'fs';
import * as semver from 'semver';

export class MicroappSupportedFramework {
  static readonly NEXT = new MicroappSupportedFramework(
    'next',
    'Next.js',
    '^14',
    ['^14', '^13', '^12']
  );

  static getById(id: string): MicroappSupportedFramework {
    const framework = this.getAll().find((framework) => framework.id === id);

    if (!framework) {
      throw new UnsupportedFrameworkError(
        `The framework with id ${id} is not supported. We currently support: ${this.getAllTitles().join(
          ', '
        )}.`
      );
    }

    return framework;
  }

  static getAllTitles(): string[] {
    return this.getAll().map((framework) => framework.title);
  }

  static getAll(): MicroappSupportedFramework[] {
    return [MicroappSupportedFramework.NEXT];
  }

  static determineByFolderPath(folderPath: string): MicroappSupportedFramework {
    const { framework, version } = this.getFrameworkByFolderPath(folderPath);

    if (framework.isVersionSupported(version)) {
      return framework;
    }

    throw new UnsupportedFrameworkError(
      `The version ${version} of ${
        framework.title
      } is not supported. We currently support: ${framework.versions.join(
        ', '
      )}.`
    );
  }

  private static getFrameworkByFolderPath(folderPath: string): {
    framework: MicroappSupportedFramework;
    version: string;
  } {
    let packageJson: any;

    try {
      const packageJsonPath = path.join(folderPath, 'package.json');
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } catch (error) {
      throw new CannotDetermineFrameworkError(
        `Could not read package.json file in ${folderPath}.`,
        { cause: error }
      );
    }

    if (packageJson.dependencies?.next) {
      return {
        framework: MicroappSupportedFramework.NEXT,
        version: packageJson.dependencies.next,
      };
    }

    throw new UnsupportedFrameworkError(
      `The framework used in ${folderPath} is not supported. We currently support: ${MicroappSupportedFramework.getAllTitles().join(
        ', '
      )}.`
    );
  }

  private constructor(
    readonly id: string,
    readonly title: string,
    readonly defaultVersion: string,
    readonly versions: string[]
  ) {}

  isEquals(frameworkOrId: MicroappSupportedFramework | string): boolean {
    if (frameworkOrId instanceof MicroappSupportedFramework) {
      return this.id === frameworkOrId.id;
    }

    return this.id === frameworkOrId;
  }

  isVersionSupported(version: string): boolean {
    return this.versions.some((supportedVersion) => {
      const coercedVersion = semver.coerce(version);
      const validRange = semver.validRange(supportedVersion);

      if (!coercedVersion || !validRange) {
        return false;
      }

      return semver.satisfies(coercedVersion, validRange, {
        includePrerelease: true,
      });
    });
  }
}
