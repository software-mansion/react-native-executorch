import { File, Paths, type DownloadTask } from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import {
  ResourceSource,
  RnExecutorchErrorCode,
  RnExecutorchError,
} from 'react-native-executorch';
import { RNEDirectory } from './constants/directories';
import { ResourceFetcherUtils, DownloadStatus } from './ResourceFetcherUtils';

export interface ActiveDownload {
  downloadTask: DownloadTask;
  status: DownloadStatus;
  uri: string;
  fileUri: string;
  cacheFileUri: string;
  // resolve and reject are the resolve/reject of the Promise returned by handleRemote.
  // They are stored here so that cancel() and resume() in the fetcher class can
  // unblock the fetch() loop from outside the download flow.
  resolve: (path: string) => void;
  reject: (error: unknown) => void;
}

export async function handleObject(source: object): Promise<string> {
  const jsonString = JSON.stringify(source);
  const digest = ResourceFetcherUtils.hashObject(jsonString);
  const path = `${RNEDirectory}${digest}.json`;

  const file = new File(path);
  if (file.exists) {
    return ResourceFetcherUtils.removeFilePrefix(path);
  }

  await ResourceFetcherUtils.createDirectoryIfNoExists();
  file.create();
  file.write(jsonString, { encoding: 'utf8' });
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
    return (await handleRemote(uri, source, progressCallback, downloads)).path;
  }

  // Release mode: asset bundled locally, copy to RNEDirectory
  const filename = ResourceFetcherUtils.getFilenameFromUri(uri);
  const fileUri = `${RNEDirectory}${filename}`;
  // On Android, the bundled URI has no extension, so we append it manually
  const fileUriWithType =
    Platform.OS === 'android' ? `${fileUri}.${asset.type}` : fileUri;

  if (new File(fileUri).exists) {
    return ResourceFetcherUtils.removeFilePrefix(fileUri);
  }

  await ResourceFetcherUtils.createDirectoryIfNoExists();
  await new File(uri).copy(new File(fileUriWithType));
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
): Promise<{ path: string; wasDownloaded: boolean }> {
  if (downloads.has(source)) {
    throw new RnExecutorchError(
      RnExecutorchErrorCode.ResourceFetcherDownloadInProgress,
      'Already downloading this file'
    );
  }

  const filename = ResourceFetcherUtils.getFilenameFromUri(uri);
  const fileUri = `${RNEDirectory}${filename}`;
  const cacheFileUri = `${Paths.cache.uri}${filename}`;

  if (new File(fileUri).exists) {
    return {
      path: ResourceFetcherUtils.removeFilePrefix(fileUri),
      wasDownloaded: false,
    };
  }

  await ResourceFetcherUtils.createDirectoryIfNoExists();

  // We need a Promise whose resolution can be triggered from outside this function —
  // by cancel() or resume() in the fetcher class. A plain async function can't do that,
  // so we create the Promise manually and store resolve/reject in the downloads map.
  let resolve: (path: string) => void = () => {};
  let reject: (error: unknown) => void = () => {};
  const promise = new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const cacheFile = new File(cacheFileUri);
  const downloadTask = File.createDownloadTask(uri, cacheFile, {
    sessionType: 'background',
  });
  downloadTask.addListener('progress', ({ bytesWritten, totalBytes }) => {
    if (totalBytes === -1) {
      progressCallback(0);
    } else {
      progressCallback(bytesWritten / totalBytes);
    }
  });

  downloads.set(source, {
    downloadTask,
    status: DownloadStatus.ONGOING,
    uri,
    fileUri,
    cacheFileUri,
    resolve,
    reject,
  });

  downloadTask
    .downloadAsync()
    .then(async (downloadedFile) => {
      // null means the task was paused before completion — resume() will continue it.
      if (!downloadedFile) return;

      // missing handle means the task was canceled — cancel() already rejected.
      const downloadHandle = downloads.get(source);
      if (!downloadHandle) return;

      try {
        await downloadedFile.move(new File(fileUri));
      } catch (error) {
        downloads.delete(source);
        reject(error);
        return;
      }

      downloads.delete(source);
      resolve(ResourceFetcherUtils.removeFilePrefix(fileUri));
    })
    .catch((error) => {
      // If paused, the rejection is expected — cancel/resume will resolve later.
      const downloadHandle = downloads.get(source);
      if (downloadHandle?.status === DownloadStatus.PAUSED) return;
      downloads.delete(source);
      reject(
        new RnExecutorchError(
          RnExecutorchErrorCode.ResourceFetcherDownloadFailed,
          `Failed to fetch resource from '${uri}'`,
          error
        )
      );
    });

  return promise.then((path) => ({ path, wasDownloaded: true }));
}
