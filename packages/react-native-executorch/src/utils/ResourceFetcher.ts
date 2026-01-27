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

export class ResourceFetcher {
  private static adapter: ResourceFetcherAdapter | null = null;

  static setAdapter(adapter: ResourceFetcherAdapter) {
    this.adapter = adapter;
  }

  static getAdapter(): ResourceFetcherAdapter {
    if (!this.adapter) {
      throw new Error(
        'ResourceFetcher adapter is not initialized. Please call initExecutorch({ resourceFetcher: ... }) with a valid adapter, e.g., from @rn-executorch/expo-adapter or @rn-executorch/bare-adapter.'
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

  static async pauseFetching(...sources: ResourceSource[]) {
    return this.getAdapter().pauseFetching(...sources);
  }

  static async resumeFetching(...sources: ResourceSource[]) {
    return this.getAdapter().resumeFetching(...sources);
  }

  static async cancelFetching(...sources: ResourceSource[]) {
    return this.getAdapter().cancelFetching(...sources);
  }

  static async listDownloadedFiles() {
    return this.getAdapter().listDownloadedFiles();
  }

  static async listDownloadedModels() {
    return this.getAdapter().listDownloadedModels();
  }

  static async deleteResources(...sources: ResourceSource[]) {
    return this.getAdapter().deleteResources(...sources);
  }

  static async getFilesTotalSize(...sources: ResourceSource[]) {
    return this.getAdapter().getFilesTotalSize(...sources);
  }

  static fs = {
    readAsString: async (path: string) => {
      return this.getAdapter().readAsString(path);
    },
  };
}
