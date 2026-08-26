/**
 * Mock of `react-native-blob-util`: an in-memory filesystem plus a programmable
 * network layer.
 *
 * `src/fetcher/fetcher.ts` is almost entirely filesystem choreography — temp
 * files, range requests, partial-file assembly, moves — so the interesting
 * behavior only shows up when the filesystem actually remembers what was
 * written to it. This mock therefore models real file state rather than
 * recording calls, and `fakeNet` lets a test decide per URL what the server
 * does: status code, body, whether it honors `Range`, and when the response
 * completes.
 */

// ============================================================================
// In-memory filesystem
// ============================================================================

const files = new Map<string, Uint8Array>();
const directories = new Set<string>();

// Hand-rolled rather than TextEncoder/TextDecoder: the package's `lib` is
// `ESNext` only, so neither is in scope. Test payloads are ASCII.
const encode = (value: string | Uint8Array): Uint8Array =>
  typeof value === 'string' ? Uint8Array.from([...value].map((c) => c.charCodeAt(0))) : value;

const decode = (data: Uint8Array): string => String.fromCharCode(...data);

export const fakeFs = {
  /** Wipes all file and directory state. */
  reset(): void {
    files.clear();
    directories.clear();
  },
  /**
   * Places a file at `path`.
   * @param path The absolute path to write to.
   * @param contents The file contents.
   */
  write(path: string, contents: string | Uint8Array): void {
    files.set(path, encode(contents));
  },
  /**
   * Deletes a file, if present.
   * @param path The absolute path to delete.
   */
  remove(path: string): void {
    files.delete(path);
  },
  /**
   * Reads a file as text.
   * @param path The absolute path to read.
   * @returns The decoded contents, or `undefined` when the file is absent.
   */
  readText(path: string): string | undefined {
    const data = files.get(path);
    return data === undefined ? undefined : decode(data);
  },
  /**
   * @param path The absolute path to check.
   * @returns Whether a file exists at `path`.
   */
  has(path: string): boolean {
    return files.has(path);
  },
  /** @returns Every path currently holding a file, sorted. */
  paths(): string[] {
    return [...files.keys()].sort();
  },
  /** @returns Every directory that was explicitly created, sorted. */
  dirs(): string[] {
    return [...directories].sort();
  },
};

// ============================================================================
// Programmable network
// ============================================================================

/** What the fake server does for one URL. */
export type Route = {
  /** HTTP status of the response. Defaults to `200`. */
  status?: number;
  /** Response body. Defaults to 16 bytes of `'a'`. */
  body?: string | Uint8Array;
  /** Whether a `Range` request is answered with `206` + the tail. Defaults to `true`. */
  supportsRange?: boolean;
  /**
   * Awaited before the response completes, so a test can hold a download open
   * (to observe progress, join a second caller, or abort mid-flight).
   */
  gate?: Promise<unknown>;
  /** When set, the request rejects with this error instead of responding. */
  error?: Error;
  /** Whether a `HEAD` request reports a content length. Defaults to `true`. */
  headOk?: boolean;
};

type Request = { method: string; url: string; headers: Record<string, string> };

const routes = new Map<string, Route>();
const requests: Request[] = [];

export const fakeNet = {
  /** Wipes all routes and the recorded request log. */
  reset(): void {
    routes.clear();
    requests.length = 0;
  },
  /**
   * Registers what the server does for `url`.
   * @param url The exact URL to serve.
   * @param route The response script. Defaults to a 16-byte `200`.
   */
  serve(url: string, route: Route = {}): void {
    routes.set(url, route);
  },
  /** @returns Every request the fake server received, in order. */
  requests(): readonly Request[] {
    return requests;
  },
  /**
   * @param method The HTTP method to count.
   * @param url The URL to count requests for.
   * @returns How many matching requests were made.
   */
  countRequests(method: string, url: string): number {
    return requests.filter((r) => r.method === method && r.url === url).length;
  },
};

const bodyOf = (route: Route): Uint8Array =>
  encode(route.body ?? 'a'.repeat(16)) as Uint8Array<ArrayBuffer>;

/** A deferred whose `resolve` a test calls to let a gated download finish. */
export function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

/**
 * Stand-in for the global `fetch`, answering from the same routes as
 * `RNBlobUtil`. Only what `src/` uses is implemented: `HEAD` for content
 * length, and fire-and-forget `POST`/`HEAD` for telemetry.
 * @param url The requested URL.
 * @param init The request options.
 * @returns A minimal `Response`-shaped object.
 */
export const fakeFetch = async (
  url: string,
  init?: { method?: string }
): Promise<{ status: number; headers: { get: (name: string) => string | null } }> => {
  const method = init?.method ?? 'GET';
  requests.push({ method, url, headers: {} });

  const route = routes.get(url);
  if (!route) throw new Error(`fakeNet: no route registered for ${url}`);
  if (route.error) throw route.error;

  const length = route.headOk === false ? null : String(bodyOf(route).length);
  return {
    status: route.status ?? 200,
    headers: { get: (name: string) => (name.toLowerCase() === 'content-length' ? length : null) },
  };
};

