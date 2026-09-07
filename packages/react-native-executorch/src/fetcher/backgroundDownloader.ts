import { NativeModules, TurboModuleRegistry } from 'react-native';

// Optional integration with `@kesha-antonov/react-native-background-downloader`.
//
// An in-process transfer on iOS dies with the app: measured on device, suspending
// it tore the connection down ONE SECOND later, 43 MB into a 314 MB file, and only
// a background `NSURLSession` keeps going. That session is native work, and a
// download helper is not the part of this library that should be growing native
// code for it — there are React Native packages that do nothing else.
//
// So the fetcher uses one WHEN THE APP HAPPENS TO HAVE IT INSTALLED. It is an
// optional peer dependency: apps that install it get transfers that survive
// backgrounding (and an app kill), apps that don't keep the platform's own
// backend and pull in nothing.
//
// It backs BOTH platforms, so an app that installs it gets one download
// mechanism behaving the same way everywhere rather than a per-platform one the
// caller cannot see. The library covers both natively — a background
// `NSURLSession` on iOS, a foreground service on Android — and exposes the same
// task API for each, which is why the backend below needs no platform split.

// The slice of the library's API the fetcher uses, declared structurally so this
// file typechecks with the dependency absent.
export interface BackgroundDownloadTask {
  id: string;
  state: 'PENDING' | 'DOWNLOADING' | 'PAUSED' | 'DONE' | 'FAILED' | 'STOPPED';
  begin(handler: (params: { expectedBytes: number }) => void): BackgroundDownloadTask;
  progress(
    handler: (params: { bytesDownloaded: number; bytesTotal: number }) => void
  ): BackgroundDownloadTask;
  done(
    handler: (params: { bytesDownloaded: number; bytesTotal: number }) => void
  ): BackgroundDownloadTask;
  error(handler: (params: { error: string; errorCode: number }) => void): BackgroundDownloadTask;
  start(): void;
  // Keeps the bytes fetched so far as resume data, and resolves once that data
  // has been written — not merely once the transfer has been asked to stop.
  pause(): Promise<void>;
  resume(): Promise<void>;
  // Cancels and discards, unlike `pause`.
  stop(): Promise<void>;
}

export interface BackgroundDownloader {
  createDownloadTask(options: {
    id: string;
    url: string;
    destination: string;
  }): BackgroundDownloadTask;
  // Tasks the session is still holding, including ones started by a previous
  // launch of the app and ones paused with resume data.
  getExistingDownloadTasks(): Promise<BackgroundDownloadTask[]>;
  // Releases the OS's background-session completion handler for a finished task.
  // Resolves through the native module, so it can also reject.
  completeHandler(id: string): void | Promise<void>;
}

// `null` once resolution has been attempted and come up empty; `undefined` while
// it has not been attempted at all.
let cached: BackgroundDownloader | null | undefined;

// The library, or null when the app has not installed it (or installed the JS
// without linking the native side, as in Expo Go). Resolved once and remembered.
export function loadBackgroundDownloader(): BackgroundDownloader | null {
  if (cached !== undefined) return cached;
  cached = null;

  try {
    // A `require` inside a try/catch is Metro's own escape hatch for optional
    // dependencies (`resolver.allowOptionalDependencies`, which React Native's
    // Metro config turns on): a module that isn't installed is left unresolved
    // instead of failing the bundle, and the throw lands right here. The name
    // has to stay a literal — Metro collects dependencies statically and rejects
    // a `require` of anything it cannot read off the call itself.
    const required = require('@kesha-antonov/react-native-background-downloader');
    const candidate = (required?.default ?? required) as Partial<BackgroundDownloader>;

    // Having the JS is not the same as having the native module: without the
    // native build step (or in Expo Go) every call would throw, so fall back to
    // the platform's own backend instead. The module name is the same on both
    // platforms.
    const isLinked =
      TurboModuleRegistry.get('RNBackgroundDownloader') != null ||
      NativeModules.RNBackgroundDownloader != null;

    // Older majors expose a different surface (`download`, and a `pause` that
    // drops the fetched bytes). Treat anything but the shape used below as
    // absent rather than half-supporting it.
    const hasApi =
      typeof candidate?.createDownloadTask === 'function' &&
      typeof candidate?.getExistingDownloadTasks === 'function' &&
      typeof candidate?.completeHandler === 'function';

    if (isLinked && hasApi) cached = candidate as BackgroundDownloader;
  } catch {
    // Not installed — the fetcher stays on its per-platform fallback.
  }

  return cached;
}
