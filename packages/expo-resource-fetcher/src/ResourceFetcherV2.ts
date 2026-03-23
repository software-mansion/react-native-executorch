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
 *
 * **Technical Implementation:**
 * - Maintains a `downloads` Map to track active and paused downloads
 * - Successful downloads are automatically removed from the Map
 * - Uses `ResourceSourceExtended` interface for pause/resume functionality with linked-list behavior
 */

import {
  ResourceSource,
  ResourceFetcherAdapter,
  DownloadStatus,
  SourceType,
  RnExecutorchError,
  RnExecutorchErrorCode,
} from 'react-native-executorch';
import {
  ResourceSourceExtended,
  DownloadResource,
  ResourceFetcherUtils,
} from './ResourceFetcherUtils';
import {
  cacheDirectory,
  createDownloadResumable,
  DownloadResumable,
} from 'expo-file-system/legacy';
import { RNEDirectory } from './constants/directories';

export interface DownloadMetadata {
  source: ResourceSource;
  type: SourceType;
  remoteUri?: string;
  localUri: string;
  onDownloadProgress?: (downloadProgress: number) => void;
}

export interface DownloadAsset {
  downloadObj: DownloadResumable;
  status: DownloadStatus;
  metadata: DownloadMetadata;
}

interface ExpoResourceFetcherInterface extends ResourceFetcherAdapter {
  downloadAssets: Record<string, DownloadAsset>;
  singleFetch(source: ResourceSource): Promise<DownloadAsset>;
  returnOrStartNext(
    sourceExtended: ResourceSourceExtended,
    result: string | string[]
  ): string[] | Promise<string[] | null>;
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
  handleReleaseModeFile(source: DownloadAsset): Promise<string>;
  handleDevModeFile(source: DownloadAsset): Promise<string>;
  handleRemoteFile(source: DownloadAsset): Promise<string>;
  handleCachedDownload(source: ResourceSource): Promise<string>;
}

export const ExpoResourceFetcher: ExpoResourceFetcherInterface = {
  downloadAssets: {},

  async singleFetch(source: DownloadAsset): Promise<DownloadAsset> {
    switch (source.metadata.type) {
      case SourceType.OBJECT: {
        return await this.handleObject(source);
      }
      case SourceType.LOCAL_FILE: {
        return this.handleLocalFile(source);
      }
      case SourceType.RELEASE_MODE_FILE: {
        return this.handleReleaseModeFile(source);
      }
      case SourceType.DEV_MODE_FILE: {
        return this.handleDevModeFile(source);
      }
      case SourceType.REMOTE_FILE: {
        return this.handleRemoteFile(source);
      }
    }
  },

  async handleCachedDownload(source: ResourceSource) {},

  async handleRemoteFile(source: ResourceSource) {
    if (typeof source === 'object') {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidModelSource,
        'Model source is expected to be a string or a number.'
      );
    }
    if (this.downloadAssets[source]) {
      return this.handleCachedDownload(source);
    }

    const uri = 'asda';
    const targetFilename = ResourceFetcherUtils.getFilenameFromUri(uri);
    const fileUri = `${RNEDirectory}${targetFilename}`;
    const cacheFileUri = `${cacheDirectory}${targetFilename}`;

    if (await ResourceFetcherUtils.checkFileExists(fileUri)) {
      return ResourceFetcherUtils.removeFilePrefix(fileUri);
    }

    await ResourceFetcherUtils.createDirectoryIfNoExists();

    const downloadResumable = createDownloadResumable(uri, fileUri);
  },

  async fetch(
    callback: (downloadProgress: number) => void = () => {},
    ...sources: ResourceSource[]
  ) {
    if (sources.length === 0) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidUserInput,
        "Empty list given as an argument to Resource Fetcher's fetch() function!"
      );
    }

    const totalFilesLength = (await ResourceFetcherUtils.getFilesSizes(sources))
      .totalLength;
    const downloadedBytesCounter = 0;
    for (let source of sources) {
      const downloadResult = await this.singleFetch(source);
    }
    return [''];
  },
};
