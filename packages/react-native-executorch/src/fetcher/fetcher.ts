/* eslint-disable no-bitwise */
import { Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import * as telemetry from './telemetry';

const IS_ANDROID = Platform.OS === 'android';

// Persistent, per-app directory where downloaded model assets are cached.
//   iOS: internal DocumentDir (not CacheDir) so the OS won't evict large models
//        between runs and force a costly re-download.
//   Android: the app-private EXTERNAL files dir (getExternalFilesDir), so the
//        system DownloadManager can write there and same-volume moves stay cheap
//        even for multi-GB files. Falls back to DocumentDir if unmounted.
const ANDROID_DIRECTORY = RNBlobUtil.fs.dirs.SDCardDir || RNBlobUtil.fs.dirs.DocumentDir;
const RNE_DIRECTORY = IS_ANDROID
  ? `${ANDROID_DIRECTORY}/react-native-executorch`
  : `${RNBlobUtil.fs.dirs.DocumentDir}/react-native-executorch`;

/**
 * Options controlling a {@link download} call.
 * @category Types
 */
export interface DownloadOptions {
  /** Called with overall progress in `[0, 1]` as bytes arrive. */
  onProgress?: (progress: number) => void;
  /**
   * Aborts the download. On iOS the bytes fetched so far are kept on disk so a
   * later {@link download} of the same source resumes instead of restarting.
   */
  signal?: AbortSignal;
  /**
   * Re-downloads every remote source even when it is already cached, replacing
   * the cached copy. Use to recover from a corrupted file or to pick up a model
   * that changed behind a stable URL.
   */
  forceDownload?: boolean;
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

/**
 * Raised when a {@link download} is cancelled through its `signal`. Internal:
 * consumers should keep matching on `error.name === 'AbortError'`, which stays
 * the standard `AbortSignal` contract.
 */
export class AbortError extends Error {
  constructor(message = 'The download was aborted.') {
    super(message);
    this.name = 'AbortError';
  }
}

type OnBytes = (received: number, total: number) => void;

interface DownloadUrlCallbacks {
  // Reports absolute received/total bytes for this file, including any bytes
  // already present from a previous partial download.
  onBytes?: OnBytes;
  signal?: AbortSignal;
  forceDownload?: boolean;
}

// A download that is currently running, shared by every caller that asked for
// the same URL while it was in flight.
interface InFlightDownload {
  promise: Promise<string>;
  // Progress is fanned out to every joined caller.
  listeners: Set<OnBytes>;
  // Drives the underlying request; aborted only once every caller has left.
  controller: AbortController;
  callers: number;
}

const inFlight = new Map<string, InFlightDownload>();

// Downloads a single remote file into the cache, dispatching to the
// platform-appropriate backend. Returns the local path.
//
// Concurrent calls for the same URL share one request: without this, both would
// miss the cache check, double-count the download in telemetry, and write the
// same temporary file — on Android the second one's opening `unlink` would
// delete the first one's partially downloaded data.
async function downloadUrl(url: string, cb: DownloadUrlCallbacks): Promise<string> {
  if (cb.signal?.aborted) throw new AbortError();

  const dest = cachePathFor(url);

  if (cb.forceDownload) {
    // Drop the cached copy so the checks below fall through to a real fetch.
    // A download already in flight hasn't written `dest` yet, so joining it
    // still yields freshly fetched bytes.
    await RNBlobUtil.fs.unlink(dest).catch(() => {});
  } else if (await RNBlobUtil.fs.exists(dest)) {
    // Cache hit — nothing to download.
    const size = await fileSize(dest);
    cb.onBytes?.(size, size);
    return dest;
  }

  // Skip an entry whose last caller just left: it is already unwinding, so
  // joining it would hand this caller someone else's cancellation.
  const existing = inFlight.get(url);
  if (existing && !existing.controller.signal.aborted) return joinDownload(existing, cb);

  const entry: InFlightDownload = {
    promise: Promise.resolve(''),
    listeners: new Set(),
    controller: new AbortController(),
    callers: 0,
  };
  entry.promise = startDownload(url, dest, entry).finally(() => {
    inFlight.delete(url);
  });
  inFlight.set(url, entry);

  return joinDownload(entry, cb);
}

// Runs the actual request, fanning progress out to everyone who joined.
async function startDownload(url: string, dest: string, entry: InFlightDownload): Promise<string> {
  // Count this actual (non-cached) fetch once, no matter how many callers share it.
  telemetry.triggerHuggingFaceDownloadCounter(url);
  telemetry.triggerDownloadEvent(url);

  await RNBlobUtil.fs.mkdir(RNE_DIRECTORY).catch(() => {});

  const cb: DownloadUrlCallbacks = {
    signal: entry.controller.signal,
    onBytes: (received, total) => {
      for (const listener of entry.listeners) listener(received, total);
    },
  };

  return IS_ANDROID
    ? downloadUrlViaAndroidDownloadManager(url, dest, cb)
    : downloadUrlViaIosStream(url, dest, cb);
}

// Attaches one caller to a shared download. The caller's own signal only
// detaches it — the request itself is cancelled once the last caller leaves.
function joinDownload(entry: InFlightDownload, cb: DownloadUrlCallbacks): Promise<string> {
  entry.callers += 1;
  if (cb.onBytes) entry.listeners.add(cb.onBytes);

  return new Promise<string>((resolve, reject) => {
    const onAbort = () => {
      if (cb.onBytes) entry.listeners.delete(cb.onBytes);
      entry.callers -= 1;
      if (entry.callers === 0) entry.controller.abort();
      reject(new AbortError());
    };
    cb.signal?.addEventListener('abort', onAbort);

    entry.promise.then(resolve, reject).finally(() => {
      cb.signal?.removeEventListener('abort', onAbort);
    });
  });
}

// Android backend: the system DownloadManager streams to app-private external
// storage. Unlike blob-util's in-process reader it handles files larger than
// 2 GB, keeps downloading while the app is in the background or killed, and
// resumes across transient network drops on its own — so no manual Range logic.
async function downloadUrlViaAndroidDownloadManager(
  url: string,
  dest: string,
  cb: DownloadUrlCallbacks
): Promise<string> {
  const tmp = `${dest}.downloading`;
  await RNBlobUtil.fs.unlink(tmp).catch(() => {});

  if (cb.signal?.aborted) throw new AbortError();

  const task = RNBlobUtil.config({
    addAndroidDownloads: {
      useDownloadManager: true,
      path: tmp,
      notification: false,
      mediaScannable: false,
      mime: 'application/octet-stream',
    },
  }).fetch('GET', url);

  const onAbort = () => task.cancel();
  cb.signal?.addEventListener('abort', onAbort);

  // DownloadManager reports total as -1 until the size is known; forward the
  // received byte count regardless so byte-weighted progress still advances.
  task.progress({ count: 100 }, (received, total) => {
    const recv = Number(received);
    const tot = Number(total);
    cb.onBytes?.(recv, tot > 0 ? tot : recv);
  });

  try {
    await task;
  } catch (e) {
    await RNBlobUtil.fs.unlink(tmp).catch(() => {});
    throw cb.signal?.aborted ? new AbortError() : e;
  } finally {
    cb.signal?.removeEventListener('abort', onAbort);
  }

  // DownloadManager doesn't surface an HTTP status; an empty file means failure.
  const size = await fileSize(tmp);
  if (size <= 0) {
    await RNBlobUtil.fs.unlink(tmp).catch(() => {});
    throw new Error(`Download of ${url} failed (empty response).`);
  }
  await RNBlobUtil.fs.mv(tmp, dest);
  return dest;
}

// iOS backend: blob-util streams via the iOS URL session straight to disk.
// Interrupted downloads resume from a `.partial` file via an HTTP Range request.
// `canResume` is set to `false` on an internal retry to avoid recursing forever
// if partial-file assembly ever fails.
async function downloadUrlViaIosStream(
  url: string,
  dest: string,
  cb: DownloadUrlCallbacks,
  canResume = true
): Promise<string> {
  const part = `${dest}.partial`;
  if (!canResume) await RNBlobUtil.fs.unlink(part).catch(() => {});
  const offset = canResume ? await fileSize(part) : 0;

  // Resumed byte ranges land in a separate chunk file that we append onto the
  // partial; fresh downloads stream straight into the partial.
  const target = offset > 0 ? `${dest}.chunk` : part;
  await RNBlobUtil.fs.unlink(target).catch(() => {}); // clear any stale chunk

  const headers: Record<string, string> = {};
  if (offset > 0) headers.Range = `bytes=${offset}-`;

  if (cb.signal?.aborted) throw new AbortError();

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
    throw cb.signal?.aborted ? new AbortError() : e;
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
    if (canResume) return downloadUrlViaIosStream(url, dest, cb, false);
    throw assemblyErr;
  }
}

// Plain data containers we recurse into. Anything else (numbers, functions,
// typed arrays, class instances) is left alone.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Walks a value and collects every distinct remote URL sitting on a string
 * leaf. Deduplicating here means a URL repeated across fields is fetched once.
 * @param node The value to walk.
 * @returns The set of remote URLs referenced by `node`.
 */
export function collectRemoteSources(node: unknown): Set<string> {
  const out = new Set<string>();

  const visit = (current: unknown): void => {
    if (typeof current === 'string') {
      if (isRemote(current)) out.add(current);
    } else if (Array.isArray(current)) {
      for (const item of current) visit(item);
    } else if (isPlainObject(current)) {
      for (const value of Object.values(current)) visit(value);
    }
  };

  visit(node);
  return out;
}

/**
 * Rebuilds a value with every resolved URL replaced by its local path.
 * Branches containing no resolved URL keep their original reference, so an
 * untouched config comes back as-is and stays stable across React renders.
 * @typeParam T The shape of the value being rewritten.
 * @param node The value to rewrite.
 * @param resolved Map of remote URL to downloaded local path.
 * @returns `node` with resolved URLs swapped for local paths.
 */
export function substituteRemoteSources<T>(node: T, resolved: ReadonlyMap<string, string>): T {
  if (typeof node === 'string') {
    return (resolved.get(node) ?? node) as T;
  }
  if (Array.isArray(node)) {
    let changed = false;
    const next = node.map((item) => {
      const mapped = substituteRemoteSources(item, resolved);
      changed ||= mapped !== item;
      return mapped;
    });
    return (changed ? next : node) as T;
  }
  if (isPlainObject(node)) {
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) {
      const mapped = substituteRemoteSources(value, resolved);
      changed ||= mapped !== value;
      next[key] = mapped;
    }
    return (changed ? next : node) as T;
  }
  return node;
}

