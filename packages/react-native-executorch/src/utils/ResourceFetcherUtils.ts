import { getModelNameForUrl } from '../constants/modelUrls';
import {
  DOWNLOAD_EVENT_ENDPOINT,
  LIB_VERSION,
} from '../constants/resourceFetcher';
/**
 * Http status codes
 * @category Types
 */
export enum HTTP_CODE {
  /**
    Everything is ok.
   */
  OK = 200,

  /**
    Server has fulfilled a client request for a specific part of a resource, instead of sending the entire file.
   */
  PARTIAL_CONTENT = 206,
}

/**
 * Download status of the file.
 * @category Types
 */
export enum DownloadStatus {
  /**
   * Download is still in progress.
   */
  ONGOING,

  /**
   * Download is paused.
   */
  PAUSED,
}

/**
 * Types of sources that can be downloaded
 * @category Types
 */
export enum SourceType {
  /**
   * Represents a raw object or data structure.
   */
  OBJECT,

  /**
   * Represents a file stored locally on the filesystem.
   */
  LOCAL_FILE,

  /**
   * Represents a file bundled with the application in release mode.
   */
  RELEASE_MODE_FILE,

  /**
   * Represents a file served via the metro bundler during development.
   */
  DEV_MODE_FILE,

  /**
   * Represents a file located at a remote URL.
   */
  REMOTE_FILE,
}

/**
 * Utility functions for fetching and managing resources.
 * @category Utilities - General
 */
export namespace ResourceFetcherUtils {
  /**
   * Removes the 'file://' prefix from a URI if it exists.
   * @param uri - The URI to process.
   * @returns The URI without the 'file://' prefix.
   */
  export function removeFilePrefix(uri: string) {
    return uri.startsWith('file://') ? uri.slice(7) : uri;
  }

  /**
   * Generates a hash from a string representation of an object.
   * @param jsonString - The stringified JSON object to hash.
   * @returns The resulting hash as a string.
   */
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

  /**
   * Creates a progress callback that scales the current file's progress
   * relative to the total size of all files being downloaded.
   * @param totalLength - The total size of all files in the download batch.
   * @param previousFilesTotalLength - The sum of sizes of files already downloaded.
   * @param currentFileLength - The size of the file currently being downloaded.
   * @param setProgress - The main callback to update the global progress.
   * @returns A function that accepts the progress (0-1) of the current file.
   */
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

  /**
   * Increments the Hugging Face download counter if the URI points to a Software Mansion Hugging Face repo.
   * More information: https://huggingface.co/docs/hub/models-download-stats
   * @param uri - The URI of the file being downloaded.
   */
  export async function triggerHuggingFaceDownloadCounter(uri: string) {
    const url = new URL(uri);
    if (isUrlHfRepo(url)) {
      const baseUrl = `${url.protocol}//${url.host}${url.pathname.split('resolve')[0]}`;
      fetch(`${baseUrl}resolve/main/config.json`, { method: 'HEAD' });
    }
  }

  /**
   * Checks whether the given URL conforms to the huggingface.co/software-mansion schema.
   * @param url - the URL to the remote file
   * @returns Boolean specifying whether the given URL conforms to our HF repo schema
   */
  export function isUrlHfRepo(url: URL): boolean {
    return (
      url.host === 'huggingface.co' &&
      url.pathname.startsWith('/software-mansion')
    );
  }

  function getCountryCode(): string {
    try {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale;
      const regionTag = locale.split('-').pop();
      if (regionTag && regionTag.length === 2) {
        return regionTag.toUpperCase();
      }
    } catch {}
    return 'UNKNOWN';
  }

  export function isEmulator(): boolean {
    return global.__rne_isEmulator;
  }

  function getModelNameFromUri(uri: string): string {
    const knownName = getModelNameForUrl(uri);
    if (knownName) {
      return knownName;
    }
    const pathname = new URL(uri).pathname;
    const filename = pathname.split('/').pop() ?? uri;
    return filename.replace(/\.[^.]+$/, '');
  }

  /**
   * Sends a download event to the analytics endpoint.
   * @param uri - The URI of the downloaded resource.
   */
  export function triggerDownloadEvent(uri: string) {
    try {
      fetch(DOWNLOAD_EVENT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: getModelNameFromUri(uri),
          countryCode: getCountryCode(),
          isEmulator: isEmulator(),
          libVersion: LIB_VERSION,
        }),
      });
    } catch (e) {}
  }

  /**
   * Generates a safe filename from a URI by removing the protocol and replacing special characters.
   * @param uri - The source URI.
   * @returns A sanitized filename string.
   */
  export function getFilenameFromUri(uri: string) {
    let cleanUri = uri.replace(/^https?:\/\//, '');
    cleanUri = cleanUri.split('#')?.[0] ?? cleanUri;
    return cleanUri.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}
