import * as fs from 'fs';
import * as path from 'path';
import * as recast from 'recast';
import { parse as babelParse } from '@babel/parser';
import type { namedTypes } from 'ast-types';
import { builders } from 'ast-types';
import type { MicroappFileTransformer } from '../file-transformer';
import { CannotUpdateNextConfigFileError } from './errors';

const TYPE_SCRIPT_FILE_EXTENSION = '.ts';
const PLUGIN_MODULE = '@microapp-io/scripts';
const PLUGIN_CLASS_NAME = 'MicroappNextFederationPlugin';
const PLUGIN_IMPORT_CODE_ESM = `import { ${PLUGIN_CLASS_NAME} } from '${PLUGIN_MODULE}';\n`;
const PLUGIN_IMPORT_CODE_CJS = `const { ${PLUGIN_CLASS_NAME} } = require('${PLUGIN_MODULE}');\n`;
const CONFIG_KEY = 'config';
const CONFIG_PLUGINS_KEY = `${CONFIG_KEY}.plugins`;
const PLUGIN_USAGE_CODE = `${CONFIG_PLUGINS_KEY}.push(new ${PLUGIN_CLASS_NAME}());\n`;
const CONFIG_WEBPACK_KEY = 'webpack';

export class MicroappNextConfigFileTransformer
  implements MicroappFileTransformer
{
  public static readonly DEFAULT_CONFIG_FILE_NAME = 'next.config.js';

  public static readonly DEFAULT_JS_CONFIG_CONTENT = `module.exports = {
  ${CONFIG_WEBPACK_KEY}: (config) => {
    ${PLUGIN_USAGE_CODE}
    return config;
  },
};
`;

  public static readonly DEFAULT_TS_CONFIG_CONTENT = `export default {
  ${CONFIG_WEBPACK_KEY}: (config) => {
    ${PLUGIN_USAGE_CODE}
    return config;
  },
};
`;

  buildSampleFileContent(): string {
    return this.createNewConfigContent({ isTypeScript: false });
  }

  async transform(filePath: string): Promise<string> {
    const resolvedPath = path.resolve(process.cwd(), filePath);
    const isTypeScript = filePath.endsWith(TYPE_SCRIPT_FILE_EXTENSION);

    if (!fs.existsSync(resolvedPath)) {
      return this.createNewConfigContent({ isTypeScript });
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
    const pluginImportCode = this.getPluginImportCode({
      isUsingImportStyle: isTypeScript,
    });

    const configContent = isTypeScript
      ? MicroappNextConfigFileTransformer.DEFAULT_TS_CONFIG_CONTENT
      : MicroappNextConfigFileTransformer.DEFAULT_JS_CONFIG_CONTENT;

    return `${pluginImportCode}${configContent}`;
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
      const usedTypeOfRequireOrImport = this.getUsedTypeOfRequireOrImport(ast);
      const isUsingImportStyle = usedTypeOfRequireOrImport
        ? usedTypeOfRequireOrImport === 'import' ||
          usedTypeOfRequireOrImport === 'require-and-import'
        : isTypeScript;

      const pluginImportCode = this.getPluginImportCode({ isUsingImportStyle });

      if (!this.doesAstImportPlugin(ast)) {
        this.addPluginImport({ ast, pluginImportCode });
      }

      if (!this.doesAstUsePlugin(ast)) {
        this.addPluginUsageToAst(ast);
      }

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

  private getUsedTypeOfRequireOrImport(
    ast: namedTypes.Program
  ): 'require' | 'import' | 'require-and-import' | false {
    let containsRequire = false;
    let containsImport = false;

    recast.visit(ast, {
      visitImportDeclaration() {
        containsImport = true;
        return false;
      },
      visitVariableDeclaration(path) {
        const declaration = path.node
          .declarations[0] as namedTypes.VariableDeclarator;

        const isRequireCall =
          declaration?.init?.type === 'CallExpression' &&
          declaration.init.callee.type === 'Identifier' &&
          declaration.init.callee.name === 'require';

        if (isRequireCall) {
          containsRequire = true;
        }

        return false;
      },
    });

    return containsRequire && containsImport
      ? 'require-and-import'
      : containsRequire
      ? 'require'
      : containsImport
      ? 'import'
      : false;
  }

  private getPluginImportCode({
    isUsingImportStyle,
  }: {
    isUsingImportStyle: boolean;
  }): string {
    return isUsingImportStyle ? PLUGIN_IMPORT_CODE_ESM : PLUGIN_IMPORT_CODE_CJS;
  }

  private doesAstImportPlugin(ast: namedTypes.Program): boolean {
    let hasPluginImport = false;

    recast.visit(ast, {
      visitImportDeclaration(path) {
        const isMatchingImport =
          path.node.source.value === PLUGIN_MODULE &&
          path.node.specifiers?.some(
            (specifier) =>
              specifier.type === 'ImportSpecifier' &&
              specifier.imported.name === PLUGIN_CLASS_NAME
          );

        if (isMatchingImport) {
          hasPluginImport = true;
        }

        return false;
      },

      visitVariableDeclaration(path) {
        const declaration = path.node
          .declarations[0] as namedTypes.VariableDeclarator;
        const isRequireCall =
          declaration?.init?.type === 'CallExpression' &&
          declaration.init.callee.type === 'Identifier' &&
          declaration.init.callee.name === 'require';

        const argument =
          declaration.init?.type === 'CallExpression'
            ? declaration.init.arguments[0]
            : null;

        const isMatchingRequire =
          isRequireCall &&
          argument?.type === 'Literal' &&
          argument?.value === PLUGIN_MODULE;

        if (isMatchingRequire) {
          hasPluginImport = true;
        }

        return false;
      },
    });

    return hasPluginImport;
  }

  private doesAstUsePlugin(ast: namedTypes.Program): boolean {
    let hasPluginUsage = false;

    recast.visit(ast, {
      visitCallExpression(path) {
        const isPluginsPushCall =
          path.node.callee.type === 'MemberExpression' &&
          path.node.callee.object.type === 'Identifier' &&
          path.node.callee.object.name === CONFIG_KEY &&
          path.node.callee.property.type === 'Identifier' &&
          path.node.callee.property.name === 'plugins';

        if (isPluginsPushCall) {
          hasPluginUsage = true;
        }

        return false;
      },
    });

    return hasPluginUsage;
  }

  private addPluginImport({
    ast,
    pluginImportCode,
  }: {
    ast: namedTypes.Program;
    pluginImportCode: string;
  }): void {
    const importNode = recast.parse(pluginImportCode).program.body[0];
    ast.body.unshift(importNode);
  }

  private addPluginUsageToAst(ast: namedTypes.Program): void {
    const self = this;

    recast.visit(ast, {
      visitObjectExpression(path) {
        const webpackProperty = path.node.properties.find(
          (prop) =>
            prop.type === 'ObjectProperty' &&
            prop.key.type === 'Identifier' &&
            prop.key.name === CONFIG_WEBPACK_KEY
        ) as namedTypes.ObjectProperty | undefined;

        const hasWebpackProperty = !!webpackProperty;

        if (hasWebpackProperty) {
          self.addPluginToExistingWebpackToNode(webpackProperty.value);
        }

        if (!hasWebpackProperty) {
          self.addNewWebpackPropertyToObjectExpression(
            path.node as namedTypes.ObjectExpression
          );
        }

        return false;
      },
    });
  }

  private addPluginToExistingWebpackToNode(
    webpackValue: namedTypes.Node
  ): void {
    const isFunctionExpression =
      webpackValue.type === 'ArrowFunctionExpression' ||
      webpackValue.type === 'FunctionExpression';

    if (!isFunctionExpression) {
      return;
    }

    const functionBody = (webpackValue as namedTypes.Function).body;
    const isBlockStatement = functionBody.type === 'BlockStatement';

    if (isBlockStatement) {
      functionBody.body.unshift(
        recast.parse(PLUGIN_USAGE_CODE).program.body[0]
      );
    }
  }

  private addNewWebpackPropertyToObjectExpression(
    objectExpression: namedTypes.ObjectExpression
  ): void {
    objectExpression.properties.push(
      builders.objectProperty(
        builders.identifier(CONFIG_WEBPACK_KEY),
        builders.arrowFunctionExpression(
          [builders.identifier(CONFIG_KEY)],
          builders.blockStatement([
            recast.parse(PLUGIN_USAGE_CODE).program.body[0],
            builders.returnStatement(builders.identifier(CONFIG_KEY)),
          ])
        )
      )
    );
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