/**
 * Downloads the remote resources referenced by `source` into a persistent local
 * cache and resolves with the same value, with every remote URL replaced by the
 * local path it was downloaded to.
 *
 * `source` may be a single URL, or any nested structure of plain objects and
 * arrays — typically a whole model config. Every string leaf that looks like an
 * `http(s)` URL is downloaded; everything else (local paths, labels, numbers)
 * is passed through untouched. The result therefore has exactly the same shape
 * and type as the input and can be handed straight to a `create<Task>` factory:
 *
 * ```ts
 * const model = await download(models.classification.EFFICIENTNET_V2_S.XNNPACK_FP32);
 * const { classify, dispose } = await createClassifier(model);
 * ```
 *
 * Downloads go to a persistent cache: on Android via the system DownloadManager
 * (handles multi-GB files and continues in the background), on iOS via a
 * streaming request that resumes an interrupted download from where it stopped.
 * When a config references several files, overall progress is weighted by their
 * byte sizes so a large model isn't reported the same as a tiny tokenizer.
 * @category Utils
 * @typeParam T The shape of the value being resolved.
 * @param source A URL, a local path, or any nested object/array holding them.
 * @param options Progress and cancellation options.
 * @returns `source` with every remote URL replaced by its local file path.
 */
export async function download<T>(source: T, options: DownloadOptions = {}): Promise<T> {
  const urls = [...collectRemoteSources(source)];

  // Nothing to fetch — every source is already a local path.
  if (urls.length === 0) {
    options.onProgress?.(1);
    return source;
  }

  // Weight overall progress by real byte sizes so a 1 GB model isn't treated
  // like a 1 MB tokenizer. When any HEAD fails we fall back to equal weighting.
  const sizes = await Promise.all(urls.map(remoteSize));
  const haveAllSizes = sizes.every((size) => size > 0);
  const total = haveAllSizes ? sizes.reduce((a, b) => a + b, 0) : urls.length;

  const received = new Array<number>(urls.length).fill(0);
  const report = () => {
    if (!options.onProgress) return;
    const sum = received.reduce((a, b) => a + b, 0);
    options.onProgress(total > 0 ? Math.min(sum / total, 1) : 0);
  };

  const resolved = new Map<string, string>();
  await Promise.all(
    urls.map((url, i) =>
      // Telemetry fires inside downloadUrl, only for genuine (non-cached) fetches.
      downloadUrl(url, {
        signal: options.signal,
        forceDownload: options.forceDownload,
        onBytes: (recv, tot) => {
          received[i] = haveAllSizes ? recv : tot > 0 ? recv / tot : 0;
          report();
        },
      }).then((path) => {
        resolved.set(url, path);
      })
    )
  );

  options.onProgress?.(1);
  return substituteRemoteSources(source, resolved);
}
