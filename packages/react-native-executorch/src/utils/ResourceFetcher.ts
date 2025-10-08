/**
 * Resource Fetcher
 *
 * Provides an interface for downloading files (via `ResourceFetcher.fetch()`)
 *
 * Key functionality:
 * - Download control: pause, resume, and cancel operations through:
 *   - Single file: `.pauseFetching()`, `.resumeFetching()`, `.cancelFetching()`
 * - Downloaded file management:
 *   -  `.getFilesTotalSize()`, `.listDownloadedFiles()`, `.listDownloadedModels()`, `.deleteResources()`
 *
 * Remark: The pausing/resuming/canceling works only for fetching remote resources.
 *
 * Most exported functions accept:
 * - Multiple `ResourceSource` arguments, (union type of string, number or object)
 *
 * Method `.fetch()` takes argument as callback that reports download progress.
 * Method`.fetch()` returns array of paths to successfully saved files or null if the download was paused or cancelled  (then resume functions can return paths).
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
  copyAsync,
  createDownloadResumable,
  moveAsync,
  FileSystemSessionType,
  writeAsStringAsync,
  EncodingType,
  deleteAsync,
  readDirectoryAsync,
} from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import { RNEDirectory } from '../constants/directories';
import { ResourceSource } from '../types/common';
import {
  ResourceFetcherUtils,
  HTTP_CODE,
  DownloadStatus,
  SourceType,
  ResourceSourceExtended,
  DownloadResource,
} from './ResourceFetcherUtils';

export class ResourceFetcher {
  static downloads = new Map<ResourceSource, DownloadResource>(); //map of currently downloading (or paused) files, if the download was started by .fetch() method.

  static async fetch(
    callback: (downloadProgress: number) => void = () => {},
    ...sources: ResourceSource[]
  ) {
    if (sources.length === 0) {
      throw new Error('Empty list given as an argument!');
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
  }

  private static async singleFetch(
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
      return this.singleFetch(nextSource);
    }
    sourceExtended.callback!(1);
    return sourceExtended.results;
  }

  private static async pause(source: ResourceSource) {
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

  private static async resume(source: ResourceSource) {
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
        if (
          !result ||
          (result.status !== HTTP_CODE.OK &&
            result.status !== HTTP_CODE.PARTIAL_CONTENT)
        ) {
          throw new Error(
            `Failed to fetch resource from '${resource.extendedInfo.uri}'`
          );
        }
        await moveAsync({
          from: resource.extendedInfo.cacheFileUri,
          to: resource.extendedInfo.fileUri,
        });
        this.downloads.delete(source);
        ResourceFetcherUtils.triggerHuggingFaceDownloadCounter(
          resource.extendedInfo.uri
        );

        return this.returnOrStartNext(
          resource.extendedInfo,
          ResourceFetcherUtils.removeFilePrefix(resource.extendedInfo.fileUri)
        );
      }
    }
  }

  private static async cancel(source: ResourceSource) {
    const resource = this.downloads.get(source)!;
    await resource.downloadResumable.cancelAsync();
    this.downloads.delete(source);
  }

  static async pauseFetching(...sources: ResourceSource[]) {
    const source = this.findActive(sources);
    await this.pause(source);
  }

  static async resumeFetching(...sources: ResourceSource[]) {
    const source = this.findActive(sources);
    await this.resume(source);
  }

  static async cancelFetching(...sources: ResourceSource[]) {
    const source = this.findActive(sources);
    await this.cancel(source);
  }

  private static findActive(sources: ResourceSource[]) {
    for (const source of sources) {
      if (this.downloads.has(source)) {
        return source;
      }
    }
    throw new Error(
      'None of given sources are currently during downloading process.'
    );
  }

  static async listDownloadedFiles() {
    const files = await readDirectoryAsync(RNEDirectory);
    return files.map((file) => `${RNEDirectory}${file}`);
  }

  static async listDownloadedModels() {
    const files = await this.listDownloadedFiles();
    return files.filter((file) => file.endsWith('.pte'));
  }

  static async deleteResources(...sources: ResourceSource[]) {
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

  static async getFilesTotalSize(...sources: ResourceSource[]) {
    return (await ResourceFetcherUtils.getFilesSizes(sources)).totalLength;
  }

  private static async handleObject(source: ResourceSource) {
    if (typeof source !== 'object') {
      throw new Error('Source is expected to be object!');
    }
    const jsonString = JSON.stringify(source);
    const digest = ResourceFetcherUtils.hashObject(jsonString);
    const filename = `${digest}.json`;
    const path = `${RNEDirectory}${filename}`;

    if (await ResourceFetcherUtils.checkFileExists(path)) {
      return ResourceFetcherUtils.removeFilePrefix(path);
    }

    await ResourceFetcherUtils.createDirectoryIfNoExists();
    await writeAsStringAsync(path, jsonString, {
      encoding: EncodingType.UTF8,
    });

    return ResourceFetcherUtils.removeFilePrefix(path);
  }

  private static handleLocalFile(source: ResourceSource) {
    if (typeof source !== 'string') {
      throw new Error('Source is expected to be string.');
    }
    return ResourceFetcherUtils.removeFilePrefix(source);
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
    const filename = ResourceFetcherUtils.getFilenameFromUri(uri);
    const fileUri = `${RNEDirectory}${filename}`;
    // On Android, file uri does not contain file extension, so we add it manually
    const fileUriWithType =
      Platform.OS === 'android' ? `${fileUri}.${asset.type}` : fileUri;
    if (await ResourceFetcherUtils.checkFileExists(fileUri)) {
      return ResourceFetcherUtils.removeFilePrefix(fileUri);
    }
    await ResourceFetcherUtils.createDirectoryIfNoExists();
    await copyAsync({
      from: asset.uri,
      to: fileUriWithType,
    });
    return ResourceFetcherUtils.removeFilePrefix(fileUriWithType);
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
      const resource = this.downloads.get(source)!;
      if (resource.status === DownloadStatus.PAUSED) {
        // if the download is paused, `fetch` is treated like `resume`
        this.resume(source);
      }
      // if the download is ongoing, throw error.
      throw new Error('Already downloading this file.');
    }
    if (typeof source === 'number' && !sourceExtended.uri) {
      throw new Error('Source Uri is expected to be available here.');
    }
    if (typeof source === 'string') {
      sourceExtended.uri = source;
    }
    const uri = sourceExtended.uri!;
    const filename = ResourceFetcherUtils.getFilenameFromUri(uri);
    sourceExtended.fileUri = `${RNEDirectory}${filename}`;
    sourceExtended.cacheFileUri = `${cacheDirectory}${filename}`;

    if (await ResourceFetcherUtils.checkFileExists(sourceExtended.fileUri)) {
      return ResourceFetcherUtils.removeFilePrefix(sourceExtended.fileUri);
    }
    await ResourceFetcherUtils.createDirectoryIfNoExists();

    const downloadResumable = createDownloadResumable(
      uri,
      sourceExtended.cacheFileUri,
      { sessionType: FileSystemSessionType.BACKGROUND },
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        if (totalBytesExpectedToWrite === -1) {
          // If totalBytesExpectedToWrite is -1, it means the server does not provide content length.
          sourceExtended.callback!(0);
          return;
        }
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
    if (!result || result.status !== HTTP_CODE.OK) {
      throw new Error(`Failed to fetch resource from '${source}'`);
    }
    await moveAsync({
      from: sourceExtended.cacheFileUri,
      to: sourceExtended.fileUri,
    });
    this.downloads.delete(source);
    ResourceFetcherUtils.triggerHuggingFaceDownloadCounter(uri);
    return ResourceFetcherUtils.removeFilePrefix(sourceExtended.fileUri);
  }
}
