import {
  cacheDirectory,
  createDownloadResumable,
  getInfoAsync,
  makeDirectoryAsync,
  moveAsync,
  FileSystemSessionType,
} from 'expo-file-system';
import { Asset } from 'expo-asset';
import { RNEDirectory } from '../constants/directories';

const getFilenameFromUri = (uri: string) => {
  const filename = uri.split('/').pop()?.split('?')[0];
  if (!filename) {
    throw new Error('Cannot derive filename from URI');
  }
  return filename;
};

/**
 * Increments the Hugging Face download counter if the URI points to a Software Mansion Hugging Face repo.
 * More information: https://huggingface.co/docs/hub/models-download-stats
 */
const triggerHuggingFaceDownloadCounter = (uri: string) => {
  const url = new URL(uri);
  if (
    url.host === 'huggingface.co' &&
    url.pathname.startsWith('/software-mansion/')
  ) {
    const baseUrl = `${url.protocol}//${url.host}${url.pathname.split('resolve')[0]}`;
    fetch(`${baseUrl}resolve/main/config.json`, { method: 'HEAD' });
  }
};

export const fetchResource = async (
  source: string | number,
  callback: (downloadProgress: number) => void = () => {}
) => {
  const uri =
    typeof source === 'number' ? Asset.fromModule(source).uri : source;

  // Handle local files
  if (uri.startsWith('file://')) {
    return uri;
  }

  const filename = getFilenameFromUri(uri);
  const fileUri = `${RNEDirectory}${filename}`;

  // Check if the file already exists
  if ((await getInfoAsync(fileUri)).exists) {
    return fileUri;
  }

  // Create the RNEDirectory if it doesn't exist
  if (!(await getInfoAsync(RNEDirectory)).exists) {
    await makeDirectoryAsync(RNEDirectory, { intermediates: true });
  }

  // Handle local asset files in release mode
  if (!uri.includes('://')) {
    const asset = Asset.fromModule(source);
    const fileUriWithType = `${fileUri}.${asset.type}`;
    await asset.downloadAsync();
    await moveAsync({ from: asset.localUri!, to: fileUriWithType });
    return fileUriWithType;
  }

  // Handle remote file download
  const cacheFileUri = `${cacheDirectory}${filename}`;
  const downloadResumable = createDownloadResumable(
    uri,
    cacheFileUri,
    { sessionType: FileSystemSessionType.BACKGROUND },
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      callback(totalBytesWritten / totalBytesExpectedToWrite);
    }
  );
  const result = await downloadResumable.downloadAsync();
  if (!result || result.status !== 200) {
    throw new Error(`Failed to fetch resource from '${uri}'`);
  }
  await moveAsync({ from: cacheFileUri, to: fileUri });

  triggerHuggingFaceDownloadCounter(uri);

  return fileUri;
};

export const calculateDownloadProgres =
  (
    numberOfFiles: number,
    currentFileIndex: number,
    setProgress: (downloadProgress: number) => void
  ) =>
  (progress: number) => {
    if (progress === 1 && currentFileIndex === numberOfFiles - 1) {
      setProgress(1);
      return;
    }
    const contributionPerFile = 1 / numberOfFiles;
    const baseProgress = contributionPerFile * currentFileIndex;
    const scaledProgress = progress * contributionPerFile;
    const updatedProgress = baseProgress + scaledProgress;
    setProgress(updatedProgress);
  };
