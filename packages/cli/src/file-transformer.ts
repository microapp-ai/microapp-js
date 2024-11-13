export interface MicroappFileTransformer {
  transformByFilePath(filePath: string): Promise<string>;
}
