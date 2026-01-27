/**
 * Resource Fetcher
 *
 * Provides an interface for downloading files (via `ResourceFetcher.fetch()`)
 *
 * Key functionality:
 * - Download control: pause, resume, and cancel operations through:
 *   - Single file: `.pauseFetching()`, `.resumeFetching()`, `.cancelFetching()`
 * - Downloaded file management:
 *   -  `.getFilesTotalSize()`, `.listDownloadedFiles()`, `.listDownloadedModels()`, `.deleteResources()`
 *
 * Remark: The pausing/resuming/canceling works only for fetching remote resources.
 *
 * Most exported functions accept:
 * - Multiple `ResourceSource` arguments, (union type of string, number or object)
 *
 * Method `.fetch()` takes argument as callback that reports download progress.
 * Method`.fetch()` returns array of paths to successfully saved files or null if the download was paused or cancelled  (then resume functions can return paths).
 *
 * Technical Implementation:
 * - Maintains a `downloads` Map instance that tracks:
 *   - Currently downloading resources
 *   - Paused downloads
 * - Successful downloads are automatically removed from the `downloads` Map
 * - Uses the `ResourceSourceExtended` interface to enable pause/resume functionality:
 *   - Wraps user-provided `ResourceSource` elements
 *   - Implements linked list behavior via the `.next` attribute
 *   - Automatically processes subsequent downloads when `.next` contains a valid resource
 */

import { ResourceSource } from '../types/common';
import { RnExecutorchError } from '../errors/errorUtils';
import { RnExecutorchErrorCode } from '../errors/ErrorCodes';

export interface ResourceFetcherAdapter {
  fetch(
    callback: (downloadProgress: number) => void,
    ...sources: ResourceSource[]
  ): Promise<string[] | null>;
  pauseFetching(...sources: ResourceSource[]): Promise<void>;
  resumeFetching(...sources: ResourceSource[]): Promise<void>;
  cancelFetching(...sources: ResourceSource[]): Promise<void>;
  listDownloadedFiles(): Promise<string[]>;
  listDownloadedModels(): Promise<string[]>;
  deleteResources(...sources: ResourceSource[]): Promise<void>;
  getFilesTotalSize(...sources: ResourceSource[]): Promise<number>;
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

  static getAdapter(): ResourceFetcherAdapter {
    if (!this.adapter) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.NotImplemented,
        'ResourceFetcher adapter is not initialized. Please call initExecutorch({ resourceFetcher: ... }) with a valid adapter, e.g., from @rn-executorch/expo-adapter or @rn-executorch/bare-adapter.'
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
