import { Args, Command, Flags } from '@oclif/core';
import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import { MicroappNextConfigFileTransformer } from '../file-transformers';
import {
  MicroappConfigError,
  MicroappConfigManager,
  MicroappSupportedFramework,
} from '@microapp-io/scripts';
import { MicroappNextConfigFileDetector } from '../file-detectors';
import { execSync } from 'child_process';
import * as pc from 'picocolors';

type SupportedPackageManager = 'yarn' | 'pnpm' | 'npm' | 'bun';

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
    const packageManager = this.getOrDetectPackageManager(
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
  }

  private getOrDetectPackageManager(
    flagPackageManager?: SupportedPackageManager | undefined
  ): SupportedPackageManager {
    if (flagPackageManager) {
      return flagPackageManager as SupportedPackageManager;
    }

    if (fs.existsSync(path.join(process.cwd(), 'yarn.lock'))) {
      return 'yarn';
    }

    if (fs.existsSync(path.join(process.cwd(), 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }

    if (fs.existsSync(path.join(process.cwd(), 'bun.lock'))) {
      return 'bun';
    }

    return 'npm';
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
    if (framework.isEquals(MicroappSupportedFramework.NEXT)) {
      await this.configureNextApp({ folderPath });
    }

    const configReader = new MicroappConfigManager({ rootPath: folderPath });
    const config = configReader.read();

    const defaultName = config?.name || path.basename(folderPath);
    const defaultEntryComponent =
      config?.entryComponent ||
      this.getDefaultEntryComponent({
        folderPath,
        framework,
      });

    const { name, entryComponent } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter the name of the microapp:',
        default: defaultName,
      },
      {
        type: 'input',
        name: 'entryComponent',
        message: 'Enter the name of the entry component:',
        default: defaultEntryComponent,
      },
    ]);

    configReader.write({ name, entryComponent });

    this.installScripts({ folderPath, packageManager });

    this.log(pc.green('\nMicroapp initialized successfully\n'));
  }

  private getDefaultEntryComponent({
    folderPath,
    framework,
  }: {
    folderPath: string;
    framework: MicroappSupportedFramework;
  }): string | undefined {
    if (framework.isEquals(MicroappSupportedFramework.NEXT)) {
      return this.getFirstRelativeFilePathThatExists({
        folderPath,
        fileNames: [
          'pages/index.tsx',
          'pages/index.ts',
          'pages/index.js',
          'src/app/page.tsx',
          'src/app/page.ts',
          'src/app/page.js',
          'app/index.tsx',
          'app/index.ts',
          'app/index.js',
          'src/pages/index.tsx',
          'src/pages/index.ts',
          'src/pages/index.js',
        ],
      });
    }

    return undefined;
  }

  private getFirstRelativeFilePathThatExists({
    folderPath,
    fileNames,
  }: {
    folderPath: string;
    fileNames: string[];
  }): string | undefined {
    const absolutePath = fileNames
      .map((fileName) => path.join(folderPath, fileName))
      .find((filePath) => fs.existsSync(filePath));

    if (!absolutePath) {
      return undefined;
    }

    const relativePath = path.relative(folderPath, absolutePath);
    return `./${relativePath}`;
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
        `\nInstalling @microapp-io/scripts using ${pc.bold(packageManager)}`
      )
    );

    // TODO: Uncomment this after publishing @microapp-io/scripts
    // execSync(
    //   this.getInstallScriptCommand({
    //     packageManager,
    //     packageNames: ['@microapp-io/scripts'],
    //     dev: true,
    //   }),
    //   {
    //     cwd: folderPath,
    //     stdio: 'inherit',
    //   }
    // );

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

  private async configureNextApp({
    folderPath,
  }: {
    folderPath: string;
  }): Promise<void> {
    const nextConfigFileDetector = new MicroappNextConfigFileDetector();
    const nextConfigFilePath =
      nextConfigFileDetector.getExistingFilePathByFolderPathOrDefault(
        folderPath,
        MicroappNextConfigFileDetector.DEFAULT_CONFIG_FILENAME
      );

    const nextConfigFileTransformer = new MicroappNextConfigFileTransformer();

    try {
      await nextConfigFileTransformer.transformAndPersist(nextConfigFilePath);
    } catch (error) {
      const isConfigError = error instanceof MicroappConfigError;

      if (!isConfigError) {
        throw error;
      }

      this.log(
        pc.red(
          `\nCould not automatically modify the ${pc.bold(
            nextConfigFilePath
          )} file.\nPlease modify it manually:\n\n${pc.bold(
            nextConfigFileTransformer.buildSampleFileContent()
          )}\n`
        )
      );
    }
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
      yarn: `yarn create ${packageName}${
        version ? `@${version}` : ''
      } ${folderPath}`,
      pnpm: `pnpm create ${packageName}${
        version ? `@${version}` : ''
      } ${folderPath}`,
      npm: `npx create-${packageName}${
        version ? `@${version}` : ''
      } ${folderPath}`,
      bun: `bun create ${packageName}${
        version ? `@${version}` : ''
      } ${folderPath}`,
    };

    if (!createCommand[packageManager]) {
      throw new Error(`Unsupported package manager: ${packageManager}`);
    }

    return createCommand[packageManager];
  }
}
