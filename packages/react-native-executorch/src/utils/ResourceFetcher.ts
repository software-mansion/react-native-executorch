import { ResourceSource } from '../types/common';
import { RnExecutorchError } from '../errors/errorUtils';
import { RnExecutorchErrorCode } from '../errors/ErrorCodes';

/**
 * Adapter interface for resource fetching operations.
 *
 * **Required Methods:**
 * - {@link fetch}: Download resources to local storage (used by all modules)
 * - {@link readAsString}: Read file contents as string (used for config files)
 *
 * @remarks
 * This interface is intentionally minimal. Custom fetchers only need to implement
 * these two methods for the library to function correctly.
 */
export interface ResourceFetcherAdapter {
  /**
   * Download resources to local storage.
   *
   * @param callback - Progress callback (0-100)
   * @param sources - One or more resources to download
   * @returns Array of local file paths, or null if download was interrupted
   *
   * @remarks
   * **REQUIRED**: Used by all library modules for downloading models and resources.
   */
  fetch(
    callback: (downloadProgress: number) => void,
    ...sources: ResourceSource[]
  ): Promise<string[] | null>;

  /**
   * Read file contents as a string.
   *
   * @param path - Absolute file path
   * @returns File contents as string
   *
   * @remarks
   * **REQUIRED**: Used internally for reading configuration files (e.g., tokenizer configs).
   */
  readAsString(path: string): Promise<string>;
}

/**
 * This module provides functions to download and work with downloaded files stored in the application's document directory inside the `react-native-executorch/` directory.
 * These utilities can help you manage your storage and clean up the downloaded files when they are no longer needed.
 *
 * @category Utilities - General
 */
export class ResourceFetcher {
  private static adapter: ResourceFetcherAdapter | null = null;

  static setAdapter(adapter: ResourceFetcherAdapter) {
    this.adapter = adapter;
  }

  static resetAdapter() {
    this.adapter = null;
  }

  static getAdapter(): ResourceFetcherAdapter {
    if (!this.adapter) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.NotImplemented,
        'ResourceFetcher adapter is not initialized. Please call initExecutorch({ resourceFetcher: ... }) with a valid adapter, e.g., from @react-native-executorch/expo-resource-fetcher or @react-native-executorch/bare-resource-fetcher.'
      );
    }
    return this.adapter;
  }

  /**
   * Fetches resources (remote URLs, local files or embedded assets), downloads or stores them locally for use by React Native ExecuTorch.
   *
   * @param callback - Optional callback to track progress of all downloads, reported between 0 and 1.
   * @param sources - Multiple resources that can be strings, asset references, or objects.
   * @returns If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded/stored resources (without file:// prefix).
   * If the fetch was interrupted by `pauseFetching` or `cancelFetching`, it returns a promise which resolves to `null`.
   */
  static async fetch(
    callback: (downloadProgress: number) => void = () => {},
    ...sources: ResourceSource[]
  ) {
    return this.getAdapter().fetch(callback, ...sources);
  }

  /**
   * Pauses an ongoing download of files.
   *
   * @param sources - The resource identifiers used when calling `fetch`.
   * @returns A promise that resolves once the download is paused.
   */
  static async pauseFetching(...sources: ResourceSource[]) {
    return this.getAdapter().pauseFetching(...sources);
  }

  /**
   * Resumes a paused download of files.
   *
   * @param sources - The resource identifiers used when calling fetch.
   * @returns If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded resources (without file:// prefix).
   * If the fetch was again interrupted by `pauseFetching` or `cancelFetching`, it returns a promise which resolves to `null`.
   */
  static async resumeFetching(...sources: ResourceSource[]) {
    return this.getAdapter().resumeFetching(...sources);
  }

  /**
   * Cancels an ongoing/paused download of files.
   *
   * @param sources - The resource identifiers used when calling `fetch()`.
   * @returns A promise that resolves once the download is canceled.
   */
  static async cancelFetching(...sources: ResourceSource[]) {
    return this.getAdapter().cancelFetching(...sources);
  }

  /**
   * Lists all the downloaded files used by React Native ExecuTorch.
   *
   * @returns A promise, which resolves to an array of URIs for all the downloaded files.
   */
  static async listDownloadedFiles() {
    return this.getAdapter().listDownloadedFiles();
  }

  /**
   * Lists all the downloaded models used by React Native ExecuTorch.
   *
   * @returns A promise, which resolves to an array of URIs for all the downloaded models.
   */
  static async listDownloadedModels() {
    return this.getAdapter().listDownloadedModels();
  }

  /**
   * Deletes downloaded resources from the local filesystem.
   *
   * @param sources - The resource identifiers used when calling `fetch`.
   * @returns A promise that resolves once all specified resources have been removed.
   */
  static async deleteResources(...sources: ResourceSource[]) {
    return this.getAdapter().deleteResources(...sources);
  }

  /**
   * Fetches the info about files size. Works only for remote files.
   *
   * @param sources - The resource identifiers (URLs).
   * @returns A promise that resolves to combined size of files in bytes.
   */
  static async getFilesTotalSize(...sources: ResourceSource[]) {
    return this.getAdapter().getFilesTotalSize(...sources);
  }

  static fs = {
    readAsString: async (path: string) => {
      return this.getAdapter().readAsString(path);
    },
  };
}
