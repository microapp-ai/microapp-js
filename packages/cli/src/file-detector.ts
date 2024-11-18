export interface MicroappFileDetector {
  getExistingFilePathByFolderPathOrDefault(folderPath: string): string | null;
}
