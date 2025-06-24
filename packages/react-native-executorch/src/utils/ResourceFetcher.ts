/**
 * Resource Fetcher
 *
 * Provides an interface for downloading files either individually (via `ResourceFetcher.fetch()`)
 * or in batch operations (via `ResourceFetcher.fetchMultipleResources()`).
 *
 * Key functionality includes:
 * - Download control: pause, resume, and cancel operations through:
 *   - Single file: `.pauseFetching()`, `.resumeFetching()`, `.cancelFetching()`
 *   - Multiple files: `.pauseMultipleFetching()`, `.resumeMultipleFetching()`, `.cancelMultipleFetching()`
 * - Downloaded file management:
 *   - `.listDownloadedFiles()`, `.listDownloadedModels()`, `.deleteMultipleResources()`
 *
 * Most exported functions accept either:
 * - A single argument of type `ResourceSource` (union type of string, number, or object)
 * - Multiple `ResourceSource` arguments
 *
 * Methods `.fetch()` and `fetchMultipleResources()` take optional argument as callback thar reports download progress.
 * Methods `.fetch()` and `fetchMultipleResources()` return path or paths to successfully saved files or null if the download was paused or cancelled  (then resume functions can return paths).
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
  extendedInfo: ResourceSourceExtended;
}

interface ResourceSourceExtended {
  source: ResourceSource;
  callback: (downloadProgress: number) => void;
  results: string[];
  next?: ResourceSourceExtended;
}

export class ResourceFetcher {
  static downloads = new Map<ResourceSource, DownloadResource>(); //map of currently downloading (or paused) files, if the download was started by .fetch() method.

  static async fetch(
    source: ResourceSource,
    callback: (downloadProgress: number) => void = () => {}
  ) {
    const result = await this.fetchInternal({
      source,
      callback,
      results: [],
    });
    if (result !== null) {
      return result[0] ?? null;
    }
    return null;
  }

  private static async fetchInternal(
    sourceExtended: ResourceSourceExtended
  ): Promise<string[] | null> {
    const source = sourceExtended.source;
    if (typeof source === 'object') {
      return this.returnOrStartNext(
        sourceExtended,
        await this.handleObject(source)
      );
    }

    const uri =
      typeof source === 'number' ? Asset.fromModule(source).uri : source;

    // Handle local files
    if (uri.startsWith('file://')) {
      return this.returnOrStartNext(sourceExtended, this.removeFilePrefix(uri));
    }

    const filename = this.getFilenameFromUri(uri);
    const fileUri = `${RNEDirectory}${filename}`;

    if (await this.checkFileExists(fileUri)) {
      return this.returnOrStartNext(
        sourceExtended,
        this.removeFilePrefix(fileUri)
      );
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
      return this.returnOrStartNext(
        sourceExtended,
        this.removeFilePrefix(fileUriWithType)
      );
    }

    // Handle remote file download
    if (this.downloads.has(source)) {
      throw new Error('Already downloading this file.');
    }
    const cacheFileUri = `${cacheDirectory}${filename}`;
    const downloadResumable = createDownloadResumable(
      uri,
      cacheFileUri,
      { sessionType: FileSystemSessionType.BACKGROUND },
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        sourceExtended.callback(totalBytesWritten / totalBytesExpectedToWrite);
      }
    );
    //create value for the this.download Map
    const downloadResource: DownloadResource = {
      downloadResumable: downloadResumable,
      status: DownloadStatus.ONGOING,
      uri: uri,
      fileUri: fileUri,
      cacheFileUri: cacheFileUri,
      extendedInfo: sourceExtended,
    };
    //add key-value pair to map
    this.downloads.set(source, downloadResource);
    const result = await downloadResumable.downloadAsync();
    if (
      !this.downloads.has(source) ||
      this.downloads.get(source)!.status === DownloadStatus.PAUSED
    ) {
      // if canceled or paused during the download
      return null;
    }
    if (!result || result.status !== 200) {
      throw new Error(`Failed to fetch resource from '${uri}'`);
    }
    await moveAsync({ from: cacheFileUri, to: fileUri });
    this.downloads.delete(source);
    this.triggerHuggingFaceDownloadCounter(uri);
    return this.returnOrStartNext(
      sourceExtended,
      this.removeFilePrefix(fileUri)
    );
  }

  //if any download ends successfully this function is called - it checks whether it should trigger next download or return list of paths.
  private static returnOrStartNext(
    sourceExtended: ResourceSourceExtended,
    result: string
  ) {
    sourceExtended.results.push(result);

    if (sourceExtended.next) {
      const nextSource = sourceExtended.next;
      nextSource.results.push(...sourceExtended.results);
      return this.fetchInternal(nextSource);
    }
    return sourceExtended.results;
  }

  static async fetchMultipleResources(
    callback: (downloadProgress: number) => void = () => {},
    ...sources: ResourceSource[]
  ) {
    if (sources.length === 0) {
      throw new Error('Empty list given as an argument!');
    }

    const head: ResourceSourceExtended = {
      source: sources[0]!,
      callback: this.calculateDownloadProgress(sources.length, 0, callback),
      results: [],
    };

    var node = head;
    for (let idx = 1; idx < sources.length; idx++) {
      node.next = {
        source: sources[idx]!,
        callback: this.calculateDownloadProgress(sources.length, idx, callback),
        results: [],
      };
      node = node.next;
    }
    return this.fetchInternal(head);
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
    if (!this.downloads.has(source)) {
      throw new Error(
        "Can't pause the download of this file. The download either has finished, was cancelled or has never been started"
      );
    }
    const resource = this.downloads.get(source)!;
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
    if (!this.downloads.has(source)) {
      throw new Error(
        "Can't resume the download of this file. The download either has finished, was cancelled or has never been started"
      );
    }
    const resource = this.downloads.get(source)!;
    switch (resource.status) {
      case DownloadStatus.ONGOING:
        throw new Error(
          "The file download is currently ongoing. Can't resume the ongoing download."
        );
      default: {
        resource.status = DownloadStatus.ONGOING;
        const result = await resource.downloadResumable.resumeAsync();
        if (
          !this.downloads.has(source) ||
          this.downloads.get(source)!.status === DownloadStatus.PAUSED
        ) {
          //if canceled or paused after earlier resuming.
          return null;
        }
        if (!result || (result.status !== 200 && result.status !== 206)) {
          //206 error code means "partial content" - expected after resuming.
          throw new Error(`Failed to fetch resource from '${resource.uri}'`);
        }
        await moveAsync({ from: resource.cacheFileUri, to: resource.fileUri });
        this.downloads.delete(source);
        this.triggerHuggingFaceDownloadCounter(resource.uri);

        return this.returnOrStartNext(
          resource.extendedInfo,
          this.removeFilePrefix(resource.fileUri)
        );
      }
    }
  }

  static async cancelFetching(source: ResourceSource) {
    if (!this.downloads.has(source)) {
      throw new Error(
        "Can't resume the download of this file. The download either has finished, was cancelled or has never been started"
      );
    }
    const resource = this.downloads.get(source)!;
    await resource.downloadResumable.cancelAsync();
    this.downloads.delete(source);
  }

  static async pauseMultipleFetching(...sources: ResourceSource[]) {
    const source = this.findActive(sources);
    if (source === null) {
      throw new Error(
        'None of given sources are currently during downloading process.'
      );
    }
    await this.pauseFetching(source);
  }

  static async resumeMultipleFetching(...sources: ResourceSource[]) {
    const source = this.findActive(sources);
    if (source === null) {
      throw new Error(
        'None of given sources are currently during downloading process.'
      );
    }
    await this.resumeFetching(source);
  }

  static async cancelMultipleFetching(...sources: ResourceSource[]) {
    const source = this.findActive(sources);
    if (source === null) {
      throw new Error(
        'None of given sources are currently during downloading process.'
      );
    }
    await this.cancelFetching(source);
  }

  private static findActive(sources: ResourceSource[]) {
    for (const source of sources) {
      if (this.downloads.has(source)) {
        return source;
      }
    }
    return null;
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
