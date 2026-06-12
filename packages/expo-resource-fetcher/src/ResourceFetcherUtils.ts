import { RNEDirectory } from './constants/directories';
import {
  HTTP_CODE,
  DownloadStatus,
  SourceType,
  RnExecutorchError,
  RnExecutorchErrorCode,
} from 'react-native-executorch';
import * as SharedUtils from './sharedUtils';

/**
 * @internal
 */
import { Directory } from 'expo-file-system';

export { HTTP_CODE, DownloadStatus, SourceType };

/**
 * Utility functions for fetching and managing resources.
 * @category Utilities - General
 */
export namespace ResourceFetcherUtils {
  export const removeFilePrefix = SharedUtils.removeFilePrefix;
  export const hashObject = SharedUtils.hashObject;
  export const calculateDownloadProgress =
    SharedUtils.calculateDownloadProgress;
  export const triggerHuggingFaceDownloadCounter =
    SharedUtils.triggerHuggingFaceDownloadCounter;
  export const triggerDownloadEvent = SharedUtils.triggerDownloadEvent;
  export const getFilenameFromUri = SharedUtils.getFilenameFromUri;
  export const getType = SharedUtils.getType;
  export const getFilesSizes = SharedUtils.getFilesSizes;

  export async function createDirectoryIfNoExists() {
    const directory = new Directory(RNEDirectory);
    if (directory.exists) return;
    try {
      directory.create({ intermediates: true, idempotent: true });
    } catch (error) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.FileWriteFailed,
        `Failed to create directory at ${RNEDirectory}`,
        error
      );
    }
  }
}
