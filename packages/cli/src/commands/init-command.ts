import { Args, Command, Flags } from '@oclif/core';
import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import { MicroappSupportedFramework } from '@microapp-io/scripts';
import { execSync } from 'child_process';
import * as pc from 'picocolors';

type SupportedPackageManager = 'yarn' | 'pnpm' | 'npm' | 'bun';
const DEFAULT_PACKAGE_MANAGER: SupportedPackageManager = 'npm';

export class InitCommand extends Command {
  static description = 'Initialize a microapp project';

  static args = {
    folderPath: Args.string({
      description: 'Folder path to initialize',
    }),
  };

  static flags = {
    packageManager: Flags.string({
      description: 'Package manager to use',
      options: ['yarn', 'pnpm', 'npm', 'bun'],
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(InitCommand);
    const packageManager = await this.getOrPromptPackageManager(
      flags.packageManager as SupportedPackageManager | undefined
    );

    const folderPath = path.resolve(
      process.cwd(),
      args.folderPath || process.cwd()
    );

    if (fs.existsSync(folderPath)) {
      this.log(pc.yellow(`Folder exists: ${pc.bold(folderPath)}\n`));
      const framework =
        MicroappSupportedFramework.determineByFolderPath(folderPath);

      await this.handleExistingFolder({
        folderPath,
        packageManager,
        framework,
      });
      return;
    }

    await this.handleNewFolder({
      folderPath,
      packageManager,
    });

    this.log(pc.green('\nMicroapp initialized successfully in the folder:'));
    this.log(pc.bold(folderPath));
    this.log('\n');
  }

  private async getOrPromptPackageManager(
    flagPackageManager?: SupportedPackageManager | undefined
  ): Promise<SupportedPackageManager> {
    if (flagPackageManager) {
      return flagPackageManager as SupportedPackageManager;
    }

    const { packageManager } = await inquirer.prompt([
      {
        type: 'list',
        name: 'packageManager',
        message: 'Select a package manager to use:',
        choices: () => {
          const packageManagers: SupportedPackageManager[] = [
            'npm',
            'yarn',
            'pnpm',
            'bun',
          ];

          return packageManagers
            .filter((packageManager) =>
              this.doesPackageManagerExist(packageManager)
            )
            .map((packageManager) => ({
              name: packageManager,
              value: packageManager,
            }));
        },
        default: this.detectPackageManager(),
      },
    ]);

    return packageManager as SupportedPackageManager;
  }

  private doesPackageManagerExist(
    packageManager: SupportedPackageManager
  ): boolean {
    try {
      execSync(`${packageManager} --version`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  private detectPackageManager(): SupportedPackageManager {
    const userAgent = process.env.npm_config_user_agent || '';

    if (userAgent.includes('npm')) {
      return 'npm';
    }

    if (userAgent.includes('yarn')) {
      return 'yarn';
    }

    if (userAgent.includes('pnpm')) {
      return 'pnpm';
    }

    if (userAgent.includes('bun')) {
      return 'bun';
    }

    // Fallback: check process.env._ (command used to run the script)
    const execPath = process.env._ || process.argv[0];

    if (execPath.includes('npm')) {
      return 'npm';
    }

    if (execPath.includes('yarn')) {
      return 'yarn';
    }

    if (execPath.includes('pnpm')) {
      return 'pnpm';
    }

    if (execPath.includes('bun')) {
      return 'bun';
    }

    return DEFAULT_PACKAGE_MANAGER;
  }

  private async handleExistingFolder({
    folderPath,
    packageManager,
    framework,
  }: {
    folderPath: string;
    packageManager: SupportedPackageManager;
    framework: MicroappSupportedFramework;
  }): Promise<void> {
    this.installScripts({ folderPath, packageManager });
  }

  private installScripts({
    folderPath,
    packageManager,
  }: {
    folderPath: string;
    packageManager: SupportedPackageManager;
  }): void {
    this.log(
      pc.cyan(
        `\nInstalling @microapp-io/scripts webpack using ${pc.bold(
          packageManager
        )}`
      )
    );

    execSync(
      this.getInstallScriptCommand({
        packageManager,
        packageNames: ['@microapp-io/scripts', 'webpack'],
        dev: true,
      }),
      {
        cwd: folderPath,
        stdio: 'inherit',
      }
    );

    this.log(
      pc.cyan(`Installing @microapp-io/ui using ${pc.bold(packageManager)}\n`)
    );

    execSync(
      this.getInstallScriptCommand({
        packageManager,
        packageNames: ['@microapp-io/ui'],
      }),
      {
        cwd: folderPath,
        stdio: 'inherit',
      }
    );
  }

  private getInstallScriptCommand({
    packageManager,
    packageNames,
    dev,
  }: {
    packageManager: SupportedPackageManager;
    packageNames: string[];
    dev?: boolean;
  }): string {
    const installCommand = {
      yarn: `yarn add ${dev ? '-D' : ''} ${packageNames.join(' ')}`,
      pnpm: `pnpm add ${dev ? '-D' : ''} ${packageNames.join(' ')}`,
      npm: `npm install ${dev ? '--save-dev' : '--save'} ${packageNames.join(
        ' '
      )}`,
      bun: `bun add ${dev ? '-D' : ''} ${packageNames.join(' ')}`,
    };

    if (!installCommand[packageManager]) {
      throw new Error(`Unsupported package manager: ${packageManager}`);
    }

    return installCommand[packageManager];
  }

  private async handleNewFolder({
    folderPath,
    packageManager,
  }: {
    folderPath: string;
    packageManager: SupportedPackageManager;
  }): Promise<void> {
    this.createAndEnterFolder(folderPath);
    const framework = await this.promptFramework();

    if (framework.isEquals(MicroappSupportedFramework.NEXT)) {
      this.createNextApp({ folderPath, packageManager, framework });
    }

    await this.handleExistingFolder({ folderPath, packageManager, framework });
  }

  private createAndEnterFolder(folderPath: string): void {
    fs.mkdirSync(folderPath, { recursive: true });
    this.log(pc.green(`Folder created: ${pc.bold(folderPath)}\n`));
    process.chdir(folderPath);
  }

  private async promptFramework(): Promise<MicroappSupportedFramework> {
    const { framework } = await inquirer.prompt([
      {
        type: 'list',
        name: 'framework',
        message: 'Select a framework to initialize:',
        choices: MicroappSupportedFramework.getAll().map((framework) => ({
          name: framework.title,
          value: framework.id,
        })),
      },
    ]);

    return MicroappSupportedFramework.getById(framework);
  }

  private createNextApp({
    folderPath,
    packageManager,
    framework,
  }: {
    folderPath: string;
    packageManager: SupportedPackageManager;
    framework: MicroappSupportedFramework;
  }): void {
    this.log(pc.cyan(`Using package manager: ${pc.bold(packageManager)}\n`));

    execSync(
      this.getCreateScriptCommand({
        packageManager,
        packageName: 'next-app',
        folderPath,
        version: framework.defaultVersion,
      }),
      { cwd: folderPath, stdio: 'inherit' }
    );
  }

  private getCreateScriptCommand({
    packageManager,
    packageName,
    folderPath,
    version,
  }: {
    packageManager: SupportedPackageManager;
    packageName: string;
    folderPath?: string;
    version?: string;
  }) {
    const createCommand = {
      yarn: `npx create-${packageName}${
        version ? `@${version}` : ''
      } ${folderPath} --use-npm`,
      pnpm: `npx create-${packageName}${
        version ? `@${version}` : ''
      } ${folderPath} --use-pnpm`,
      npm: `npx create-${packageName}${
        version ? `@${version}` : ''
      } ${folderPath}`,
      bun: `npx create-${packageName}${
        version ? `@${version}` : ''
      } ${folderPath} --use-bun`,
    };

    if (!createCommand[packageManager]) {
      throw new Error(`Unsupported package manager: ${packageManager}`);
    }

    return createCommand[packageManager];
  }
}
