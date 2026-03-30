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
import { ResourceFetcherUtils } from './ResourceFetcherUtils';
import { Logger } from '../common/Logger';

/**
 * Adapter interface for resource fetching operations.
 * **Required Methods:**
 * - `fetch`: Download resources to local storage (used by all modules)
 * - `readAsString`: Read file contents as string (used for config files)
 * @category Utilities - General
 * @remarks
 * This interface is intentionally minimal. Custom fetchers only need to implement
 * these two methods for the library to function correctly.
 */
export interface ResourceFetcherAdapter {
  /**
   * Fetches resources (remote URLs, local files or embedded assets), downloads or stores them locally for use by React Native ExecuTorch.
   * @param callback - Optional callback to track progress of all downloads, reported between 0 and 1.
   * @param sources - Multiple resources that can be strings, asset references, or objects.
   * @returns If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded/stored resources (without file:// prefix).
   * If the fetch was interrupted, it returns a promise which resolves to `null`.
   * @remarks
   * **REQUIRED**: Used by all library modules for downloading models and resources.
   */
  fetch(
    callback: (downloadProgress: number) => void,
    ...sources: ResourceSource[]
  ): Promise<string[]>;

  /**
   * Read file contents as a string.
   * @param path - Absolute file path
   * @returns File contents as string
   * @remarks
   * **REQUIRED**: Used internally for reading configuration files (e.g., tokenizer configs).
   */
  readAsString(path: string): Promise<string>;
}

/**
 * This module provides functions to download and work with downloaded files stored in the application's document directory inside the `react-native-executorch/` directory.
 * These utilities can help you manage your storage and clean up the downloaded files when they are no longer needed.
 * @category Utilities - General
 */
export class ResourceFetcher {
  private static adapter: ResourceFetcherAdapter | null = null;
  private static reportedUrls = new Set<string>();

  /**
   * Sets a custom resource fetcher adapter for resource operations.
   * @param adapter - The adapter instance to use for fetching resources.
   * @remarks
   * **INTERNAL**: Used by platform-specific init functions (expo/bare) to inject their fetcher implementation.
   */
  static setAdapter(adapter: ResourceFetcherAdapter) {
    this.adapter = adapter;
  }

  /**
   * Resets the resource fetcher adapter to null.
   * @remarks
   * **INTERNAL**: Used primarily for testing purposes to clear the adapter state.
   */
  static resetAdapter() {
    this.adapter = null;
  }

  /**
   * Gets the current resource fetcher adapter instance.
   * @returns The configured ResourceFetcherAdapter instance.
   * @throws {RnExecutorchError} If no adapter has been set via {@link setAdapter}.
   * @remarks
   * **INTERNAL**: Used internally by all resource fetching operations.
   */
  static getAdapter(): ResourceFetcherAdapter {
    if (!this.adapter) {
      const errorMessage =
        'ResourceFetcher adapter is not initialized. Please call initExecutorch({ resourceFetcher: ... }) with a valid adapter, e.g., from react-native-executorch-expo-resource-fetcher or react-native-executorch-bare-resource-fetcher. For more details please refer to: https://docs.swmansion.com/react-native-executorch/docs/next/fundamentals/loading-models';
      // for sanity :)
      Logger.error(errorMessage);
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ResourceFetcherAdapterNotInitialized,
        errorMessage
      );
    }
    return this.adapter;
  }

  /**
   * Fetches resources (remote URLs, local files or embedded assets), downloads or stores them locally for use by React Native ExecuTorch.
   * @param callback - Optional callback to track progress of all downloads, reported between 0 and 1.
   * @param sources - Multiple resources that can be strings, asset references, or objects.
   * @returns If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded/stored resources (without file:// prefix).
   * If the fetch was interrupted, it returns a promise which resolves to `null`.
   */
  static async fetch(
    callback: (downloadProgress: number) => void = () => {},
    ...sources: ResourceSource[]
  ) {
    const result = await this.getAdapter().fetch(callback, ...sources);
    if (result) {
      for (const source of sources) {
        if (typeof source === 'string' && !this.reportedUrls.has(source)) {
          this.reportedUrls.add(source);
          try {
            ResourceFetcherUtils.triggerDownloadEvent(source);
            ResourceFetcherUtils.triggerHuggingFaceDownloadCounter(source);
          } catch (error) {
            throw error;
          }
        }
      }
    }
    return result;
  }

  /**
   * Filesystem utilities for reading downloaded resources.
   * @remarks
   * Provides access to filesystem operations through the configured adapter.
   * Currently supports reading file contents as strings for configuration files.
   */
  static fs = {
    /**
     * Reads the contents of a file as a string.
     * @param path - Absolute file path to read.
     * @returns A promise that resolves to the file contents as a string.
     * @remarks
     * **REQUIRED**: Used internally for reading configuration files (e.g., tokenizer configs).
     */
    readAsString: async (path: string) => {
      return this.getAdapter().readAsString(path);
    },
  };
}
