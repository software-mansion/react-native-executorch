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
  // settle and reject are the resolve/reject of the Promise returned by handleRemote.
  // They are stored here so that cancel() and resume() in the fetcher class can
  // unblock the fetch() loop from outside the download flow.
  settle: (path: string) => void;
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
): Promise<string> {
  const asset = Asset.fromModule(source);
  const uri = asset.uri;

  if (uri.startsWith('http')) {
    // Dev mode: asset served from Metro dev server.
    // uri is the resolved HTTP URL; source is the original require() number the
    // user holds, so it must be used as the downloads map key for pause/cancel to work.
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

// uri and source are separate parameters because for asset sources (dev mode),
// source is the require() number the user holds (used as the downloads map key),
// while uri is the resolved HTTP URL needed for the actual download.
// For plain remote strings they are the same value.
export async function handleRemote(
  uri: string,
  source: ResourceSource,
  progressCallback: (progress: number) => void,
  downloads: Map<ResourceSource, ActiveDownload>
): Promise<string> {
  if (downloads.has(source)) {
    throw new RnExecutorchError(
      RnExecutorchErrorCode.ResourceFetcherDownloadInProgress,
      'Already downloading this file'
    );
  }

  const filename = ResourceFetcherUtils.getFilenameFromUri(uri);
  const fileUri = `${RNEDirectory}${filename}`;
  const cacheFileUri = `${cacheDirectory}${filename}`;

  if (await ResourceFetcherUtils.checkFileExists(fileUri)) {
    return ResourceFetcherUtils.removeFilePrefix(fileUri);
  }

  await ResourceFetcherUtils.createDirectoryIfNoExists();

  // We need a Promise whose resolution can be triggered from outside this function —
  // by cancel() or resume() in the fetcher class. A plain async function can't do that,
  // so we create the Promise manually and store settle/reject in the downloads map.
  let settle: (path: string) => void = () => {};
  let reject: (error: unknown) => void = () => {};
  const promise = new Promise<string>((res, rej) => {
    settle = res;
    reject = rej;
  });

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

  downloadResumable
    .downloadAsync()
    .then(async (result) => {
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

      try {
        await moveAsync({ from: cacheFileUri, to: fileUri });
      } catch (error) {
        downloads.delete(source);
        reject(error);
        return;
      }

      downloads.delete(source);
      ResourceFetcherUtils.triggerHuggingFaceDownloadCounter(uri);
      settle(ResourceFetcherUtils.removeFilePrefix(fileUri));
    })
    .catch((error) => {
      downloads.delete(source);
      reject(error);
    });

  return promise;
}
