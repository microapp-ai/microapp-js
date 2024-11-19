import { Args, Command } from '@oclif/core';
import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import { MicroappNextConfigFileTransformer } from '../file-transformers';
import {
  MicroappConfigError,
  MicroappConfigManager,
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

  async run(): Promise<void> {
    const { args } = await this.parse(InitCommand);
    const folderPath = args.folderPath || process.cwd();
    const rootPath = path.resolve(process.cwd(), folderPath);

    if (fs.existsSync(rootPath)) {
      this.log(pc.yellow(`Folder exists: ${pc.bold(rootPath)}\n`));
      await this.handleExistingFolder(rootPath);
      return;
    }

    await this.handleNewFolder(rootPath);
  }

  private async handleExistingFolder(folderPath: string): Promise<void> {
    this.installScripts(folderPath);

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

    const configReader = new MicroappConfigManager({ rootPath: folderPath });
    const config = configReader.read();

    const { name, entryComponent } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter the name of the microapp:',
        default: config?.name,
      },
      {
        type: 'input',
        name: 'entryComponent',
        message: 'Enter the name of the entry component:',
        default: config?.entryComponent,
      },
    ]);

    configReader.write({ name, entryComponent });

    this.log(pc.green('Project initialized successfully\n'));
  }

  private installScripts(rootPath: string): void {
    const packageManager = this.detectPackageManager();
    this.log(
      pc.cyan(
        `Installing @microapp-io/scripts using ${pc.bold(packageManager)}\n`
      )
    );
    execSync(this.getInstallScriptCommand(packageManager), {
      cwd: rootPath,
      stdio: 'inherit',
    });
  }

  private getInstallScriptCommand(
    packageManager: SupportedPackageManager
  ): string {
    if (packageManager === 'yarn') {
      return 'yarn add -D @microapp-io/scripts';
    }

    if (packageManager === 'pnpm') {
      return 'pnpm add -D @microapp-io/scripts';
    }

    if (packageManager === 'npm') {
      return 'npm install --save-dev @microapp-io/scripts';
    }

    if (packageManager === 'bun') {
      return 'bun add -D @microapp-io/scripts';
    }

    throw new Error(`Unsupported package manager: ${packageManager}`);
  }

  private async handleNewFolder(folderPath: string): Promise<void> {
    this.createAndEnterFolder(folderPath);
    const framework = await this.promptFramework();

    if (framework === 'Next.js') {
      this.initializeNextJsProjectInCurrentPath();
    }

    await this.handleExistingFolder(folderPath);
  }

  private createAndEnterFolder(folderPath: string): void {
    fs.mkdirSync(folderPath, { recursive: true });
    this.log(pc.green(`Folder created: ${pc.bold(folderPath)}\n`));
    process.chdir(folderPath);
  }

  private async promptFramework(): Promise<string> {
    const { framework } = await inquirer.prompt([
      {
        type: 'list',
        name: 'framework',
        message: 'Select a framework to initialize:',
        choices: ['Next.js'],
      },
    ]);

    return framework;
  }

  private initializeNextJsProjectInCurrentPath(): void {
    const packageManager = this.detectPackageManager();
    this.log(pc.cyan(`Using package manager: ${pc.bold(packageManager)}\n`));
    execSync(`${packageManager} create next-app .`, { stdio: 'inherit' });
  }

  private detectPackageManager(): SupportedPackageManager {
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
}
