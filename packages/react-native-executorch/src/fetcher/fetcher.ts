/* eslint-disable no-bitwise */
import { Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import * as telemetry from './telemetry';
import NativeRnExecutorch, { type DownloadProgressEvent } from '../native/NativeRnExecutorch';
import { RnExecuTorchError } from '../core/error';

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
 * @category Utils / Types
 */
export interface DownloadOptions {
  /** Called with overall progress in `[0, 1]` as bytes arrive. */
  onProgress?: (progress: number) => void;
  /**
   * Aborts the download. The bytes fetched so far are kept, so a later
   * {@link download} of the same source continues from where this one stopped
   * instead of starting over.
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

// The file's full length, or 0 when it can't be established. `remoteSize`
// follows redirects (Hugging Face answers a model URL with a 302 to a CDN), so
// it reports the length of the file itself. `download()` already computes this
// for progress weighting and passes it in, so the HEAD is not repeated.
async function expectedBytesFor(url: string, known: number | undefined): Promise<number> {
  if (known && known > 0) return known;
  return remoteSize(url);
}

// Raised when a transfer reported success but the bytes on disk don't match
// what the server advertised.
const incompleteError = (url: string, got: number, want: number) =>
  RnExecuTorchError(
    'DOWNLOAD_FAILED',
    `Download of ${url} is incomplete (${got} of ${want} bytes).`
  );

// Raised when a download is cancelled through its `signal`. Internal: callers
// match on the DOWNLOAD_ABORTED code via isRnExecuTorchError.
const abortError = () => RnExecuTorchError('DOWNLOAD_ABORTED', 'The download was aborted.');

// DownloadManager's byte counter is 64-bit, but blob-util reads it out of the
// cursor with `getInt`, so what reaches JS is the low 32 bits reinterpreted as
// a signed int: past 2 GB it arrives NEGATIVE and wraps every 4 GB after that.
// Multi-GB LLM models spend most of their download inside that range, which is
// what collapsed their progress bar. The counter only ever grows, so the
// discarded high bits can be rebuilt by counting how often the low ones wrap.
const UINT32 = 0x100000000;
function reassemble32BitCounter(): (raw: number) => number {
  let wraps = 0;
  let previous = 0;
  return (raw) => {
    const low = raw < 0 ? raw + UINT32 : raw;
    if (low < previous) wraps += 1;
    previous = low;
    return low + wraps * UINT32;
  };
}

// Reports absolute bytes for one file. `total` is 0 when the transfer does not
// know the length yet — the receiver keeps using whatever length it already
// had rather than treating the file as complete.
type OnBytes = (received: number, total: number) => void;

interface DownloadUrlCallbacks {
  // Reports absolute received/total bytes for this file, including any bytes
  // already present from a previous partial download.
  onBytes?: OnBytes;
  signal?: AbortSignal;
  forceDownload?: boolean;
  // The file's full length when the caller already knows it, so the completeness
  // check doesn't repeat the HEAD. 0 / undefined means "look it up".
  expectedBytes?: number;
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
  // Same URL, same length — shared by everyone who joins.
  expectedBytes: number;
}

const inFlight = new Map<string, InFlightDownload>();

// Makes each native download task id unique, so a URL fetched again after an
// abort doesn't collide with the progress events of the attempt before it.
let downloadTaskCounter = 0;

// Downloads a single remote file into the cache, dispatching to the
// platform-appropriate backend. Returns the local path.
//
// Concurrent calls for the same URL share one request: without this, both would
// miss the cache check, double-count the download in telemetry, and write the
// same temporary file — on Android the second one's opening `unlink` would
// delete the first one's partially downloaded data.
async function downloadUrl(url: string, cb: DownloadUrlCallbacks): Promise<string> {
  if (cb.signal?.aborted) throw abortError();

  const dest = cachePathFor(url);

  if (cb.forceDownload) {
    // Drop the cached copy so the checks below fall through to a real fetch.
    // A download already in flight hasn't written `dest` yet, so joining it
    // still yields freshly fetched bytes.
    await RNBlobUtil.fs.unlink(dest).catch(() => {});
    // On iOS a half-finished attempt also leaves a staged file and the resume
    // state pointing at it; both have to go, or "download it again" would just
    // continue the attempt the caller is trying to replace.
    if (!IS_ANDROID) {
      await RNBlobUtil.fs.unlink(`${dest}.partial`).catch(() => {});
      await NativeRnExecutorch.resetDownload(`${dest}.partial`).catch(() => {});
    }
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
    expectedBytes: cb.expectedBytes ?? 0,
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
    expectedBytes: entry.expectedBytes,
    onBytes: (received, total) => {
      for (const listener of entry.listeners) listener(received, total);
    },
  };

  const path = IS_ANDROID
    ? await downloadUrlViaAndroidDownloadManager(url, dest, cb)
    : await downloadUrlViaIosBackgroundSession(url, dest, cb);

  // Neither backend is guaranteed to emit a last sample at 100%: blob-util
  // throttles progress events, and DownloadManager is polled, so the final
  // chunk usually lands between two polls. Without this a finished file stays
  // stuck a little short of its own size, and in a multi-file config that
  // shortfall is what the user sees while the remaining files download.
  const finalSize = await fileSize(path);
  if (finalSize > 0) cb.onBytes?.(finalSize, finalSize);

  return path;
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
      reject(abortError());
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

  if (cb.signal?.aborted) throw abortError();

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

  // DownloadManager reports total as -1 until the size is known; pass that on
  // as 0 rather than echoing the received count, which would otherwise look
  // like a file that is complete at every sample.
  const absoluteBytes = reassemble32BitCounter();
  task.progress({ count: 100 }, (received, total) => {
    const tot = Number(total);
    cb.onBytes?.(absoluteBytes(Number(received)), tot > 0 ? tot : 0);
  });

  try {
    await task;
  } catch (e) {
    await RNBlobUtil.fs.unlink(tmp).catch(() => {});
    throw cb.signal?.aborted ? abortError() : e;
  } finally {
    cb.signal?.removeEventListener('abort', onAbort);
  }

  // DownloadManager doesn't surface an HTTP status; an empty file means failure.
  const size = await fileSize(tmp);
  if (size <= 0) {
    await RNBlobUtil.fs.unlink(tmp).catch(() => {});
    throw RnExecuTorchError('DOWNLOAD_FAILED', `Download of ${url} failed (empty response).`);
  }
  // A non-empty file is not necessarily a complete one, and DownloadManager
  // gives us no status to check. Promoting a short file would cache it under
  // its final name forever — the existence-only cache check can't tell the
  // difference, and a truncated .pte only fails much later, at load.
  const expected = await expectedBytesFor(url, cb.expectedBytes);
  if (expected > 0 && size !== expected) {
    await RNBlobUtil.fs.unlink(tmp).catch(() => {});
    throw incompleteError(url, size, expected);
  }
  await RNBlobUtil.fs.mv(tmp, dest);
  return dest;
}

// iOS backend: a background NSURLSession in the native module.
//
// The obvious implementation, streaming in-process through blob-util, cannot
// work: measured on device, suspending the app tore the connection down within
// a second, 43 MB into a 314 MB file. A background session kept the same
// transfer running for as long as it was left alone. Since iOS only offers
// background transfers as DOWNLOAD tasks, which stage into their own file and
// hand it over whole at the end, there is no partially written file to append
// to and an interrupted transfer continues through NSURLSession's resume data
// instead of through an HTTP Range request. That state is kept on disk next to
// the file, so it survives the app being killed rather than merely suspended.
async function downloadUrlViaIosBackgroundSession(
  url: string,
  dest: string,
  cb: DownloadUrlCallbacks
): Promise<string> {
  const part = `${dest}.partial`;
  const expected = await expectedBytesFor(url, cb.expectedBytes);

  // A transfer that finished while the app was not running was moved here by
  // the session with no caller left to promote it. Finish that job rather than
  // fetching the whole file again.
  if (expected > 0 && (await fileSize(part)) === expected) {
    await RNBlobUtil.fs.mv(part, dest);
    cb.onBytes?.(expected, expected);
    return dest;
  }

  if (cb.signal?.aborted) throw abortError();

  const taskId = `${url}#${++downloadTaskCounter}`;
  const subscription = NativeRnExecutorch.onDownloadProgress((event: DownloadProgressEvent) => {
    if (event.taskId !== taskId) return;
    cb.onBytes?.(event.written, event.total);
  });

  const onAbort = () => {
    // Keeps the fetched bytes as resume data instead of discarding them.
    NativeRnExecutorch.cancelDownload(taskId);
  };
  cb.signal?.addEventListener('abort', onAbort);

  try {
    await NativeRnExecutorch.startDownload(taskId, url, part);
  } catch (e) {
    if (cb.signal?.aborted) throw abortError();
    const message = e instanceof Error ? e.message : String(e);
    throw RnExecuTorchError('DOWNLOAD_FAILED', `Download of ${url} failed: ${message}`);
  } finally {
    subscription.remove();
    cb.signal?.removeEventListener('abort', onAbort);
  }

  // The session reports success once it has written a file, not once it has
  // written the RIGHT file: a truncated body still completes. Checking here is
  // what keeps a short file from being renamed into the cache, where the
  // existence-only hit check would serve it forever.
  const assembled = await fileSize(part);
  if (expected > 0 && assembled !== expected) {
    throw incompleteError(url, assembled, expected);
  }

  await RNBlobUtil.fs.mv(part, dest);
  return dest;
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
function collectRemoteSources(node: unknown): Set<string> {
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
function substituteRemoteSources<T>(node: T, resolved: ReadonlyMap<string, string>): T {
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
 * Downloads go to a persistent cache and keep running while the app is in the
 * background: on Android through the system DownloadManager, on iOS through a
 * background `NSURLSession`. On both, an interrupted or cancelled transfer
 * continues from where it stopped rather than starting over.
 * When a config references several files, overall progress is weighted by their
 * byte sizes so a large model isn't reported the same as a tiny tokenizer.
 * @category Utils / Functions
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

  // Measure every file up front so overall progress can be weighted by real
  // byte sizes and a 1 GB model isn't treated like a 1 MB tokenizer. A file
  // that is already cached is measured on disk: it needs no HEAD at all, which
  // also keeps a warm start from paying a round trip per file.
  const measured = await Promise.all(
    urls.map(async (url) => {
      if (!options.forceDownload) {
        const cached = await fileSize(cachePathFor(url));
        if (cached > 0) return { size: cached, cached: true };
      }
      return { size: await remoteSize(url), cached: false };
    })
  );

  // Per-file weight and per-file completion, kept apart so one unmeasurable
  // file can't change how the others are weighted. A failed HEAD used to flip
  // EVERY file to equal weighting, which is how a tokenizer came to count for
  // as much as a 3 GB model; now only the unmeasured file falls back, and even
  // that is corrected the moment its transfer reports a real length.
  const weights = measured.map((m) => m.size);
  const fractions: number[] = measured.map((m) => (m.cached ? 1 : 0));
  const known = weights.filter((weight) => weight > 0);
  const fallbackWeight = known.length ? known.reduce((a, b) => a + b, 0) / known.length : 1;

  let reported = 0;
  const report = () => {
    if (!options.onProgress) return;
    let done = 0;
    let total = 0;
    for (let i = 0; i < weights.length; i++) {
      const weight = weights[i]! > 0 ? weights[i]! : fallbackWeight;
      done += fractions[i]! * weight;
      total += weight;
    }
    // Learning a weight mid-flight shifts the denominator, and a transfer that
    // has to restart genuinely loses ground. Neither is worth showing: a bar
    // that only ever moves forward is the one users can read.
    const next = total > 0 ? Math.min(done / total, 1) : 0;
    if (next <= reported) return;
    reported = next;
    options.onProgress(next);
  };
  report();

  const resolved = new Map<string, string>();
  await Promise.all(
    urls.map((url, i) =>
      // Telemetry fires inside downloadUrl, only for genuine (non-cached) fetches.
      downloadUrl(url, {
        signal: options.signal,
        forceDownload: options.forceDownload,
        // Already measured above — reuse it rather than asking again when the
        // completeness check needs the length.
        expectedBytes: weights[i],
        onBytes: (recv, tot) => {
          // The transfer's own length beats the HEAD's: it is what the bytes
          // are actually being counted against, and it is the only length
          // available for a file whose HEAD failed.
          if (tot > 0) weights[i] = tot;
          const size = weights[i]!;
          fractions[i] = size > 0 ? Math.min(Math.max(recv / size, 0), 1) : 0;
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
