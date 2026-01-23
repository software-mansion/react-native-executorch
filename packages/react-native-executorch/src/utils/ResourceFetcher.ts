import { ResourceSource } from '../types/common';
import {
  ResourceFetcherUtils,
  HTTP_CODE,
  DownloadStatus,
  SourceType,
  ResourceSourceExtended,
  DownloadResource,
} from './ResourceFetcherUtils';
import { RnExecutorchErrorCode } from '../errors/ErrorCodes';
import { RnExecutorchError } from '../errors/errorUtils';

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
      throw new Error(
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
