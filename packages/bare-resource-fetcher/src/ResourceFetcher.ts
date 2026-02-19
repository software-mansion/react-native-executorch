/**
 * Resource Fetcher for React Native applications.
 *
 * This module provides functions to download and manage files stored in the application's document directory
 * inside the `react-native-executorch/` directory. These utilities help manage storage and clean up downloaded
 * files when they are no longer needed.
 *
 * @category Utilities - General
 *
 * @remarks
 * **Key Functionality:**
 * - **Download Control**: Pause, resume, and cancel operations through:
 *   - {@link pauseFetching} - Pause ongoing downloads
 *   - {@link resumeFetching} - Resume paused downloads
 *   - {@link cancelFetching} - Cancel ongoing or paused downloads
 * - **File Management**:
 *   - {@link getFilesTotalSize} - Get total size of resources
 *   - {@link listDownloadedFiles} - List all downloaded files
 *   - {@link listDownloadedModels} - List downloaded model files (.pte)
 *   - {@link deleteResources} - Delete downloaded resources
 *
 * **Important Notes:**
 * - Pause/resume/cancel operations work only for remote resources
 * - Most functions accept multiple `ResourceSource` arguments (string, number, or object)
 * - The {@link fetch} method accepts a progress callback (0-1) and returns file paths or null if interrupted
 *
 * **Technical Implementation:**
 * - Maintains a `downloads` Map to track active and paused downloads
 * - Successful downloads are automatically removed from the Map
 * - Uses `ResourceSourceExtended` interface for pause/resume functionality with linked-list behavior
 */

import {
  createDownloadTask,
  completeHandler,
  DownloadTask,
  BeginHandlerParams,
  ProgressHandlerParams,
} from '@kesha-antonov/react-native-background-downloader';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { Image } from 'react-native';
import { RNEDirectory } from './constants/directories';
import {
  ResourceSource,
  ResourceFetcherAdapter,
  RnExecutorchErrorCode,
  RnExecutorchError,
} from 'react-native-executorch';
import {
  ResourceFetcherUtils,
  DownloadStatus,
  SourceType,
  ResourceSourceExtended,
} from './ResourceFetcherUtils';

interface DownloadResource {
  task: DownloadTask;
  status: DownloadStatus;
  extendedInfo: ResourceSourceExtended;
}

interface BareResourceFetcherInterface extends ResourceFetcherAdapter {
  downloads: Map<ResourceSource, DownloadResource>;
  singleFetch(sourceExtended: ResourceSourceExtended): Promise<string[] | null>;
  returnOrStartNext(
    sourceExtended: ResourceSourceExtended,
    result: string | string[]
  ): string[] | Promise<string[] | null>;
  completeDownload(
    extendedInfo: ResourceSourceExtended,
    source: ResourceSource
  ): Promise<string[] | null>;
  pause(source: ResourceSource): Promise<void>;
  resume(source: ResourceSource): Promise<string[] | null>;
  cancel(source: ResourceSource): Promise<void>;
  findActive(sources: ResourceSource[]): ResourceSource;
  pauseFetching(...sources: ResourceSource[]): Promise<void>;
  resumeFetching(...sources: ResourceSource[]): Promise<void>;
  cancelFetching(...sources: ResourceSource[]): Promise<void>;
  listDownloadedFiles(): Promise<string[]>;
  listDownloadedModels(): Promise<string[]>;
  deleteResources(...sources: ResourceSource[]): Promise<void>;
  getFilesTotalSize(...sources: ResourceSource[]): Promise<number>;
  handleObject(source: ResourceSource): Promise<string>;
  handleLocalFile(source: ResourceSource): string;
  handleReleaseModeFile(
    sourceExtended: ResourceSourceExtended
  ): Promise<string>;
  handleDevModeFile(
    sourceExtended: ResourceSourceExtended
  ): Promise<string[] | string | null>;
  handleRemoteFile(
    sourceExtended: ResourceSourceExtended
  ): Promise<string[] | string | null>;
}

/**
 * This module provides functions to download and work with downloaded files stored in the application's document directory inside the `react-native-executorch/` directory.
 * These utilities can help you manage your storage and clean up the downloaded files when they are no longer needed.
 *
 * @category Utilities - General
 */
