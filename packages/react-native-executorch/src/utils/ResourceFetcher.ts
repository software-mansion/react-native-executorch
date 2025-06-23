import {
  cacheDirectory,
  createDownloadResumable,
  getInfoAsync,
  makeDirectoryAsync,
  moveAsync,
  FileSystemSessionType,
  writeAsStringAsync,
  EncodingType,
  deleteAsync,
  readDirectoryAsync,
  DownloadResumable,
} from 'expo-file-system';
import { Asset } from 'expo-asset';
import { RNEDirectory } from '../constants/directories';
import { ResourceSource } from '../types/common';

enum DownloadStatus {
  ONGOING,
  PAUSED,
}

interface DownloadResource {
  downloadResumable: DownloadResumable;
  status: DownloadStatus;
  uri: string;
  fileUri: string;
  cacheFileUri: string;
  next?: ResourceSource;
}

export class ResourceFetcher {
  static singleDownloads = new Map<ResourceSource, DownloadResource>(); //map of currently downloading (or paused) files, if the download was started by .fetch() method.

  static async fetch(
    source: ResourceSource,
    callback: (downloadProgress: number) => void = () => {}
  ) {
    if (typeof source === 'object') {
      return this.handleObject(source);
    }

    const uri =
      typeof source === 'number' ? Asset.fromModule(source).uri : source;

    // Handle local files
    if (uri.startsWith('file://')) {
      return this.removeFilePrefix(uri);
    }

    const filename = this.getFilenameFromUri(uri);
    const fileUri = `${RNEDirectory}${filename}`;

    if (await this.checkFileExists(fileUri)) {
      return this.removeFilePrefix(fileUri);
    }
    await this.createDirectoryIfNoExists();

    // Handle local asset files in release mode
    if (!uri.includes('://')) {
      const asset = Asset.fromModule(source);
      const fileUriWithType = `${fileUri}.${asset.type}`;
      await asset.downloadAsync();
      if (!asset.localUri) {
        throw new Error(`Asset local URI is not available for ${source}`);
      }
      await moveAsync({ from: asset.localUri, to: fileUriWithType });
      return this.removeFilePrefix(fileUriWithType);
    }

    // Handle remote file download
    if (this.singleDownloads.has(source)) {
      throw new Error('Already downloading this file.');
    }
    const cacheFileUri = `${cacheDirectory}${filename}`;
    const downloadResumable = createDownloadResumable(
      uri,
      cacheFileUri,
      { sessionType: FileSystemSessionType.BACKGROUND },
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        callback(totalBytesWritten / totalBytesExpectedToWrite);
      }
    );
    const downloadResource: DownloadResource = {
      downloadResumable: downloadResumable,
      status: DownloadStatus.ONGOING,
      uri: uri,
      fileUri: fileUri,
      cacheFileUri: cacheFileUri,
    };
    this.singleDownloads.set(source, downloadResource);
    const result = await downloadResumable.downloadAsync();
    if (
      !this.singleDownloads.has(source) ||
      this.singleDownloads.get(source)!.status === DownloadStatus.PAUSED
    ) {
      // if canceled or paused during the download
      return null;
    }
    if (!result || result.status !== 200) {
      throw new Error(`Failed to fetch resource from '${uri}'`);
    }
    await moveAsync({ from: cacheFileUri, to: fileUri });
    this.singleDownloads.delete(source);

    this.triggerHuggingFaceDownloadCounter(uri);

