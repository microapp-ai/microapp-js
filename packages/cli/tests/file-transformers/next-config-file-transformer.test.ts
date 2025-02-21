import * as fs from 'fs';
import * as path from 'path';
import { MicroappNextConfigFileTransformer } from '../../src';

const transformer = new MicroappNextConfigFileTransformer();
const fixturesPath = path.resolve(__dirname, '../fixtures/next-projects');
const getFixturePath = (folderName: string) =>
  path.resolve(fixturesPath, folderName);
const getFixtureFilePath = (folderName: string, fileName: string) =>
  path.resolve(getFixturePath(folderName), fileName);
const readFixtureFile = (fixturePath: string): string | null =>
  fs.existsSync(fixturePath) ? fs.readFileSync(fixturePath, 'utf-8') : null;

describe('MicroappNextConfigFileTransformer', () => {
  describe('JavaScript', () => {
    it('returns new content for a non-existent next.config.js file', async () => {
      const folderName = 'js/01-no-next-config-file';
      const filePath = getFixtureFilePath(folderName, 'next.config.js');
      const fileContent = readFixtureFile(filePath);

      const transformedFileContent = await transformer.transform(filePath);

      expect(transformedFileContent).not.toBe(fileContent);
    });

    it('returns updated content for a next.config.js file without a webpack key', async () => {
      const folderName = 'js/02-next-js-config-file-without-webpack-key';
      const filePath = getFixtureFilePath(folderName, 'next.config.js');
      const fileContent = readFixtureFile(filePath);

      const transformedFileContent = await transformer.transform(filePath);

      expect(transformedFileContent).not.toBe(fileContent);
    });

    it('handles unrelated imports correctly', async () => {
      const folderName = 'js/06-next-js-config-with-other-unrelated-imports';
      const filePath = getFixtureFilePath(folderName, 'next.config.js');
      const fileContent = readFixtureFile(filePath);

      const transformedFileContent = await transformer.transform(filePath);

      expect(transformedFileContent).not.toBe(fileContent);
    });

    it('handles unrelated plugins correctly', async () => {
      const folderName = 'js/07-next-js-config-with-other-unrelated-plugins';
      const filePath = getFixtureFilePath(folderName, 'next.config.js');
      const fileContent = readFixtureFile(filePath);

      const transformedFileContent = await transformer.transform(filePath);

      expect(transformedFileContent).not.toBe(fileContent);
    });
  });

  describe('TypeScript', () => {
    it('returns new content for a non-existent next.config.ts file', async () => {
      const folderName = 'ts/01-no-next-config-file';
      const filePath = getFixtureFilePath(folderName, 'next.config.ts');
      const fileContent = readFixtureFile(filePath);

      const transformedFileContent = await transformer.transform(filePath);

      expect(transformedFileContent).not.toBe(fileContent);
    });

    it('returns updated content for a next.config.ts file without a webpack key', async () => {
      const folderName = 'ts/02-next-ts-config-file-without-webpack-key';
      const filePath = getFixtureFilePath(folderName, 'next.config.ts');
      const fileContent = readFixtureFile(filePath);

      const transformedFileContent = await transformer.transform(filePath);

      expect(transformedFileContent).not.toBe(fileContent);
    });

    it('handles unrelated imports correctly', async () => {
      const folderName = 'ts/06-next-ts-config-with-other-unrelated-imports';
      const filePath = getFixtureFilePath(folderName, 'next.config.ts');
      const fileContent = readFixtureFile(filePath);

      const transformedFileContent = await transformer.transform(filePath);

      expect(transformedFileContent).not.toBe(fileContent);
    });

    it('handles unrelated plugins correctly', async () => {
      const folderName = 'ts/07-next-ts-config-with-other-unrelated-plugins';
      const filePath = getFixtureFilePath(folderName, 'next.config.ts');
      const fileContent = readFixtureFile(filePath);

      const transformedFileContent = await transformer.transform(filePath);

      expect(transformedFileContent).not.toBe(fileContent);
    });
  });
});
