import { RNEDirectory } from './constants/directories';
import {
  ResourceSource,
  Logger,
  ResourceFetcherUtils as CoreUtils,
  HTTP_CODE,
  DownloadStatus,
  SourceType,
  RnExecutorchError,
  RnExecutorchErrorCode,
} from 'react-native-executorch';
import { Asset } from 'expo-asset';

/**
 * @internal
 */
import { getInfoAsync, makeDirectoryAsync } from 'expo-file-system/legacy';

export { HTTP_CODE, DownloadStatus, SourceType };

/**
 * Utility functions for fetching and managing resources.
 * @category Utilities - General
 */
export namespace ResourceFetcherUtils {
  export const removeFilePrefix = CoreUtils.removeFilePrefix;
  export const hashObject = CoreUtils.hashObject;
  export const calculateDownloadProgress = CoreUtils.calculateDownloadProgress;
  export const triggerHuggingFaceDownloadCounter =
    CoreUtils.triggerHuggingFaceDownloadCounter;
  export const triggerDownloadEvent = CoreUtils.triggerDownloadEvent;
  export const getFilenameFromUri = CoreUtils.getFilenameFromUri;

  export function getType(source: ResourceSource): SourceType {
    if (typeof source === 'object') {
      return SourceType.OBJECT;
    } else if (typeof source === 'number') {
      const uri = Asset.fromModule(source).uri;
      if (uri.startsWith('http')) {
        return SourceType.DEV_MODE_FILE;
      }
      return SourceType.RELEASE_MODE_FILE;
    }
    // typeof source == 'string'
    if (source.startsWith('file://')) {
      return SourceType.LOCAL_FILE;
    }
    return SourceType.REMOTE_FILE;
  }

  export async function getFilesSizes(sources: ResourceSource[]) {
    const results: Array<{
      source: ResourceSource;
      type: SourceType;
      length: number;
      previousFilesTotalLength: number;
    }> = [];
    let totalLength = 0;

    for (const source of sources) {
      const type = ResourceFetcherUtils.getType(source);
      let length = 0;

      if (type === SourceType.REMOTE_FILE && typeof source === 'string') {
        try {
          const response = await fetch(source, { method: 'HEAD' });
          if (!response.ok) {
            Logger.warn(
              `Failed to fetch HEAD for ${source}: ${response.status}`
            );
            continue;
          }

          const contentLength = response.headers.get('content-length');
          if (!contentLength) {
            Logger.warn(`No content-length header for ${source}`);
          }

          length = contentLength ? parseInt(contentLength, 10) : 0;
        } catch (error) {
          Logger.warn(`Error fetching HEAD for ${source}:`, error);
          continue;
        }
      }

      const previousFilesTotalLength = totalLength;
      totalLength += length;
      results.push({ source, type, length, previousFilesTotalLength });
    }

    return { results, totalLength };
  }

  export async function createDirectoryIfNoExists() {
    if (!(await checkFileExists(RNEDirectory))) {
      try {
        await makeDirectoryAsync(RNEDirectory, { intermediates: true });
      } catch (error) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.FileWriteFailed,
          `Failed to create directory at ${RNEDirectory}`,
          error
        );
      }
    }
  }

  export async function checkFileExists(fileUri: string) {
    const fileInfo = await getInfoAsync(fileUri);
    return fileInfo.exists;
  }
}
