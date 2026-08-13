/* eslint-disable no-bitwise */
import { Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import { RnExecuTorchError } from '../core/error';

const IS_ANDROID = Platform.OS === 'android';
const BASE_DIR = IS_ANDROID
  ? `${RNBlobUtil.fs.dirs.SDCardDir || RNBlobUtil.fs.dirs.DocumentDir}/react-native-executorch`
  : `${RNBlobUtil.fs.dirs.DocumentDir}/react-native-executorch`;

/**
 * Options controlling a {@link download} call.
 * @category Types
 */
export interface DownloadOptions {
  /** Called with overall progress in `[0, 1]` as bytes arrive. */
  onProgress?: (progress: number) => void;
  /** Aborts the download. */
  signal?: AbortSignal;
  /**
   * Re-downloads every remote source even when it is already cached, replacing
   * the cached copy. Use to recover from a corrupted file or to pick up a model
   * that changed behind a stable URL.
   */
  forceDownload?: boolean;
}

const djb2 = (s: string): number => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h;
};

const isRemote = (source: string): boolean => /^https?:\/\//.test(source);

function cachePathFor(url: string): string {
  const cleanUrl = url.split('?')[0]!;
  const filename = cleanUrl.split('/').pop() || 'model';
  return `${BASE_DIR}/${djb2(cleanUrl)}_${filename}`;
}

async function isDownloaded(destPath: string): Promise<boolean> {
  try {
    const stat = await RNBlobUtil.fs.stat(destPath);
    return Number(stat.size) > 0;
  } catch {
    return false;
  }
}

// Download a single file URL directly to disk
async function downloadFile(
  url: string,
  destPath: string,
  onBytes?: (recv: number, tot: number) => void,
  signal?: AbortSignal
): Promise<string> {
  if (signal?.aborted) throw RnExecuTorchError('DOWNLOAD_ABORTED', 'The download was aborted.');

  await RNBlobUtil.fs.mkdir(BASE_DIR).catch(() => {});
  const tmpPath = `${destPath}.tmp`;
  await RNBlobUtil.fs.unlink(tmpPath).catch(() => {});

  const task = RNBlobUtil.config({ path: tmpPath, fileCache: true }).fetch('GET', url);
  const onAbort = () => task.cancel();
  signal?.addEventListener('abort', onAbort);

  task.progress({ count: 50 }, (received, total) => {
    const recv = Number(received);
    const tot = Number(total);
    if (recv > 0) onBytes?.(recv, tot > 0 ? tot : 0);
  });

  try {
    const res = await task;
    if (res.info().status >= 400 || !(await isDownloaded(tmpPath))) {
      await RNBlobUtil.fs.unlink(tmpPath).catch(() => {});
      throw RnExecuTorchError(
        'DOWNLOAD_FAILED',
        `Download of ${url} failed with status ${res.info().status}.`
      );
    }
    await RNBlobUtil.fs.mv(tmpPath, destPath);
    return destPath;
  } catch (err) {
    await RNBlobUtil.fs.unlink(tmpPath).catch(() => {});
    if (signal?.aborted) throw RnExecuTorchError('DOWNLOAD_ABORTED', 'The download was aborted.');
    throw err;
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }
}

// Collect all remote URLs inside a string, array, or nested config object
function collectUrls(node: unknown, out = new Set<string>()): Set<string> {
  if (typeof node === 'string') {
    if (isRemote(node)) out.add(node);
  } else if (Array.isArray(node)) {
    for (const item of node) collectUrls(item, out);
  } else if (typeof node === 'object' && node !== null) {
    for (const val of Object.values(node)) collectUrls(val, out);
  }
  return out;
}

// Replace remote URLs in config object with local downloaded file paths
function replaceUrls<T>(node: T, resolved: Map<string, string>): T {
  if (typeof node === 'string') return (resolved.get(node) ?? node) as T;
  if (Array.isArray(node)) return node.map((item) => replaceUrls(item, resolved)) as T;
  if (typeof node === 'object' && node !== null) {
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) next[k] = replaceUrls(v, resolved);
    return next as T;
  }
  return node;
}

/**
 * Downloads the remote resources referenced by `source` into a persistent local
 * cache and resolves with the same value, with every remote URL replaced by the
 * local path it was downloaded to.
 * @category Utils
 * @typeParam T The shape of the value being resolved.
 * @param source A URL, a local path, or any nested object/array holding them.
 * @param options Progress and cancellation options.
 * @returns `source` with every remote URL replaced by its local file path.
 */
export async function download<T>(source: T, options: DownloadOptions = {}): Promise<T> {
  const urls = [...collectUrls(source)];
  if (urls.length === 0) {
    options.onProgress?.(1);
    return source;
  }

  const resolved = new Map<string, string>();
  const received = new Array<number>(urls.length).fill(0);
  const totals = new Array<number>(urls.length).fill(0);

  // Fast-path: pre-fill cached files
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]!;
    const destPath = cachePathFor(url);
    if (!options.forceDownload && (await isDownloaded(destPath))) {
      const stat = await RNBlobUtil.fs.stat(destPath);
      const sz = Number(stat.size);
      received[i] = sz;
      totals[i] = sz;
      resolved.set(url, destPath);
    }
  }

  // If all files are cached, return immediately with 100% progress
  if (resolved.size === urls.length) {
    options.onProgress?.(1);
    return replaceUrls(source, resolved);
  }

  const updateProgress = () => {
    if (!options.onProgress) return;
    const sumReceived = received.reduce((a, b) => a + b, 0);
    const sumTotals = totals.reduce((a, b) => a + b, 0);
    options.onProgress(sumTotals > 0 ? Math.min(sumReceived / sumTotals, 1) : 0);
  };

  // Initial progress update for any pre-cached files in bundle
  updateProgress();

  // Download uncached files concurrently
  await Promise.all(
    urls.map(async (url, i) => {
      if (resolved.has(url)) return;

      const destPath = cachePathFor(url);
      const downloadedPath = await downloadFile(
        url,
        destPath,
        (recv, tot) => {
          received[i] = recv;
          if (tot > 0) totals[i] = tot;
          updateProgress();
        },
        options.signal
      );

      const stat = await RNBlobUtil.fs.stat(downloadedPath);
      const finalSize = Number(stat.size);
      received[i] = finalSize;
      totals[i] = finalSize;
      resolved.set(url, downloadedPath);
      updateProgress();
    })
  );

  options.onProgress?.(1);
  return replaceUrls(source, resolved);
}
