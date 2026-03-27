import {
  cacheDirectory,
  copyAsync,
  createDownloadResumable,
  moveAsync,
  FileSystemSessionType,
  writeAsStringAsync,
  EncodingType,
  type DownloadResumable,
} from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import {
  ResourceSource,
  RnExecutorchErrorCode,
  RnExecutorchError,
} from 'react-native-executorch';
import { RNEDirectory } from './constants/directories';
import {
  ResourceFetcherUtils,
  HTTP_CODE,
  DownloadStatus,
} from './ResourceFetcherUtils';

export interface ActiveDownload {
  downloadResumable: DownloadResumable;
  status: DownloadStatus;
  uri: string;
  fileUri: string;
  cacheFileUri: string;
  /** Resolves the pending Promise<string | null> inside the fetch() loop. */
  settle: (path: string | null) => void;
  /** Rejects the pending Promise inside the fetch() loop. */
  reject: (error: unknown) => void;
}

export async function handleObject(source: object): Promise<string> {
  const jsonString = JSON.stringify(source);
  const digest = ResourceFetcherUtils.hashObject(jsonString);
  const path = `${RNEDirectory}${digest}.json`;

  if (await ResourceFetcherUtils.checkFileExists(path)) {
    return ResourceFetcherUtils.removeFilePrefix(path);
  }

  await ResourceFetcherUtils.createDirectoryIfNoExists();
  await writeAsStringAsync(path, jsonString, { encoding: EncodingType.UTF8 });
  return ResourceFetcherUtils.removeFilePrefix(path);
}

export function handleLocalFile(source: string): string {
  return ResourceFetcherUtils.removeFilePrefix(source);
}

export async function handleAsset(
  source: number,
  progressCallback: (progress: number) => void,
  downloads: Map<ResourceSource, ActiveDownload>
): Promise<string | null> {
  const asset = Asset.fromModule(source);
  const uri = asset.uri;

  if (uri.startsWith('http')) {
    // Dev mode: asset served from Metro dev server
    return handleRemote(uri, source, progressCallback, downloads);
  }

  // Release mode: asset bundled locally, copy to RNEDirectory
  const filename = ResourceFetcherUtils.getFilenameFromUri(uri);
  const fileUri = `${RNEDirectory}${filename}`;
  // On Android, the bundled URI has no extension, so we append it manually
  const fileUriWithType =
    Platform.OS === 'android' ? `${fileUri}.${asset.type}` : fileUri;

  if (await ResourceFetcherUtils.checkFileExists(fileUri)) {
    return ResourceFetcherUtils.removeFilePrefix(fileUri);
  }

  await ResourceFetcherUtils.createDirectoryIfNoExists();
  await copyAsync({ from: uri, to: fileUriWithType });
  return ResourceFetcherUtils.removeFilePrefix(fileUriWithType);
}

export function handleRemote(
  uri: string,
  source: ResourceSource,
  progressCallback: (progress: number) => void,
  downloads: Map<ResourceSource, ActiveDownload>
): Promise<string | null> {
  if (downloads.has(source)) {
    throw new RnExecutorchError(
      RnExecutorchErrorCode.ResourceFetcherDownloadInProgress,
      'Already downloading this file'
    );
  }

  let settle!: (path: string | null) => void;
  let reject!: (error: unknown) => void;

  const promise = new Promise<string | null>((res, rej) => {
    settle = res;
    reject = rej;
  });

  void (async () => {
    const filename = ResourceFetcherUtils.getFilenameFromUri(uri);
    const fileUri = `${RNEDirectory}${filename}`;
    const cacheFileUri = `${cacheDirectory}${filename}`;

    try {
      if (await ResourceFetcherUtils.checkFileExists(fileUri)) {
        settle(ResourceFetcherUtils.removeFilePrefix(fileUri));
        return;
      }

      await ResourceFetcherUtils.createDirectoryIfNoExists();

      const downloadResumable = createDownloadResumable(
        uri,
        cacheFileUri,
        { sessionType: FileSystemSessionType.BACKGROUND },
        ({
          totalBytesWritten,
          totalBytesExpectedToWrite,
        }: {
          totalBytesWritten: number;
          totalBytesExpectedToWrite: number;
        }) => {
          if (totalBytesExpectedToWrite === -1) {
            progressCallback(0);
          } else {
            progressCallback(totalBytesWritten / totalBytesExpectedToWrite);
          }
        }
      );

      downloads.set(source, {
        downloadResumable,
        status: DownloadStatus.ONGOING,
        uri,
        fileUri,
        cacheFileUri,
        settle,
        reject,
      });

      const result = await downloadResumable.downloadAsync();
      const dl = downloads.get(source);
      // If paused or canceled during the download, settle/reject will be called
      // externally by resume() or cancel() — do nothing here.
      if (!dl || dl.status === DownloadStatus.PAUSED) return;

      if (
        !result ||
        (result.status !== HTTP_CODE.OK &&
          result.status !== HTTP_CODE.PARTIAL_CONTENT)
      ) {
        downloads.delete(source);
        reject(
          new RnExecutorchError(
            RnExecutorchErrorCode.ResourceFetcherDownloadFailed,
            `Failed to fetch resource from '${uri}', status: ${result?.status}`
          )
        );
        return;
      }

      await moveAsync({ from: cacheFileUri, to: fileUri });
      downloads.delete(source);
      ResourceFetcherUtils.triggerHuggingFaceDownloadCounter(uri);
      settle(ResourceFetcherUtils.removeFilePrefix(fileUri));
    } catch (error) {
      downloads.delete(source);
      reject(error);
    }
  })();

  return promise;
}
