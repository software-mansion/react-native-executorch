import { readDirectoryAsync } from 'expo-file-system';
import { RNEDirectory } from '../constants/directories';

export const listFiles = async () => {
  const files = await readDirectoryAsync(RNEDirectory);
  return files.map((file) => `${RNEDirectory}${file}`);
};

export const listModels = async () => {
  const files = await listFiles();
  return files.filter((file) => file.endsWith('.pte'));
};
