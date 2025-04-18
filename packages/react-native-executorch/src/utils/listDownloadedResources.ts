import { readDirectoryAsync } from 'expo-file-system';
import { RNEDirectory } from '../constants/directories';

export const listDownloadedFiles = async () => {
  const files = await readDirectoryAsync(RNEDirectory);
  return files.map((file) => `${RNEDirectory}${file}`);
};

export const listDownloadedModels = async () => {
  const files = await listDownloadedFiles();
  return files.filter((file) => file.endsWith('.pte'));
};
