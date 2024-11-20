export interface MicroappFileTransformer {
  transform(filePath: string): Promise<string>;

  transformAndPersist(filePath: string): Promise<void>;
}
