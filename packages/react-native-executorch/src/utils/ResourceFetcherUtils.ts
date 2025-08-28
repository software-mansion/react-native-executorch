/**
 * @internal
 */

import {
  DownloadResumable,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system';
import { RNEDirectory } from '../constants/directories';
import { ResourceSource } from '../types/common';
import { Asset } from 'expo-asset';
import { Logger } from '../common/Logger';

export const enum HTTP_CODE {
  OK = 200,
  PARTIAL_CONTENT = 206,
}

export const enum DownloadStatus {
  ONGOING,
  PAUSED,
}

export const enum SourceType {
  OBJECT,
  LOCAL_FILE,
  RELEASE_MODE_FILE,
  DEV_MODE_FILE,
  REMOTE_FILE,
}

export interface ResourceSourceExtended {
  source: ResourceSource;
  sourceType: SourceType;
  callback?: (downloadProgress: number) => void;
  results: string[];
  uri?: string;
  fileUri?: string;
  cacheFileUri?: string;
  next?: ResourceSourceExtended;
}

export interface DownloadResource {
  downloadResumable: DownloadResumable;
  status: DownloadStatus;
  extendedInfo: ResourceSourceExtended;
}

export namespace ResourceFetcherUtils {
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
    let previousFilesTotalLength = 0;
    for (const source of sources) {
      const type = await ResourceFetcherUtils.getType(source);
      let length = 0;
      try {
        if (type === SourceType.REMOTE_FILE && typeof source === 'string') {
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
          previousFilesTotalLength = totalLength;
          totalLength += length;
        }
      } catch (error) {
        Logger.warn(`Error fetching HEAD for ${source}:`, error);
        continue;
      } finally {
        results.push({ source, type, length, previousFilesTotalLength });
      }
    }
    return { results, totalLength };
  }

  export function removeFilePrefix(uri: string) {
    return uri.startsWith('file://') ? uri.slice(7) : uri;
  }

  export function hashObject(jsonString: string) {
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      // eslint-disable-next-line no-bitwise
      hash = (hash << 5) - hash + jsonString.charCodeAt(i);
      // eslint-disable-next-line no-bitwise
      hash |= 0;
    }
    // eslint-disable-next-line no-bitwise
    return (hash >>> 0).toString();
  }

  export function calculateDownloadProgress(
    totalLength: number,
    previousFilesTotalLength: number,
    currentFileLength: number,
    setProgress: (downloadProgress: number) => void
  ) {
    return (progress: number) => {
      if (
        progress === 1 &&
        previousFilesTotalLength === totalLength - currentFileLength
      ) {
        setProgress(1);
        return;
      }

      // Avoid division by zero
      if (totalLength === 0) {
        setProgress(0);
        return;
      }

      const baseProgress = previousFilesTotalLength / totalLength;
      const scaledProgress = progress * (currentFileLength / totalLength);
      const updatedProgress = baseProgress + scaledProgress;
      setProgress(updatedProgress);
    };
  }

  /*
   * Increments the Hugging Face download counter if the URI points to a Software Mansion Hugging Face repo.
   * More information: https://huggingface.co/docs/hub/models-download-stats
   */
  export async function triggerHuggingFaceDownloadCounter(uri: string) {
    const url = new URL(uri);
    if (
      url.host === 'huggingface.co' &&
      url.pathname.startsWith('/software-mansion/')
    ) {
      const baseUrl = `${url.protocol}//${url.host}${url.pathname.split('resolve')[0]}`;
      fetch(`${baseUrl}resolve/main/config.json`, { method: 'HEAD' });
    }
  }

  export async function createDirectoryIfNoExists() {
    if (!(await checkFileExists(RNEDirectory))) {
      await makeDirectoryAsync(RNEDirectory, { intermediates: true });
    }
  }

  export async function checkFileExists(fileUri: string) {
    const fileInfo = await getInfoAsync(fileUri);
    return fileInfo.exists;
  }

  export function getFilenameFromUri(uri: string) {
    let cleanUri = uri.replace(/^https?:\/\//, '');
    cleanUri = cleanUri.split('#')?.[0] ?? cleanUri;
    return cleanUri.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}
