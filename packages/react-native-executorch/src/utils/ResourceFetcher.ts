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

  static async fetch(
    callback: (downloadProgress: number) => void = () => {},
    ...sources: ResourceSource[]
  ) {
    return this.getAdapter().fetch(callback, ...sources);
  }

  static fs = {
    readAsString: async (path: string) => {
      return this.getAdapter().readAsString(path);
    },
  };
}
