import { ResourceSource, Logger } from '..';

export enum HTTP_CODE {
  OK = 200,
  PARTIAL_CONTENT = 206,
}

export enum DownloadStatus {
  ONGOING,
  PAUSED,
}

export enum SourceType {
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

export namespace ResourceFetcherUtils {
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
      fetch(`${baseUrl}resolve/main/config.json`, { method: 'HEAD' }).catch(
        (e) => {
          Logger.warn(`Failed to trigger HF download counter: ${e}`);
        }
      );
    }
  }

  export function getFilenameFromUri(uri: string) {
    let cleanUri = uri.replace(/^https?:\/\//, '');
    cleanUri = cleanUri.split('#')?.[0] ?? cleanUri;
    return cleanUri.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}
