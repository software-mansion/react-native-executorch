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
} from 'expo-file-system';
import { Asset } from 'expo-asset';
import { RNEDirectory } from '../constants/directories';
import { ResourceSource } from '../types/common';

export class ResourceFetcher {
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
    const cacheFileUri = `${cacheDirectory}${filename}`;
    const downloadResumable = createDownloadResumable(
      uri,
      cacheFileUri,
      { sessionType: FileSystemSessionType.BACKGROUND },
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        callback(totalBytesWritten / totalBytesExpectedToWrite);
      }
    );
    const result = await downloadResumable.downloadAsync();
    if (!result || result.status !== 200) {
      throw new Error(`Failed to fetch resource from '${uri}'`);
    }
    await moveAsync({ from: cacheFileUri, to: fileUri });

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
        await this.fetch(
          sources[idx]!,
          this.calculateDownloadProgress(sources.length, idx, callback)
        )
      );
    }

    return paths;
  }

  static async deleteMultipleResources(...sources: ResourceSource[]) {
    for (const source of sources) {
      const filename = this.getFilenameFromUri(source as string);
      const fileUri = `${RNEDirectory}${filename}`;
      console.log('removing', fileUri);
      if (await this.checkFileExists(fileUri)) {
        await deleteAsync(fileUri);
      }
    }
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
    cleanUri = cleanUri.split('?')?.[0]?.split('#')?.[0] ?? cleanUri;
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