    return this.removeFilePrefix(fileUri);
  }

  static async fetchMultipleResources(
    callback: (downloadProgress: number) => void = () => {},
    ...sources: ResourceSource[]
  ) {
    const paths = [];

    for (let idx = 0; idx < sources.length; idx++) {
      paths.push(
        (await this.fetch(
          sources[idx]!,
          this.calculateDownloadProgress(sources.length, idx, callback)
        ))!
      );
    }

    return paths;
  }

  static async deleteMultipleResources(...sources: ResourceSource[]) {
    for (const source of sources) {
      const filename = this.getFilenameFromUri(source as string);
      const fileUri = `${RNEDirectory}${filename}`;
      if (await this.checkFileExists(fileUri)) {
        await deleteAsync(fileUri);
      }
    }
  }

  static async pauseFetching(source: ResourceSource) {
    if (!this.singleDownloads.has(source)) {
      throw new Error(
        "Can't pause the download of this file. The download either has finished, was cancelled or has never been started"
      );
    }
    const resource = this.singleDownloads.get(source)!;
    switch (resource.status) {
      case DownloadStatus.PAUSED:
        throw new Error(
          "The file download is currently paused. Can't pause the download of the same file twice."
        );
      default: {
        resource.status = DownloadStatus.PAUSED;
        await resource.downloadResumable.pauseAsync();
      }
    }
  }

  static async resumeFetching(source: ResourceSource) {
    if (!this.singleDownloads.has(source)) {
      throw new Error(
        "Can't resume the download of this file. The download either has finished, was cancelled or has never been started"
      );
    }
    const resource = this.singleDownloads.get(source)!;
    switch (resource.status) {
      case DownloadStatus.ONGOING:
        throw new Error(
          "The file download is currently ongoing. Can't resume the ongoing download."
        );
      default: {
        resource.status = DownloadStatus.ONGOING;
        const result = await resource.downloadResumable.resumeAsync();
        if (
          !this.singleDownloads.has(source) ||
          this.singleDownloads.get(source)!.status === DownloadStatus.PAUSED
        ) {
          //if canceled or paused after earlier resuming.
          return null;
        }
        if (!result || (result.status !== 200 && result.status !== 206)) {
          //206 error code means "partial content" - expected after resuming.
          throw new Error(`Failed to fetch resource from '${resource.uri}'`);
        }
        await moveAsync({ from: resource.cacheFileUri, to: resource.fileUri });
        this.singleDownloads.delete(source);
        this.triggerHuggingFaceDownloadCounter(resource.uri);

        return this.removeFilePrefix(resource.fileUri);
      }
    }
  }

  static async cancelFetching(source: ResourceSource) {
    if (!this.singleDownloads.has(source)) {
      throw new Error(
        "Can't resume the download of this file. The download either has finished, was cancelled or has never been started"
      );
    }
    const resource = this.singleDownloads.get(source)!;
    await resource.downloadResumable.cancelAsync();
    this.singleDownloads.delete(source);
  }

  private static calculateDownloadProgress(
    numberOfFiles: number,
    currentFileIndex: number,
    setProgress: (downloadProgress: number) => void
  ) {
    return (progress: number) => {
      if (progress === 1 && currentFileIndex === numberOfFiles - 1) {
        setProgress(1);
        return;
      }
      const contributionPerFile = 1 / numberOfFiles;
      const baseProgress = contributionPerFile * currentFileIndex;
      const scaledProgress = progress * contributionPerFile;
      const updatedProgress = baseProgress + scaledProgress;
      setProgress(updatedProgress);
    };
  }

  static async listDownloadedFiles() {
    const files = await readDirectoryAsync(RNEDirectory);
    return files.map((file) => `${RNEDirectory}${file}`);
  }

  static async listDownloadedModels() {
    const files = await this.listDownloadedFiles();
    return files.filter((file) => file.endsWith('.pte'));
  }

  private static async handleObject(source: object) {
    const jsonString = JSON.stringify(source);
    const digest = this.hashObject(jsonString);
    const filename = `${digest}.json`;
    const path = `${RNEDirectory}${filename}`;

    if (await this.checkFileExists(path)) {
      return this.removeFilePrefix(path);
    }

    await this.createDirectoryIfNoExists();
    await writeAsStringAsync(path, jsonString, {
      encoding: EncodingType.UTF8,
    });

    return this.removeFilePrefix(path);
  }

  private static getFilenameFromUri(uri: string) {
    let cleanUri = uri.replace(/^https?:\/\//, '');
    cleanUri = cleanUri.split('#')?.[0] ?? cleanUri;
    return cleanUri.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private static removeFilePrefix(uri: string) {
    return uri.startsWith('file://') ? uri.slice(7) : uri;
  }

  private static hashObject(jsonString: string) {
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      // eslint-disable-next-line no-bitwise
      hash = (hash << 5) - hash + jsonString.charCodeAt(i);
      // eslint-disable-next-line no-bitwise
      hash |= 0;
    }
    // eslint-disable-next-line no-bitwise
    return (hash >>> 0).toString();
  }

  /*
   * Increments the Hugging Face download counter if the URI points to a Software Mansion Hugging Face repo.
   * More information: https://huggingface.co/docs/hub/models-download-stats
   */
  private static triggerHuggingFaceDownloadCounter(uri: string) {
    const url = new URL(uri);
    if (
      url.host === 'huggingface.co' &&
      url.pathname.startsWith('/software-mansion/')
    ) {
      const baseUrl = `${url.protocol}//${url.host}${url.pathname.split('resolve')[0]}`;
      fetch(`${baseUrl}resolve/main/config.json`, { method: 'HEAD' });
    }
  }

  private static async createDirectoryIfNoExists() {
    if (!(await this.checkFileExists(RNEDirectory))) {
      await makeDirectoryAsync(RNEDirectory, { intermediates: true });
    }
  }

  private static async checkFileExists(fileUri: string) {
    const fileInfo = await getInfoAsync(fileUri);
    return fileInfo.exists;
  }
}