export const BareResourceFetcher: BareResourceFetcherInterface = {
  downloads: new Map<ResourceSource, DownloadResource>(), //map of currently downloading (or paused) files, if the download was started by .fetch() method.

  /**
   * Fetches resources (remote URLs, local files or embedded assets), downloads or stores them locally for use by React Native ExecuTorch.
   *
   * @param callback - Optional callback to track progress of all downloads, reported between 0 and 1.
   * @param sources - Multiple resources that can be strings, asset references, or objects.
   * @returns If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded/stored resources (without file:// prefix).
   * If the fetch was interrupted by `pauseFetching` or `cancelFetching`, it returns a promise which resolves to `null`.
   */
  async fetch(
    callback: (downloadProgress: number) => void = () => {},
    ...sources: ResourceSource[]
  ) {
    if (sources.length === 0) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidUserInput,
        'Empty list given as an argument'
      );
    }
    const { results: info, totalLength } =
      await ResourceFetcherUtils.getFilesSizes(sources);
    const head: ResourceSourceExtended = {
      source: info[0]!.source,
      sourceType: info[0]!.type,
      callback:
        info[0]!.type === SourceType.REMOTE_FILE
          ? ResourceFetcherUtils.calculateDownloadProgress(
              totalLength,
              info[0]!.previousFilesTotalLength,
              info[0]!.length,
              callback
            )
          : () => {},
      results: [],
    };

    let node = head;
    for (let idx = 1; idx < sources.length; idx++) {
      node.next = {
        source: info[idx]!.source,
        sourceType: info[idx]!.type,
        callback:
          info[idx]!.type === SourceType.REMOTE_FILE
            ? ResourceFetcherUtils.calculateDownloadProgress(
                totalLength,
                info[idx]!.previousFilesTotalLength,
                info[idx]!.length,
                callback
              )
            : () => {},
        results: [],
      };
      node = node.next;
    }
    return this.singleFetch(head);
  },

  async singleFetch(
    sourceExtended: ResourceSourceExtended
  ): Promise<string[] | null> {
    const source = sourceExtended.source;
    switch (sourceExtended.sourceType) {
      case SourceType.OBJECT: {
        return this.returnOrStartNext(
          sourceExtended,
          await this.handleObject(source)
        );
      }
      case SourceType.LOCAL_FILE: {
        return this.returnOrStartNext(
          sourceExtended,
          this.handleLocalFile(source)
        );
      }
      case SourceType.RELEASE_MODE_FILE: {
        return this.returnOrStartNext(
          sourceExtended,
          await this.handleReleaseModeFile(sourceExtended)
        );
      }
      case SourceType.DEV_MODE_FILE: {
        const result = await this.handleDevModeFile(sourceExtended);
        if (result !== null) {
          return this.returnOrStartNext(sourceExtended, result);
        }
        return null;
      }
      default: {
        //case SourceType.REMOTE_FILE
        const result = await this.handleRemoteFile(sourceExtended);
        if (result !== null) {
          return this.returnOrStartNext(sourceExtended, result);
        }
        return null;
      }
    }
  },

  //if any download ends successfully this function is called - it checks whether it should trigger next download or return list of paths.
  returnOrStartNext(sourceExtended: ResourceSourceExtended, result: string) {
    sourceExtended.results.push(result);

    if (sourceExtended.next) {
      const nextSource = sourceExtended.next;
      nextSource.results.push(...sourceExtended.results);
      return this.singleFetch(nextSource);
    }
    sourceExtended.callback!(1);
    return sourceExtended.results;
  },

  async pause(source: ResourceSource) {
    const resource = this.downloads.get(source);
    if (!resource) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.NotFound,
        'No active download found for the given source'
      );
    }
    switch (resource.status) {
      case DownloadStatus.PAUSED:
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ResourceFetcherAlreadyPaused,
          "The file download is currently paused. Can't pause the download of the same file twice."
        );
      default: {
        resource.status = DownloadStatus.PAUSED;
        resource.task.pause();
      }
    }
  },

  async resume(source: ResourceSource) {
    const resource = this.downloads.get(source)!;
    if (
      !resource.extendedInfo.fileUri ||
      !resource.extendedInfo.cacheFileUri ||
      !resource.extendedInfo.uri
    ) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ResourceFetcherMissingUri,
        'Something went wrong. File uri info is not specified'
      );
    }
    switch (resource.status) {
      case DownloadStatus.ONGOING:
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ResourceFetcherAlreadyOngoing,
          "The file download is currently ongoing. Can't resume the ongoing download."
        );
      default: {
        resource.status = DownloadStatus.ONGOING;
        resource.task.resume();

        return new Promise((resolve, reject) => {
          resource.task
            .done(async () => {
              const result = await this.completeDownload(
                resource.extendedInfo,
                source
              );
              resolve(result);
            })
            .error((e: any) => {
              reject(e);
            });
        });
      }
    }
  },

  async cancel(source: ResourceSource) {
    const resource = this.downloads.get(source);
    if (!resource) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.NotFound,
        'No active download found for the given source'
      );
    }
    resource.task.stop();
    this.downloads.delete(source);
  },

  async completeDownload(
    extendedInfo: ResourceSourceExtended,
    source: ResourceSource
  ): Promise<string[] | null> {
    // Check if download was cancelled or paused
    if (
      !this.downloads.has(source) ||
      this.downloads.get(source)!.status === DownloadStatus.PAUSED
    ) {
      return null;
    }

    await RNFS.moveFile(extendedInfo.cacheFileUri!, extendedInfo.fileUri!);
    this.downloads.delete(source);
    ResourceFetcherUtils.triggerHuggingFaceDownloadCounter(extendedInfo.uri!);

    const filename = extendedInfo.fileUri!.split('/').pop();
    if (filename) {
      await completeHandler(filename);
    }

    const result = this.returnOrStartNext(
      extendedInfo,
      ResourceFetcherUtils.removeFilePrefix(extendedInfo.fileUri!)
    );
    return result instanceof Promise ? await result : result;
  },

  /**
   * Pauses an ongoing download of files.
   *
   * @param sources - The resource identifiers used when calling `fetch`.
   * @returns A promise that resolves once the download is paused.
   */
  async pauseFetching(...sources: ResourceSource[]) {
    const source = this.findActive(sources);
    await this.pause(source);
  },

  /**
   * Resumes a paused download of files.
   *
   * @param sources - The resource identifiers used when calling fetch.
   * @returns If the fetch was successful, it returns a promise which resolves to an array of local file paths for the downloaded resources (without file:// prefix).
   * If the fetch was again interrupted by `pauseFetching` or `cancelFetching`, it returns a promise which resolves to `null`.
   */
  async resumeFetching(...sources: ResourceSource[]) {
    const source = this.findActive(sources);
    await this.resume(source);
  },

  /**
   * Cancels an ongoing/paused download of files.
   *
   * @param sources - The resource identifiers used when calling `fetch()`.
   * @returns A promise that resolves once the download is canceled.
   */
  async cancelFetching(...sources: ResourceSource[]) {
    const source = this.findActive(sources);
    await this.cancel(source);
  },

  findActive(sources: ResourceSource[]) {
    for (const source of sources) {
      if (this.downloads.has(source)) {
        return source;
      }
    }
    throw new RnExecutorchError(
      RnExecutorchErrorCode.ResourceFetcherNotActive,
      'None of given sources are currently during downloading process.'
    );
  },

  /**
   * Lists all the downloaded files used by React Native ExecuTorch.
   *
   * @returns A promise, which resolves to an array of URIs for all the downloaded files.
   */
  async listDownloadedFiles() {
    const files = await RNFS.readDir(RNEDirectory);
    return files.map((file: any) => file.path);
  },

  /**
   * Lists all the downloaded models used by React Native ExecuTorch.
   *
   * @returns A promise, which resolves to an array of URIs for all the downloaded models.
   */
  async listDownloadedModels() {
    const files = await this.listDownloadedFiles();
    return files.filter((file: string) => file.endsWith('.pte'));
  },

  /**
   * Deletes downloaded resources from the local filesystem.
   *
   * @param sources - The resource identifiers used when calling `fetch`.
   * @returns A promise that resolves once all specified resources have been removed.
   */
  async deleteResources(...sources: ResourceSource[]) {
    for (const source of sources) {
      const filename = ResourceFetcherUtils.getFilenameFromUri(
        source as string
      );
      const fileUri = `${RNEDirectory}${filename}`;
      if (await ResourceFetcherUtils.checkFileExists(fileUri)) {
        await RNFS.unlink(fileUri);
      }
    }
  },

  /**
   * Fetches the info about files size. Works only for remote files.
   *
   * @param sources - The resource identifiers (URLs).
   * @returns A promise that resolves to combined size of files in bytes.
   */
  async getFilesTotalSize(...sources: ResourceSource[]) {
    return (await ResourceFetcherUtils.getFilesSizes(sources)).totalLength;
  },

  async handleObject(source: ResourceSource) {
    if (typeof source !== 'object') {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidModelSource,
        'Source is expected to be object'
      );
    }
    const jsonString = JSON.stringify(source);
    const digest = ResourceFetcherUtils.hashObject(jsonString);
    const filename = `${digest}.json`;
    const path = `${RNEDirectory}${filename}`;

    if (await ResourceFetcherUtils.checkFileExists(path)) {
      return ResourceFetcherUtils.removeFilePrefix(path);
    }

    await ResourceFetcherUtils.createDirectoryIfNoExists();
    await RNFS.writeFile(path, jsonString, 'utf8');

    return ResourceFetcherUtils.removeFilePrefix(path);
  },

  handleLocalFile(source: ResourceSource) {
    if (typeof source !== 'string') {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidModelSource,
        'Source is expected to be string'
      );
    }
    return ResourceFetcherUtils.removeFilePrefix(source);
  },

  async handleReleaseModeFile(sourceExtended: ResourceSourceExtended) {
    const source = sourceExtended.source;
    if (typeof source !== 'number') {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidModelSource,
        'Source is expected to be number'
      );
    }
    const assetSource = Image.resolveAssetSource(source);
    const uri = assetSource.uri;
    const filename = ResourceFetcherUtils.getFilenameFromUri(uri);
    const fileUri = `${RNEDirectory}${filename}`;

    if (await ResourceFetcherUtils.checkFileExists(fileUri)) {
      return ResourceFetcherUtils.removeFilePrefix(fileUri);
    }
    await ResourceFetcherUtils.createDirectoryIfNoExists();

    if (uri.startsWith('http') || uri.startsWith('file')) {
      await RNFS.copyFile(uri, fileUri);
    }
    return ResourceFetcherUtils.removeFilePrefix(fileUri);
  },

  async handleDevModeFile(sourceExtended: ResourceSourceExtended) {
    const source = sourceExtended.source;
    if (typeof source !== 'number') {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidModelSource,
        'Source is expected to be a number'
      );
    }
    sourceExtended.uri = Image.resolveAssetSource(source).uri;
    return await this.handleRemoteFile(sourceExtended);
  },

  async handleRemoteFile(sourceExtended: ResourceSourceExtended) {
    const source = sourceExtended.source;
    if (typeof source === 'object') {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidModelSource,
        'Source is expected to be a string or a number'
      );
    }
    if (this.downloads.has(source)) {
      const resource = this.downloads.get(source)!;
      if (resource.status === DownloadStatus.PAUSED) {
        // if the download is paused, `fetch` is treated like `resume`
        return this.resume(source);
      }
      // if the download is ongoing, throw error.
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ResourceFetcherDownloadInProgress,
        'Already downloading this file'
      );
    }
    if (typeof source === 'number' && !sourceExtended.uri) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ResourceFetcherMissingUri,
        'Source Uri is expected to be available here'
      );
    }
    if (typeof source === 'string') {
      sourceExtended.uri = source;
    }
    const uri = sourceExtended.uri!;
    const filename = ResourceFetcherUtils.getFilenameFromUri(uri);
    sourceExtended.fileUri = `${RNEDirectory}${filename}`;
    sourceExtended.cacheFileUri = `${RNFS.CachesDirectoryPath}/${filename}`;

    if (await ResourceFetcherUtils.checkFileExists(sourceExtended.fileUri)) {
      return ResourceFetcherUtils.removeFilePrefix(sourceExtended.fileUri);
    }
    await ResourceFetcherUtils.createDirectoryIfNoExists();

    return new Promise((resolve, reject) => {
      const task = createDownloadTask({
        id: filename,
        url: uri,
        destination: sourceExtended.cacheFileUri!,
      })
        .begin((_: BeginHandlerParams) => {
          sourceExtended.callback!(0);
        })
        .progress((progress: ProgressHandlerParams) => {
          sourceExtended.callback!(
            progress.bytesDownloaded / progress.bytesTotal
          );
        })
        .done(async () => {
          const nextResult = await this.completeDownload(
            sourceExtended,
            source
          );
          resolve(nextResult);
        })
        .error((error: any) => {
          this.downloads.delete(source);
          reject(
            new RnExecutorchError(
              RnExecutorchErrorCode.ResourceFetcherDownloadFailed,
              `Failed to fetch resource from '${source}', context: ${error}`
            )
          );
        });

      // Start the download task
      task.start();

      const downloadResource: DownloadResource = {
        task: task,
        status: DownloadStatus.ONGOING,
        extendedInfo: sourceExtended,
      };
      this.downloads.set(source, downloadResource);
    });
  },

  /**
   * Reads the contents of a file as a string.
   *
   * @param path - Absolute file path to read.
   * @returns A promise that resolves to the file contents as a string.
   *
   * @remarks
   * **REQUIRED**: Used internally for reading configuration files (e.g., tokenizer configs).
   */
  async readAsString(path: string) {
    return await RNFS.readFile(path, 'utf8');
  },
};
