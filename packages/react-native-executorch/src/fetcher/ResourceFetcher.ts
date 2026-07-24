/* eslint-disable no-bitwise */
import RNBlobUtil from 'react-native-blob-util';
import { triggerDownloadEvent, triggerHuggingFaceDownloadCounter } from './telemetry';

// Persistent, per-app directory where downloaded model assets are cached. We use
// DocumentDir rather than CacheDir so the OS won't evict large models between
// runs, forcing a costly re-download.
const RNE_DIRECTORY = `${RNBlobUtil.fs.dirs.DocumentDir}/react-native-executorch`;

/**
 * Progress callback reporting overall completion as a fraction in `[0, 1]`.
 * @category Types
 */
export type DownloadProgressCallback = (progress: number) => void;

/**
 * Options controlling a {@link download} call.
 * @category Types
 */
export interface DownloadOptions {
  /** Called with overall progress in `[0, 1]` as bytes arrive. */
  onProgress?: DownloadProgressCallback;
  /**
   * Aborts the download. Bytes fetched so far are kept on disk so a later
   * {@link download} of the same source resumes instead of restarting.
   */
  signal?: AbortSignal;
}

// djb2 — cheap, dependency-free hash used to derive a stable cache key per URL.
const djb2 = (s: string): number => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  }
  return h;
};

const isRemote = (source: string): boolean => /^https?:\/\//.test(source);

function cachePathFor(url: string): string {
  const urlWithoutQuery = url.split('?')[0]!;
  const basename = urlWithoutQuery.split('/').pop() || 'model';
  // Hash guards against basename collisions across different repos/versions.
  return `${RNE_DIRECTORY}/${djb2(urlWithoutQuery)}_${basename}`;
}

async function fileSize(path: string): Promise<number> {
  try {
    const stat = await RNBlobUtil.fs.stat(path);
    return Number(stat.size) || 0;
  } catch {
    return 0;
  }
}

// Best-effort remote content length via a HEAD request; 0 when unknown.
async function remoteSize(url: string): Promise<number> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const len = res.headers.get('content-length');
    return len ? Number(len) : 0;
  } catch {
    return 0;
  }
}

function abortError(): Error {
  const err = new Error('The download was aborted.');
  err.name = 'AbortError';
  return err;
}

interface DownloadOneCallbacks {
  // Reports absolute received/total bytes for this file, including any bytes
  // already present from a previous partial download.
  onBytes?: (received: number, total: number) => void;
  signal?: AbortSignal;
}

/**
 * Downloads a single remote file into the cache with HTTP-Range resume support.
 * Returns the local path. `canResume` is set to `false` on an internal retry to
 * avoid recursing forever when partial-file assembly fails.
 */