// ============================================================================
// RNBlobUtil surface
// ============================================================================

type ProgressCallback = (received: string, total: string) => void;
type StateChangeCallback = (info: { status?: number }) => void;

type FetchTask = Promise<{ info: () => { status: number } }> & {
  progress: (config: { count?: number }, cb: ProgressCallback) => FetchTask;
  // Undocumented in blob-util's typings, but real: it reports the response
  // state, so `src/` learns the status as soon as the headers land rather than
  // only once the body is complete. See `downloadUrlViaIosStream`.
  stateChange: (cb: StateChangeCallback) => FetchTask;
  cancel: () => void;
};

class CancelledError extends Error {
  constructor() {
    super('Download cancelled.');
    this.name = 'CancelledError';
  }
}

type Config = {
  /** Destination path for a streamed download (iOS-style). */
  path?: string;
  fileCache?: boolean;
  addAndroidDownloads?: { path?: string; useDownloadManager?: boolean; [key: string]: unknown };
};

function startFetch(config: Config, method: string, url: string, headers: Record<string, string>) {
  const dest = config.addAndroidDownloads?.path ?? config.path;
  requests.push({ method, url, headers });

  let onProgress: ProgressCallback | undefined;
  let onStateChange: StateChangeCallback | undefined;
  let cancelled = false;

  const run = async () => {
    const route = routes.get(url);
    if (!route) throw new Error(`fakeNet: no route registered for ${url}`);
    if (route.error) throw route.error;

    const full = bodyOf(route);
    const rangeHeader = headers.Range ?? headers.range;
    const offset = rangeHeader ? Number(/bytes=(\d+)-/.exec(rangeHeader)?.[1] ?? 0) : 0;

    let status = route.status ?? 200;
    let payload = full;
    if (offset > 0 && status < 400) {
      if (offset >= full.length) {
        status = 416;
        payload = new Uint8Array(0);
      } else if (route.supportsRange ?? true) {
        status = 206;
        payload = full.subarray(offset);
      }
      // Otherwise the server ignores the range and re-sends everything (200).
    }

    // The status is known once the headers are in, which is before any of the
    // body arrives and before the gate a test may be holding the response on.
    onStateChange?.({ status });

    // Halfway progress first, so a test can observe a partially finished
    // download while the gate is still closed.
    onProgress?.(String(Math.floor(payload.length / 2)), String(payload.length));
    if (route.gate) await route.gate;
    if (cancelled) throw new CancelledError();
    onProgress?.(String(payload.length), String(payload.length));

    // A failing status writes no bytes, matching a real streamed download that
    // is discarded by the caller.
    if (status < 400 && status !== 416 && dest) files.set(dest, payload);

    return { info: () => ({ status }) };
  };

  const task = run() as FetchTask;
  task.progress = (_config, cb) => {
    onProgress = cb;
    return task;
  };
  task.stateChange = (cb) => {
    onStateChange = cb;
    return task;
  };
  task.cancel = () => {
    cancelled = true;
  };
  return task;
}

const fs = {
  dirs: {
    DocumentDir: '/fake/documents',
    CacheDir: '/fake/caches',
    SDCardDir: '/fake/sdcard',
  },

  exists: async (path: string): Promise<boolean> => files.has(path) || directories.has(path),

  stat: async (path: string): Promise<{ size: number }> => {
    const data = files.get(path);
    if (!data) throw new Error(`ENOENT: ${path}`);
    return { size: data.length };
  },

  mkdir: async (path: string): Promise<void> => {
    if (directories.has(path)) throw new Error(`EEXIST: ${path}`);
    directories.add(path);
  },

  unlink: async (path: string): Promise<void> => {
    if (!files.delete(path) && !directories.delete(path)) throw new Error(`ENOENT: ${path}`);
  },

  mv: async (from: string, to: string): Promise<void> => {
    const data = files.get(from);
    if (!data) throw new Error(`ENOENT: ${from}`);
    files.delete(from);
    files.set(to, data);
  },

  appendFile: async (path: string, source: string, encoding?: string): Promise<number> => {
    if (encoding !== 'uri') throw new Error(`blobUtilMock: unsupported encoding '${encoding}'`);
    const srcPath = source.replace(/^file:\/\//, '');
    const src = files.get(srcPath);
    if (!src) throw new Error(`ENOENT: ${srcPath}`);
    const dst = files.get(path) ?? new Uint8Array(0);
    const merged = new Uint8Array(dst.length + src.length);
    merged.set(dst);
    merged.set(src, dst.length);
    files.set(path, merged);
    return merged.length;
  },
};

const RNBlobUtil = {
  fs,
  config: (config: Config) => ({
    fetch: (method: string, url: string, headers: Record<string, string> = {}) =>
      startFetch(config, method, url, headers),
  }),
  fetch: (method: string, url: string, headers: Record<string, string> = {}) =>
    startFetch({}, method, url, headers),
};

export default RNBlobUtil;
