import {
  createDownloadTask,
  completeHandler,
  DownloadTask,
  BeginHandlerParams,
  ProgressHandlerParams,
} from '@kesha-antonov/react-native-background-downloader';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { Image, Platform } from 'react-native';
import {
  ResourceSource,
  RnExecutorchErrorCode,
  RnExecutorchError,
} from 'react-native-executorch';
import { RNEDirectory } from './constants/directories';
import { ResourceFetcherUtils, DownloadStatus } from './ResourceFetcherUtils';

export interface ActiveDownload {
  status: DownloadStatus;
  uri: string;
  fileUri: string;
  cacheFileUri: string;
  // resolve and reject are the resolve/reject of the Promise returned by handleRemote.
  // They are stored here so that cancel() and resume() in the fetcher class can
  // unblock the fetch() loop from outside the download flow.
  resolve: (path: string) => void;
  reject: (error: unknown) => void;
  // iOS only: background downloader task, used for pause/resume/cancel
  task?: DownloadTask;
  // Android only: RNFS job ID, used for cancel via RNFS.stopDownload
  jobId?: number;
}

interface DownloadContext {
  uri: string;
  source: ResourceSource;
  fileUri: string;
  cacheFileUri: string;
  progressCallback: (progress: number) => void;
  downloads: Map<ResourceSource, ActiveDownload>;
  resolve: (path: string) => void;
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
  await RNFS.writeFile(path, jsonString, 'utf8');
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
  const assetSource = Image.resolveAssetSource(source);
  const uri = assetSource.uri;

  if (uri.startsWith('http')) {
    // Dev mode: asset served from Metro dev server.
    // uri is the resolved HTTP URL; source is the original require() number the
    // user holds, so it must be used as the downloads map key for pause/cancel to work.
    return (await handleRemote(uri, source, progressCallback, downloads)).path;
  }

  // Release mode: asset bundled locally, copy to RNEDirectory
  const filename = ResourceFetcherUtils.getFilenameFromUri(uri);
  const fileUri = `${RNEDirectory}${filename}`;

  if (await ResourceFetcherUtils.checkFileExists(fileUri)) {
    return ResourceFetcherUtils.removeFilePrefix(fileUri);
  }

  await ResourceFetcherUtils.createDirectoryIfNoExists();
  if (uri.startsWith('file')) {
    await RNFS.copyFile(uri, fileUri);
  }
  return ResourceFetcherUtils.removeFilePrefix(fileUri);
}

function startAndroidDownload(ctx: DownloadContext): void {
  const {
    uri,
    source,
    fileUri,
    cacheFileUri,
    progressCallback,
    downloads,
    resolve,
    reject,
  } = ctx;

  const rnfsDownload = RNFS.downloadFile({
    fromUrl: uri,
    toFile: cacheFileUri,
    progress: (res: { bytesWritten: number; contentLength: number }) => {
      if (res.contentLength > 0) {
        progressCallback(res.bytesWritten / res.contentLength);
      }
    },
    progressInterval: 500,
  });

  downloads.set(source, {
    status: DownloadStatus.ONGOING,
    uri,
    fileUri,
    cacheFileUri,
    resolve,
    reject,
    jobId: rnfsDownload.jobId,
  });

  rnfsDownload.promise
    .then(async (result: { statusCode: number }) => {
      if (!downloads.has(source)) return; // canceled externally via cancel()

      if (result.statusCode < 200 || result.statusCode >= 300) {
        downloads.delete(source);
        reject(
          new RnExecutorchError(
            RnExecutorchErrorCode.ResourceFetcherDownloadFailed,
            `Failed to fetch resource from '${uri}', status: ${result.statusCode}`
          )
        );
        return;
      }

      try {
        await RNFS.moveFile(cacheFileUri, fileUri);
      } catch (error) {
        downloads.delete(source);
        reject(error);
        return;
      }

      downloads.delete(source);
      resolve(ResourceFetcherUtils.removeFilePrefix(fileUri));
    })
    .catch((error: unknown) => {
      if (!downloads.has(source)) return; // canceled externally
      downloads.delete(source);
      reject(
        new RnExecutorchError(
          RnExecutorchErrorCode.ResourceFetcherDownloadFailed,
          `Failed to fetch resource from '${uri}', context: ${error}`
        )
      );
    });
}

function startIOSDownload(ctx: DownloadContext): void {
  const {
    uri,
    source,
    fileUri,
    cacheFileUri,
    progressCallback,
    downloads,
    resolve,
    reject,
  } = ctx;
  const filename = cacheFileUri.split('/').pop()!;

  const task = createDownloadTask({
    id: filename,
    url: uri,
    destination: cacheFileUri,
  })
    .begin((_: BeginHandlerParams) => progressCallback(0))
    .progress((progress: ProgressHandlerParams) => {
      progressCallback(progress.bytesDownloaded / progress.bytesTotal);
    })
    .done(async () => {
      const downloadHandle = downloads.get(source);
      // If paused or canceled, resolve/reject will be called externally — do nothing here.
      if (!downloadHandle || downloadHandle.status === DownloadStatus.PAUSED)
        return;

      try {
        await RNFS.moveFile(cacheFileUri, fileUri);
        // Required by the background downloader library to signal iOS that the
        // background download session is complete.
        const fn = fileUri.split('/').pop();
        if (fn) completeHandler(fn);
      } catch (error) {
        downloads.delete(source);
        reject(error);
        return;
      }

      downloads.delete(source);
      resolve(ResourceFetcherUtils.removeFilePrefix(fileUri));
    })
    .error((error: any) => {
      if (!downloads.has(source)) return; // canceled externally
      downloads.delete(source);
      reject(
        new RnExecutorchError(
          RnExecutorchErrorCode.ResourceFetcherDownloadFailed,
          `Failed to fetch resource from '${uri}', context: ${error}`
        )
      );
    });

  task.start();

  downloads.set(source, {
    status: DownloadStatus.ONGOING,
    uri,
    fileUri,
    cacheFileUri,
    resolve,
    reject,
    task,
  });
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
  const cacheFileUri = `${RNFS.CachesDirectoryPath}/${filename}`;

  if (await ResourceFetcherUtils.checkFileExists(fileUri)) {
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

  const ctx: DownloadContext = {
    uri,
    source,
    fileUri,
    cacheFileUri,
    progressCallback,
    downloads,
    resolve,
    reject,
  };

  if (Platform.OS === 'android') {
    startAndroidDownload(ctx);
  } else {
    startIOSDownload(ctx);
  }

  return promise.then((path) => ({ path, wasDownloaded: true }));
}
