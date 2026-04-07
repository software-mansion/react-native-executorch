/**
 * Resource Fetcher for React Native applications.
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
 * - Pause/resume operations are only supported on iOS
 * - Most functions accept multiple `ResourceSource` arguments (string, number, or object)
 * - The {@link fetch} method accepts a progress callback (0-1) and returns file paths or null if interrupted
 */

import * as RNFS from '@dr.pogodin/react-native-fs';
import { Platform } from 'react-native';
import { RNEDirectory } from './constants/directories';
import {
  ResourceSource,
  RnExecutorchErrorCode,
  RnExecutorchError,
  BaseResourceFetcherClass,
} from 'react-native-executorch';
import { ResourceFetcherUtils, DownloadStatus } from './ResourceFetcherUtils';
import {
  type ActiveDownload,
  handleObject,
  handleLocalFile,
  handleAsset,
  handleRemote,
} from './handlers';

class BareResourceFetcherClass extends BaseResourceFetcherClass<ActiveDownload> {
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
  ): Promise<{ path: string; wasDownloaded: boolean }> {
    return handleRemote(uri, source, progressCallback, this.downloads);
  }

  protected async pause(source: ResourceSource): Promise<void> {
    const downloadHandle = this.downloads.get(source)!;
    if (downloadHandle.status === DownloadStatus.PAUSED) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ResourceFetcherAlreadyPaused,
        "The file download is currently paused. Can't pause the download of the same file twice."
      );
    }
    if (Platform.OS === 'android') {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ResourceFetcherPlatformNotSupported,
        'Pause is not supported on Android. Use cancelFetching and re-fetch instead.'
      );
    }
    if (!downloadHandle.task) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ResourceFetcherDownloadFailed,
        'Download task is missing. This should not happen on iOS.'
      );
    }
    downloadHandle.status = DownloadStatus.PAUSED;
    downloadHandle.task.pause();
  }

  protected async resume(source: ResourceSource): Promise<void> {
    const downloadHandle = this.downloads.get(source)!;
    if (downloadHandle.status === DownloadStatus.ONGOING) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ResourceFetcherAlreadyOngoing,
        "The file download is currently ongoing. Can't resume the ongoing download."
      );
    }
    if (Platform.OS === 'android') {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ResourceFetcherPlatformNotSupported,
        'Resume is not supported on Android. Use fetch to restart the download.'
      );
    }
    if (!downloadHandle.task) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ResourceFetcherDownloadFailed,
        'Download task is missing. This should not happen on iOS.'
      );
    }
    // Set status back to ONGOING before resuming so the .done() callback
    // registered in handleRemote knows it's safe to proceed (not paused/canceled).
    downloadHandle.status = DownloadStatus.ONGOING;
    downloadHandle.task.resume();
  }

  protected async cancel(source: ResourceSource): Promise<void> {
    const downloadHandle = this.downloads.get(source)!;

    if (Platform.OS === 'ios') {
      if (!downloadHandle.task) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ResourceFetcherDownloadFailed,
          'Download task is missing. This should not happen on iOS.'
        );
      }
      downloadHandle.task.stop();
    } else if (Platform.OS === 'android') {
      if (downloadHandle.jobId === undefined) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ResourceFetcherDownloadFailed,
          'Download job ID is missing. This should not happen on Android.'
        );
      }
      RNFS.stopDownload(downloadHandle.jobId);
      if (
        await ResourceFetcherUtils.checkFileExists(downloadHandle.cacheFileUri)
      ) {
        await RNFS.unlink(downloadHandle.cacheFileUri);
      }
    }

    this.downloads.delete(source);
    downloadHandle.reject(
      new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'Download was canceled.'
      )
    );
  }

  /**
   * Lists all the downloaded files used by React Native ExecuTorch.
   *
   * @returns A promise that resolves to an array of URIs for all the downloaded files.
   */
  async listDownloadedFiles(): Promise<string[]> {
    const files = await RNFS.readDir(RNEDirectory);
    return files.map((file: any) => file.path);
  }

  /**
   * Lists all the downloaded models used by React Native ExecuTorch.
   * @returns A promise, which resolves to an array of URIs for all the downloaded models.
   */
  async listDownloadedModels() {
    const files = await this.listDownloadedFiles();
    return files.filter((file: string) => file.endsWith('.pte'));
  }

  /**
   * Deletes downloaded resources from the local filesystem.
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
        await RNFS.unlink(fileUri);
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

  /**
   * Reads the contents of a file as a string.
   * @param path - Absolute file path to read.
   * @returns A promise that resolves to the file contents as a string.
   */
  async readAsString(path: string): Promise<string> {
    return RNFS.readFile(path, 'utf8');
  }
}

export const BareResourceFetcher = new BareResourceFetcherClass();
