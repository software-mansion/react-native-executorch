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

import { Directory, File } from 'expo-file-system';
import { RNEDirectory } from './constants/directories';
import {
  ResourceSource,
  RnExecutorchErrorCode,
  RnExecutorchError,
  BaseResourceFetcherClass,
} from 'react-native-executorch';

if (typeof Directory !== 'function' || typeof File !== 'function') {
  throw new RnExecutorchError(
    RnExecutorchErrorCode.ResourceFetcherFileSystemApiUnavailable,
    "react-native-executorch-expo-resource-fetcher: the new 'expo-file-system' API " +
      "(Directory/File) is unavailable — you're likely on Expo SDK <54. Import from " +
      "'react-native-executorch-expo-resource-fetcher/legacy' instead."
  );
}
import { ResourceFetcherUtils, DownloadStatus } from './ResourceFetcherUtils';
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
    downloadHandle.status = DownloadStatus.PAUSED;
    await downloadHandle.downloadTask.pauseAsync();
  }

  protected async resume(source: ResourceSource): Promise<void> {
    const downloadHandle = this.downloads.get(source)!;
    if (downloadHandle.status === DownloadStatus.ONGOING) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ResourceFetcherAlreadyOngoing,
        "The file download is currently ongoing. Can't resume the ongoing download."
      );
    }
    downloadHandle.status = DownloadStatus.ONGOING;

    let downloadedFile;
    try {
      downloadedFile = await downloadHandle.downloadTask.resumeAsync();
    } catch (error) {
      const current = this.downloads.get(source);
      // Paused again or canceled during resume — resolve/reject handled elsewhere.
      if (!current || current.status === DownloadStatus.PAUSED) return;
      this.downloads.delete(source);
      downloadHandle.reject(
        new RnExecutorchError(
          RnExecutorchErrorCode.ResourceFetcherDownloadFailed,
          `Failed to resume download from '${downloadHandle.uri}'`,
          error
        )
      );
      return;
    }

    const current = this.downloads.get(source);
    if (!current || current.status === DownloadStatus.PAUSED) return;

    // null means the task was paused again before completion — pause() handles it.
    if (!downloadedFile) return;

    await downloadedFile.move(new File(downloadHandle.fileUri));
    this.downloads.delete(source);
    downloadHandle.resolve(
      ResourceFetcherUtils.removeFilePrefix(downloadHandle.fileUri)
    );
  }

  protected async cancel(source: ResourceSource): Promise<void> {
    const downloadHandle = this.downloads.get(source)!;
    downloadHandle.downloadTask.cancel();
    this.downloads.delete(source);
    downloadHandle.reject(
      new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'Download was canceled.'
      )
    );
  }

  /**
   * Reads the contents of a file as a string.
   * @param path - Absolute file path or file URI to read.
   * @returns A promise that resolves to the file contents as a string.
   */
  async readAsString(path: string): Promise<string> {
    const uri = path.startsWith('file://') ? path : `file://${path}`;
    return new File(uri).text();
  }

  /**
   * Lists all the downloaded files used by React Native ExecuTorch.
   * @returns A promise that resolves to an array of URIs for all the downloaded files.
   */
  async listDownloadedFiles(): Promise<string[]> {
    return new Directory(RNEDirectory).list().map((entry) => entry.uri);
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
      const file = new File(`${RNEDirectory}${filename}`);
      if (file.exists) {
        file.delete();
      }
    }
  }

  /**
   * Fetches the total size of remote files. Works only for remote files.
   * @param sources - The resource identifiers (URLs).
   * @returns A promise that resolves to the combined size of files in bytes.
   */
  async getFilesTotalSize(...sources: ResourceSource[]): Promise<number> {
    return (await ResourceFetcherUtils.getFilesSizes(sources)).totalLength;
  }
}

export const ExpoResourceFetcher = new ExpoResourceFetcherClass();
