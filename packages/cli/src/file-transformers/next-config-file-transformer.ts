import * as fs from 'fs';
import * as path from 'path';
import * as recast from 'recast';
import { parse as babelParse } from '@babel/parser';
import type { namedTypes } from 'ast-types';
import type { MicroappFileTransformer } from '../file-transformer';
import { CannotUpdateNextConfigFileError } from './errors';

const TS_FILE_EXTENSION = '.ts';

export class MicroappNextConfigFileTransformer
  implements MicroappFileTransformer
{
  public static readonly DEFAULT_CONFIG_FILE_NAME = 'next.config.js';

  public static readonly DEFAULT_JS_CONFIG_CONTENT = `module.exports = {
    webpack: (config) => {
      return config;
    },
  };
`;

  public static readonly DEFAULT_TS_CONFIG_CONTENT = `export default {
    webpack: (config) => {
      return config;
    },
  };
`;

  buildSampleFileContent(): string {
    return this.createNewConfigContent({
      isTypeScript: false,
    });
  }

  async transform(filePath: string): Promise<string> {
    const resolvedPath = path.resolve(process.cwd(), filePath);
    const isTypeScript = filePath.endsWith(TS_FILE_EXTENSION);

    if (!fs.existsSync(resolvedPath)) {
      return this.createNewConfigContent({
        isTypeScript,
      });
    }

    const fileContent = this.safeReadFileContentByPath(resolvedPath);
    return this.processExistingConfig({
      content: fileContent,
      isTypeScript,
    });
  }

  async transformAndPersist(filePath: string): Promise<void> {
    const resolvedPath = path.resolve(process.cwd(), filePath);
    const updatedContent = await this.transform(filePath);

    this.safeWriteFileContentByPath(resolvedPath, updatedContent);
  }

  private createNewConfigContent({
    isTypeScript,
  }: {
    isTypeScript: boolean;
  }): string {
    const configContent = isTypeScript
      ? MicroappNextConfigFileTransformer.DEFAULT_TS_CONFIG_CONTENT
      : MicroappNextConfigFileTransformer.DEFAULT_JS_CONFIG_CONTENT;

    return configContent;
  }

  private processExistingConfig({
    content,
    isTypeScript,
  }: {
    content: string;
    isTypeScript: boolean;
  }): string {
    try {
      const ast = this.parseConfig({ content, isTypeScript });
      return recast.print(ast).code;
    } catch (error) {
      throw new CannotUpdateNextConfigFileError({ cause: error });
    }
  }

  private parseConfig({
    content,
    isTypeScript,
  }: {
    content: string;
    isTypeScript: boolean;
  }): namedTypes.Program {
    try {
      return recast.parse(content, {
        parser: {
          parse(source: string) {
            return babelParse(source, {
              sourceType: 'module',
              plugins: isTypeScript ? ['typescript'] : [],
            });
          },
        },
      }).program;
    } catch (error) {
      throw new CannotUpdateNextConfigFileError({ cause: error });
    }
  }

  private safeReadFileContentByPath(resolvedPath: string): string {
    try {
      return fs.readFileSync(resolvedPath, 'utf-8');
    } catch (error) {
      throw new CannotUpdateNextConfigFileError({ cause: error });
    }
  }

  private safeWriteFileContentByPath(
    resolvedPath: string,
    content: string
  ): void {
    try {
      fs.writeFileSync(resolvedPath, content, 'utf-8');
    } catch (error) {
      throw new CannotUpdateNextConfigFileError({ cause: error });
    }
  }
}
