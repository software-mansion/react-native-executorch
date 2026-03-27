/**
 * Resource Fetcher for Expo applications.
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
 */

import {
  deleteAsync,
  readDirectoryAsync,
  readAsStringAsync,
  moveAsync,
} from 'expo-file-system/legacy';
import { RNEDirectory } from './constants/directories';
import {
  ResourceSource,
  ResourceFetcherAdapter,
  RnExecutorchErrorCode,
  RnExecutorchError,
} from 'react-native-executorch';
import {
  ResourceFetcherUtils,
  HTTP_CODE,
  DownloadStatus,
  SourceType,
} from './ResourceFetcherUtils';
import {
  type ActiveDownload,
  handleObject,
  handleLocalFile,
  handleAsset,
  handleRemote,
} from './handlers';

class ExpoResourceFetcherClass implements ResourceFetcherAdapter {
  private downloads = new Map<ResourceSource, ActiveDownload>();

  /**
   * Fetches resources (remote URLs, local files or embedded assets), downloads or stores them locally
   * for use by React Native ExecuTorch.
   *
   * @param callback - Optional callback to track progress of all downloads, reported between 0 and 1.
   * @param sources - Multiple resources that can be strings, asset references, or objects.
   * @returns If the fetch was successful, resolves to an array of local file paths for the
   * downloaded/stored resources (without file:// prefix).
   * If the fetch was interrupted by `pauseFetching` or `cancelFetching`, resolves to `null`.
   */
  async fetch(
    callback: (downloadProgress: number) => void = () => {},
    ...sources: ResourceSource[]
  ): Promise<string[] | null> {
    if (sources.length === 0) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidUserInput,
        'Empty list given as an argument to Resource Fetcher'
      );
    }

    const { results: info, totalLength } =
      await ResourceFetcherUtils.getFilesSizes(sources);
    // Key by source so we can look up progress info without relying on index alignment
    // (getFilesSizes skips sources whose HEAD request fails)
    const infoMap = new Map(info.map((entry) => [entry.source, entry]));
    const results: string[] = [];

    for (const source of sources) {
      const fileInfo = infoMap.get(source);
      const progressCallback =
        fileInfo?.type === SourceType.REMOTE_FILE
          ? ResourceFetcherUtils.calculateDownloadProgress(
              totalLength,
              fileInfo.previousFilesTotalLength,
              fileInfo.length,
              callback
            )
          : () => {};

      const path = await this.fetchOne(source, progressCallback);
      if (path === null) return null;
      results.push(path);
    }

    return results;
  }

  /**
   * Reads the contents of a file as a string.
   *
   * @param path - Absolute file path or file URI to read.
   * @returns A promise that resolves to the file contents as a string.
   */
  async readAsString(path: string): Promise<string> {
    const uri = path.startsWith('file://') ? path : `file://${path}`;
    return readAsStringAsync(uri);
  }

  /**
   * Pauses an ongoing download of files.
   *
   * @param sources - The resource identifiers used when calling `fetch`.
   * @returns A promise that resolves once the download is paused.
   */
  async pauseFetching(...sources: ResourceSource[]): Promise<void> {
    const source = this.findActive(sources);
    await this.pause(source);
  }

  /**
   * Resumes a paused download of files.
   *
   * The result of the resumed download flows back through the original `fetch` promise.
   *
   * @param sources - The resource identifiers used when calling `fetch`.
   * @returns A promise that resolves once the resume handoff is complete.
   */
  async resumeFetching(...sources: ResourceSource[]): Promise<void> {
    const source = this.findActive(sources);
    await this.resume(source);
  }

  /**
   * Cancels an ongoing/paused download of files.
   *
   * @param sources - The resource identifiers used when calling `fetch()`.
   * @returns A promise that resolves once the download is canceled.
   */
  async cancelFetching(...sources: ResourceSource[]): Promise<void> {
    const source = this.findActive(sources);
    await this.cancel(source);
  }

  /**
   * Lists all the downloaded files used by React Native ExecuTorch.
   *
   * @returns A promise that resolves to an array of URIs for all the downloaded files.
   */
  async listDownloadedFiles(): Promise<string[]> {
    const files = await readDirectoryAsync(RNEDirectory);
    return files.map((file: string) => `${RNEDirectory}${file}`);
  }

  /**
   * Lists all the downloaded models used by React Native ExecuTorch.
   *
   * @returns A promise that resolves to an array of URIs for all the downloaded models.
   */
  async listDownloadedModels(): Promise<string[]> {
    const files = await this.listDownloadedFiles();
    return files.filter((file: string) => file.endsWith('.pte'));
  }

  /**
   * Deletes downloaded resources from the local filesystem.
   *
   * @param sources - The resource identifiers used when calling `fetch`.
   * @returns A promise that resolves once all specified resources have been removed.
   */
  async deleteResources(...sources: ResourceSource[]): Promise<void> {
    for (const source of sources) {
      const filename = ResourceFetcherUtils.getFilenameFromUri(
        source as string
      );
      const fileUri = `${RNEDirectory}${filename}`;
      if (await ResourceFetcherUtils.checkFileExists(fileUri)) {
        await deleteAsync(fileUri);
      }
    }
  }

  /**
   * Fetches the total size of remote files. Works only for remote files.
   *
   * @param sources - The resource identifiers (URLs).
   * @returns A promise that resolves to the combined size of files in bytes.
   */
  async getFilesTotalSize(...sources: ResourceSource[]): Promise<number> {
    return (await ResourceFetcherUtils.getFilesSizes(sources)).totalLength;
  }

  private async fetchOne(
    source: ResourceSource,
    progressCallback: (progress: number) => void
  ): Promise<string | null> {
    const type = ResourceFetcherUtils.getType(source);
    switch (type) {
      case SourceType.OBJECT:
        return handleObject(source as object);
      case SourceType.LOCAL_FILE:
        return handleLocalFile(source as string);
      case SourceType.RELEASE_MODE_FILE:
      case SourceType.DEV_MODE_FILE:
        return handleAsset(source as number, progressCallback, this.downloads);
      default: // REMOTE_FILE
        return handleRemote(
          source as string,
          source,
          progressCallback,
          this.downloads
        );
    }
  }

  private async pause(source: ResourceSource): Promise<void> {
    const dl = this.downloads.get(source)!;
    if (dl.status === DownloadStatus.PAUSED) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ResourceFetcherAlreadyPaused,
        "The file download is currently paused. Can't pause the download of the same file twice."
      );
    }
    dl.status = DownloadStatus.PAUSED;
    await dl.downloadResumable.pauseAsync();
  }

  private async resume(source: ResourceSource): Promise<void> {
    const dl = this.downloads.get(source)!;
    if (dl.status === DownloadStatus.ONGOING) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ResourceFetcherAlreadyOngoing,
        "The file download is currently ongoing. Can't resume the ongoing download."
      );
    }
    dl.status = DownloadStatus.ONGOING;
    const result = await dl.downloadResumable.resumeAsync();
    const current = this.downloads.get(source);
    // Paused again or canceled during resume — settle/reject handled elsewhere.
    if (!current || current.status === DownloadStatus.PAUSED) return;

    if (
      !result ||
      (result.status !== HTTP_CODE.OK &&
        result.status !== HTTP_CODE.PARTIAL_CONTENT)
    ) {
      this.downloads.delete(source);
      // Propagate the failure through the original fetch() promise.
      dl.reject(
        new RnExecutorchError(
          RnExecutorchErrorCode.ResourceFetcherDownloadFailed,
          `Failed to resume download from '${dl.uri}', status: ${result?.status}`
        )
      );
      return;
    }

    await moveAsync({ from: dl.cacheFileUri, to: dl.fileUri });
    this.downloads.delete(source);
    ResourceFetcherUtils.triggerHuggingFaceDownloadCounter(dl.uri);
    dl.settle(ResourceFetcherUtils.removeFilePrefix(dl.fileUri));
  }

  private async cancel(source: ResourceSource): Promise<void> {
    const dl = this.downloads.get(source)!;
    await dl.downloadResumable.cancelAsync();
    this.downloads.delete(source);
    dl.settle(null);
  }

  private findActive(sources: ResourceSource[]): ResourceSource {
    for (const source of sources) {
      if (this.downloads.has(source)) {
        return source;
      }
    }
    throw new RnExecutorchError(
      RnExecutorchErrorCode.ResourceFetcherNotActive,
      'None of given sources are currently during downloading process.'
    );
  }
}

export const ExpoResourceFetcher = new ExpoResourceFetcherClass();