async function downloadOne(
  url: string,
  cb: DownloadOneCallbacks,
  canResume = true
): Promise<string> {
  const dest = cachePathFor(url);

  // Cache hit — nothing to download.
  if (await RNBlobUtil.fs.exists(dest)) {
    const size = await fileSize(dest);
    cb.onBytes?.(size, size);
    return dest;
  }

  // Count this actual (non-cached) fetch once — not on the internal retry.
  if (canResume) {
    triggerHuggingFaceDownloadCounter(url);
    triggerDownloadEvent(url);
  }

  await RNBlobUtil.fs.mkdir(RNE_DIRECTORY).catch(() => {});

  const part = `${dest}.partial`;
  if (!canResume) await RNBlobUtil.fs.unlink(part).catch(() => {});
  const offset = canResume ? await fileSize(part) : 0;

  // Resumed byte ranges land in a separate chunk file that we append onto the
  // partial; fresh downloads stream straight into the partial.
  const target = offset > 0 ? `${dest}.chunk` : part;
  await RNBlobUtil.fs.unlink(target).catch(() => {}); // clear any stale chunk

  const headers: Record<string, string> = {};
  if (offset > 0) headers.Range = `bytes=${offset}-`;

  if (cb.signal?.aborted) throw abortError();

  const task = RNBlobUtil.config({ path: target, fileCache: true }).fetch('GET', url, headers);
  const onAbort = () => task.cancel();
  cb.signal?.addEventListener('abort', onAbort);

  task.progress({ count: 20 }, (received, total) => {
    const recv = Number(received);
    const tot = Number(total);
    cb.onBytes?.(offset + recv, offset + tot);
  });

  let status: number;
  try {
    const res = await task;
    status = res.info().status;
  } catch (e) {
    // Network drop / cancel. Keep the fresh partial for a future resume, but
    // discard a resumed chunk — its offset assumptions may not hold.
    if (offset > 0) await RNBlobUtil.fs.unlink(target).catch(() => {});
    throw cb.signal?.aborted ? abortError() : e;
  } finally {
    cb.signal?.removeEventListener('abort', onAbort);
  }

  try {
    if (status === 416) {
      // Range not satisfiable — the partial already holds the whole file.
      await RNBlobUtil.fs.unlink(target).catch(() => {});
    } else if (status >= 400) {
      await RNBlobUtil.fs.unlink(target).catch(() => {});
      throw new Error(`Download of ${url} failed with HTTP status ${status}.`);
    } else if (offset > 0) {
      if (status === 206) {
        // Server honored the range: append the new bytes onto the partial.
        await RNBlobUtil.fs.appendFile(part, `file://${target}`, 'uri');
        await RNBlobUtil.fs.unlink(target).catch(() => {});
      } else {
        // Server ignored the range (200) and re-sent the whole file: replace.
        await RNBlobUtil.fs.unlink(part).catch(() => {});
        await RNBlobUtil.fs.mv(target, part);
      }
    }
    await RNBlobUtil.fs.mv(part, dest);
    return dest;
  } catch (assemblyErr) {
    // A `4xx` we deliberately threw must propagate as-is.
    if (status >= 400 && status !== 416) throw assemblyErr;
    // Assembling the partial failed (e.g. append unsupported). Wipe and retry
    // once as a plain full download so correctness never depends on resume.
    await RNBlobUtil.fs.unlink(part).catch(() => {});
    await RNBlobUtil.fs.unlink(target).catch(() => {});
    if (canResume) return downloadOne(url, cb, false);
    throw assemblyErr;
  }
}

/**
 * Downloads one or more model resources into a persistent local cache and
 * resolves with their local file paths.
 *
 * Local paths (anything not starting with `http`) are returned unchanged.
 * Remote files are streamed to disk with resume support: an interrupted
 * download continues from where it stopped on the next call rather than
 * restarting. When several sources are passed, overall progress is weighted by
 * their byte sizes so a large model isn't reported the same as a tiny
 * tokenizer.
 * @category Fetching
 * @param source A single URL/local path, or an array of them.
 * @param options Progress and cancellation options.
 * @returns The local path (for a single source) or paths (for an array),
 * matching the shape of `source`.
 */
export function download(source: string, options?: DownloadOptions): Promise<string>;
export function download(sources: string[], options?: DownloadOptions): Promise<string[]>;
export async function download(
  source: string | string[],
  options: DownloadOptions = {}
): Promise<string | string[]> {
  const single = !Array.isArray(source);
  const sources = single ? [source] : source;

  const remoteIndices = sources.map((s, i) => (isRemote(s) ? i : -1)).filter((i) => i >= 0);

  // Nothing to fetch — every source is already a local path.
  if (remoteIndices.length === 0) {
    options.onProgress?.(1);
    return single ? sources[0]! : sources;
  }

  // Weight overall progress by real byte sizes so a 1 GB model isn't treated
  // like a 1 MB tokenizer. When any HEAD fails we fall back to equal weighting.
  const sizes = await Promise.all(
    sources.map((s, i) => (remoteIndices.includes(i) ? remoteSize(s) : Promise.resolve(0)))
  );
  const haveAllSizes = remoteIndices.every((i) => sizes[i]! > 0);
  const total = haveAllSizes ? sizes.reduce((a, b) => a + b, 0) : remoteIndices.length;

  const received = new Array<number>(sources.length).fill(0);
  const report = () => {
    if (!options.onProgress) return;
    const sum = received.reduce((a, b) => a + b, 0);
    options.onProgress(total > 0 ? Math.min(sum / total, 1) : 0);
  };

  const results: string[] = [...sources];
  await Promise.all(
    remoteIndices.map((i) => {
      const url = sources[i]!;
      // Telemetry fires inside downloadOne, only for genuine (non-cached) fetches.
      return downloadOne(url, {
        signal: options.signal,
        onBytes: (recv, tot) => {
          received[i] = haveAllSizes ? recv : tot > 0 ? recv / tot : 0;
          report();
        },
      }).then((path) => {
        results[i] = path;
      });
    })
  );

  options.onProgress?.(1);
  return single ? results[0]! : results;
}
