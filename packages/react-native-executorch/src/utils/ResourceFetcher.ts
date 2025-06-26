/**
 * Resource Fetcher
 *
 * Provides an interface for downloading files either individually (via `ResourceFetcher.fetch()`)
 * or in batch operations (via `ResourceFetcher.fetchMultipleResources()`).
 *
 * Key functionality:
 * - Download control: pause, resume, and cancel operations through:
 *   - Single file: `.pauseFetching()`, `.resumeFetching()`, `.cancelFetching()`
 *   - Multiple files: `.pauseMultipleFetching()`, `.resumeMultipleFetching()`, `.cancelMultipleFetching()`
 * - Downloaded file management:
 *   - `.listDownloadedFiles()`, `.listDownloadedModels()`, `.deleteMultipleResources()`
 *
 * Remark: The pausing/resuming/canceling works only for fetching remote resources.
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

enum SourceType {
  OBJECT,
  LOCAL_FILE,
  RELEASE_MODE_FILE,
  DEV_MODE_FILE,
  REMOTE_FILE,
}

interface DownloadResource {
  downloadResumable: DownloadResumable;
  status: DownloadStatus;
  extendedInfo: ResourceSourceExtended;
}

interface ResourceSourceExtended {
  source: ResourceSource;
  sourceType: SourceType;
  callback?: (downloadProgress: number) => void;
  results: string[];
  uri?: string;
  fileUri?: string;
  cacheFileUri?: string;
  next?: ResourceSourceExtended;
}

export class ResourceFetcher {
  static downloads = new Map<ResourceSource, DownloadResource>(); //map of currently downloading (or paused) files, if the download was started by .fetch() method.

  static async fetch(
    source: ResourceSource,
    callback: (downloadProgress: number) => void = () => {}
  ) {
    const sourceType = await this.getType(source);
    const result = await this.fetchInternal({
      source,
      sourceType,
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
    const { results: info, totalLength } = await this.getFilesSizes(...sources);

    const head: ResourceSourceExtended = {
      source: info[0]!.source,
      sourceType: info[0]!.type,
      callback:
        info[0]!.type === SourceType.REMOTE_FILE
          ? this.calculateDownloadProgress(
              totalLength,
              info[0]!.previousFilesTotalLength,
              info[0]!.length,
              callback
            )
          : () => {},
      results: [],
    };

    var node = head;
    for (let idx = 1; idx < sources.length; idx++) {
      node.next = {
        source: info[idx]!.source,
        sourceType: info[idx]!.type,
        callback:
          info[idx]!.type === SourceType.REMOTE_FILE
            ? this.calculateDownloadProgress(
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
    if (
      !resource.extendedInfo.fileUri ||
      !resource.extendedInfo.cacheFileUri ||
      !resource.extendedInfo.uri
    ) {
      throw new Error('Something went wrong. File uri info is not specified!');
    }
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
          throw new Error(
            `Failed to fetch resource from '${resource.extendedInfo.uri}'`
          );
        }
        await moveAsync({
          from: resource.extendedInfo.cacheFileUri,
          to: resource.extendedInfo.fileUri,
        });
        this.downloads.delete(source);
        this.triggerHuggingFaceDownloadCounter(resource.extendedInfo.uri);

        return this.returnOrStartNext(
          resource.extendedInfo,
          this.removeFilePrefix(resource.extendedInfo.fileUri)
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
    totalLength: number,
    previousFilesTotalLength: number,
    currentFileLength: number,
    setProgress: (downloadProgress: number) => void
  ) {
    return (progress: number) => {
      if (
        progress === 1 &&
        previousFilesTotalLength === totalLength - currentFileLength
      ) {
        setProgress(1);
        return;
      }
      const baseProgress = previousFilesTotalLength / totalLength;
      const scaledProgress = progress * (currentFileLength / totalLength);
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

  private static getType(source: ResourceSource): SourceType {
    if (typeof source === 'object') {
      return SourceType.OBJECT;
    } else if (typeof source === 'number') {
      const uri = Asset.fromModule(source).uri;
      if (!uri.includes('://')) {
        return SourceType.RELEASE_MODE_FILE;
      }
      return SourceType.DEV_MODE_FILE;
    } else {
      // typeof source == 'string'
      if (source.startsWith('file:://')) {
        return SourceType.LOCAL_FILE;
      }
      return SourceType.REMOTE_FILE;
    }
  }

  private static async handleObject(source: ResourceSource) {
    if (typeof source !== 'object') {
      throw new Error('Source is expected to be object!');
    }
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

  private static handleLocalFile(source: ResourceSource) {
    if (typeof source !== 'string') {
      throw new Error('Source is expected to be string.');
    }
    return this.removeFilePrefix(source);
  }

  private static async handleReleaseModeFile(
    sourceExtended: ResourceSourceExtended
  ) {
    const source = sourceExtended.source;
    if (typeof source !== 'number') {
      throw new Error('Source is expected to be string.');
    }
    const asset = Asset.fromModule(source);
    const uri = asset.uri;
    const filename = this.getFilenameFromUri(uri);
    const fileUri = `${RNEDirectory}${filename}`;
    const fileUriWithType = `${fileUri}.${asset.type}`;
    if (await this.checkFileExists(fileUri)) {
      return this.removeFilePrefix(fileUri);
    }
    await this.createDirectoryIfNoExists();
    await asset.downloadAsync();
    if (!asset.localUri) {
      throw new Error(`Asset local URI is not available for ${source}`);
    }
    await moveAsync({ from: asset.localUri, to: fileUriWithType });
    return this.removeFilePrefix(fileUriWithType);
  }

  private static async handleDevModeFile(
    sourceExtended: ResourceSourceExtended
  ) {
    const source = sourceExtended.source;
    if (typeof source !== 'number') {
      throw new Error('Source is expected to be a number.');
    }
    sourceExtended.uri = Asset.fromModule(source).uri;
    return await this.handleRemoteFile(sourceExtended);
  }

  private static async handleRemoteFile(
    sourceExtended: ResourceSourceExtended
  ) {
    const source = sourceExtended.source;
    if (typeof source === 'object') {
      throw new Error('Source is expected to be a string or a number.');
    }
    if (this.downloads.has(source)) {
      throw new Error('Already downloading this file.');
    }
    if (typeof source === 'number' && !sourceExtended.uri) {
      throw new Error('Source Uri is expected to be available here.');
    }
    if (typeof source === 'string') {
      sourceExtended.uri = source;
    }
    const uri = sourceExtended.uri!;
    const filename = this.getFilenameFromUri(uri);
    sourceExtended.fileUri = `${RNEDirectory}${filename}`;
    sourceExtended.cacheFileUri = `${cacheDirectory}${filename}`;

    if (await this.checkFileExists(sourceExtended.fileUri)) {
      return this.removeFilePrefix(sourceExtended.fileUri);
    }

    const downloadResumable = createDownloadResumable(
      uri,
      sourceExtended.cacheFileUri,
      { sessionType: FileSystemSessionType.BACKGROUND },
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        sourceExtended.callback!(totalBytesWritten / totalBytesExpectedToWrite);
      }
    );
    //create value for the this.download Map
    const downloadResource: DownloadResource = {
      downloadResumable: downloadResumable,
      status: DownloadStatus.ONGOING,
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
      throw new Error(`Failed to fetch resource from '${source}'`);
    }
    await moveAsync({
      from: sourceExtended.cacheFileUri,
      to: sourceExtended.fileUri,
    });
    this.downloads.delete(source);
    this.triggerHuggingFaceDownloadCounter(uri);
    return this.removeFilePrefix(sourceExtended.fileUri);
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

  private static async getFilesSizes(...sources: ResourceSource[]) {
    const results: Array<{
      source: ResourceSource;
      type: SourceType;
      length: number;
      previousFilesTotalLength: number;
    }> = [];
    let totalLength = 0;
    let previousFilesTotalLength = 0;
    for (const source of sources) {
      const type = await this.getType(source);
      let length = 0;

      if (type === SourceType.REMOTE_FILE && typeof source === 'string') {
        try {
          const response = await fetch(source, { method: 'HEAD' });
          if (!response.ok) {
            console.warn(
              `Failed to fetch HEAD for ${source}: ${response.status}`
            );
            continue;
          }

          const contentLength = response.headers.get('content-length');
          length = contentLength ? parseInt(contentLength, 10) : 0;
          previousFilesTotalLength = totalLength;
          totalLength += length;
        } catch (error) {
          console.warn(`Error fetching HEAD for ${source}:`, error);
          continue;
        }
      }
      results.push({ source, type, length, previousFilesTotalLength });
    }

    return { results, totalLength };
  }
}
