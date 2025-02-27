import * as fs from 'fs';
import * as path from 'path';
import * as recast from 'recast';
import { parse as babelParse } from '@babel/parser';
import type { namedTypes } from 'ast-types';
import type { MicroappFileTransformer } from '../file-transformer';
import { CannotUpdateNextConfigFileError } from './errors';

const TS_FILE_EXTENSION = '.ts';
const MJ_SCRIPT_FILE_EXTENSION = '.mjs';
const CONFIG_KEY = 'config';
const OPTIONS_KEY = 'options';
const CONFIG_WEBPACK_KEY = 'webpack';

export class MicroappNextConfigFileTransformer
  implements MicroappFileTransformer
{
  public static readonly DEFAULT_CONFIG_FILE_NAME = 'next.config.js';

  public static readonly DEFAULT_JS_CONFIG_CONTENT = `module.exports = {
  ${CONFIG_WEBPACK_KEY}: (${CONFIG_KEY}, ${OPTIONS_KEY}) => {
    return ${CONFIG_KEY};
  },
};
`;

  public static readonly DEFAULT_TS_CONFIG_CONTENT = `export default {
  ${CONFIG_WEBPACK_KEY}: (${CONFIG_KEY}, ${OPTIONS_KEY}) => {
    return ${CONFIG_KEY};
  },
};
`;

  buildSampleFileContent(): string {
    return this.createNewConfigContent({
      isTypeScript: false,
      isUsingImportStyle: false,
    });
  }

  async transform(filePath: string): Promise<string> {
    const resolvedPath = path.resolve(process.cwd(), filePath);
    const isTypeScript = filePath.endsWith(TS_FILE_EXTENSION);
    const isUsingImportStyle =
      isTypeScript || filePath.endsWith(MJ_SCRIPT_FILE_EXTENSION);

    if (!fs.existsSync(resolvedPath)) {
      return this.createNewConfigContent({
        isTypeScript,
        isUsingImportStyle,
      });
    }

    const fileContent = this.safeReadFileContentByPath(resolvedPath);
    return this.processExistingConfig({
      content: fileContent,
      isTypeScript,
      isUsingImportStyle,
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
    isUsingImportStyle: boolean;
  }): string {
    const configContent = isTypeScript
      ? MicroappNextConfigFileTransformer.DEFAULT_TS_CONFIG_CONTENT
      : MicroappNextConfigFileTransformer.DEFAULT_JS_CONFIG_CONTENT;

    return configContent;
  }

  private processExistingConfig({
    content,
    isTypeScript,
    isUsingImportStyle,
  }: {
    content: string;
    isTypeScript: boolean;
    isUsingImportStyle: boolean;
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
