/**
 * Resource Fetcher for Expo applications.
 *
 * This module provides functions to download and manage files stored in the application's document directory
 * inside the `react-native-executorch/` directory. These utilities help manage storage and clean up downloaded
 * files when they are no longer needed.
 * @category Utilities - General
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
 * - The {@link fetch} method accepts a progress callback (0-1) and returns file paths or throws if interrupted
 */

import {
  deleteAsync,
  readDirectoryAsync,
  readAsStringAsync,
} from 'expo-file-system/legacy';
import { RNEDirectory } from './constants/directories';
import {
  ResourceSource,
  RnExecutorchErrorCode,
  RnExecutorchError,
  BaseResourceFetcherClass,
} from 'react-native-executorch';
import {
  ResourceFetcherUtils,
  HTTP_CODE,
  DownloadStatus,
} from './ResourceFetcherUtils';
import {
  type ActiveDownload,
  handleObject,
  handleLocalFile,
  handleAsset,
  handleRemote,
} from './handlers';

class ExpoResourceFetcherClass extends BaseResourceFetcherClass<ActiveDownload> {
  protected downloads = new Map<ResourceSource, ActiveDownload>();

  protected async getFilesSizes(sources: ResourceSource[]) {
    return ResourceFetcherUtils.getFilesSizes(sources);
  }

  protected async handleObject(source: object): Promise<string> {
    return handleObject(source);
  }

  protected handleLocalFile(source: string): string {
    return handleLocalFile(source);
  }

  protected handleAsset(
    source: number,
    progressCallback: (progress: number) => void
  ): Promise<string> {
    return handleAsset(source, progressCallback, this.downloads);
  }

  protected handleRemote(
    uri: string,
    source: ResourceSource,
    progressCallback: (progress: number) => void
  ): Promise<string> {
    return handleRemote(uri, source, progressCallback, this.downloads);
  }

  protected async pause(source: ResourceSource): Promise<void> {
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

  protected async resume(source: ResourceSource): Promise<void> {
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
      dl.reject(
        new RnExecutorchError(
          RnExecutorchErrorCode.ResourceFetcherDownloadFailed,
          `Failed to resume download from '${dl.uri}', status: ${result?.status}`
        )
      );
      return;
    }

    const { moveAsync } = await import('expo-file-system/legacy');
    await moveAsync({ from: dl.cacheFileUri, to: dl.fileUri });
    this.downloads.delete(source);
    ResourceFetcherUtils.triggerHuggingFaceDownloadCounter(dl.uri);
    dl.settle(ResourceFetcherUtils.removeFilePrefix(dl.fileUri));
  }

  protected async cancel(source: ResourceSource): Promise<void> {
    const dl = this.downloads.get(source)!;
    await dl.downloadResumable.cancelAsync();
    this.downloads.delete(source);
    dl.reject(
      new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'Download was canceled.'
      )
    );
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
   * Lists all the downloaded files used by React Native ExecuTorch.
   *
   * @returns A promise that resolves to an array of URIs for all the downloaded files.
   */
  async listDownloadedFiles(): Promise<string[]> {
    const files = await readDirectoryAsync(RNEDirectory);
    return files.map((file: string) => `${RNEDirectory}${file}`);
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
}

export const ExpoResourceFetcher = new ExpoResourceFetcherClass();
