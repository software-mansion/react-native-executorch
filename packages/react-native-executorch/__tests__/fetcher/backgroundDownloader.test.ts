/**
 * The optional background downloader, on both platforms.
 *
 * `src/fetcher/fetcher.ts` prefers `@kesha-antonov/react-native-background-downloader`
 * over the per-platform fallbacks whenever the app has it, so the behavior worth
 * pinning here is that the SAME backend is chosen on iOS and Android — the point
 * of preferring it is that an app installing it stops getting a different
 * download mechanism per platform.
 *
 * The package is an optional peer dependency and is not installed for these
 * suites, so it is mocked virtually. Both the platform and the presence of the
 * native module are read at import time (`Platform.OS`, `TurboModuleRegistry`),
 * and `loadBackgroundDownloader` memoizes its answer, so each case re-imports
 * the module graph — hence the `load()` helper rather than file-level imports.
 */
import type { Route } from '../support/blobUtilMock';
import type {
  BackgroundDownloader,
  BackgroundDownloadTask,
} from '../../src/fetcher/backgroundDownloader';

const PACKAGE = '@kesha-antonov/react-native-background-downloader';
const NATIVE_MODULE = 'RNBackgroundDownloader';

const URL_A = 'https://huggingface.co/software-mansion/model/resolve/v1/model.pte';
const HF_COUNTER = 'https://huggingface.co/software-mansion/model/resolve/main/config.json';

const BODY = 'model-bytes';

type FakeDownloader = BackgroundDownloader & {
  /** Every task the fetcher actually started, in order. */
  started: { id: string; url: string; destination: string }[];
};

/**
 * A stand-in for the library that completes every transfer immediately.
 *
 * It writes the body straight to the task's `destination`, which is what the
 * real one does on Android; on iOS the file is staged privately and moved there
 * at the end. Either way the fetcher only ever sees it at `destination`, so one
 * fake covers both.
 * @param write Writes a file into the blob-util mock's filesystem.
 * @returns The fake downloader, with the tasks it started recorded on it.
 */
function createFakeDownloader(write: (path: string, contents: string) => void): FakeDownloader {
  const started: FakeDownloader['started'] = [];

  return {
    started,

    createDownloadTask({ id, url, destination }) {
      let onBegin: ((params: { expectedBytes: number }) => void) | undefined;
      let onProgress:
        | ((params: { bytesDownloaded: number; bytesTotal: number }) => void)
        | undefined;
      let onDone: ((params: { bytesDownloaded: number; bytesTotal: number }) => void) | undefined;

      const task: BackgroundDownloadTask = {
        id,
        state: 'PENDING',
        begin: (handler) => {
          onBegin = handler;
          return task;
        },
        progress: (handler) => {
          onProgress = handler;
          return task;
        },
        done: (handler) => {
          onDone = handler;
          return task;
        },
        error: () => task,
        start: () => {
          started.push({ id, url, destination });
          const total = BODY.length;
          onBegin?.({ expectedBytes: total });
          onProgress?.({ bytesDownloaded: total, bytesTotal: total });
          write(destination, BODY);
          onDone?.({ bytesDownloaded: total, bytesTotal: total });
        },
        pause: async () => {},
        resume: async () => {},
        stop: async () => {},
      };

      return task;
    },

    getExistingDownloadTasks: async () => [],
    completeHandler: () => {},
  };
}

type Harness = {
  download: typeof import('../../src/fetcher/fetcher').download;
  downloader: FakeDownloader;
  serve: (url: string, route?: Route) => void;
  paths: () => string[];
  readText: (path: string) => string | undefined;
  countRequests: (method: string, url: string) => number;
};

const load = async (os: 'ios' | 'android'): Promise<Harness> => {
  jest.resetModules();

  // A Proxy rather than a spread: the `react-native` entry point defines its
  // exports as lazy getters, and spreading it evaluates every one of them —
  // including native modules like `DevMenu` that do not exist under Jest.
  jest.doMock('react-native', () => {
    const actual = jest.requireActual('react-native');
    return new Proxy(actual, {
      get: (target, property) => {
        if (property === 'Platform') return { ...target.Platform, OS: os };
        // Having the JS is not having the native module, and the fetcher checks
        // for it before using the library — so the fake has to be visible here
        // too, under the name both platforms register it as.
        if (property === 'TurboModuleRegistry') {
          return {
            ...target.TurboModuleRegistry,
            get: (name: string) => (name === NATIVE_MODULE ? {} : null),
          };
        }
        return target[property as keyof typeof target];
      },
    });
  });

  const blobUtil = await import('../support/blobUtilMock');
  const downloader = createFakeDownloader(blobUtil.fakeFs.write);
  jest.doMock(PACKAGE, () => downloader, { virtual: true });

  const { download } = await import('../../src/fetcher/fetcher');
  const { setTelemetryEnabled } = await import('../../src/fetcher/telemetry');
  setTelemetryEnabled(false);

  // The freshly loaded fetcher talks to the freshly loaded mock, so the global
  // `fetch` installed by the shared setup file has to be pointed at it.
  globalThis.fetch = blobUtil.fakeFetch as unknown as typeof globalThis.fetch;
  blobUtil.fakeNet.serve(HF_COUNTER);

  return {
    download,
    downloader,
    serve: blobUtil.fakeNet.serve,
    paths: blobUtil.fakeFs.paths,
    readText: blobUtil.fakeFs.readText,
    countRequests: blobUtil.fakeNet.countRequests,
  };
};

afterEach(() => {
  jest.dontMock('react-native');
  jest.dontMock(PACKAGE);
  jest.resetModules();
});

describe.each(['ios', 'android'] as const)(
  'download on %s with the background downloader',
  (os) => {
    it('routes the transfer through it instead of the platform fallback', async () => {
      const harness = await load(os);
      harness.serve(URL_A, { body: BODY });

      const path = await harness.download(URL_A);

      expect(harness.downloader.started).toHaveLength(1);
      expect(harness.downloader.started[0]!.url).toBe(URL_A);
      // Neither fallback ran: both of them fetch through blob-util.
      expect(harness.countRequests('GET', URL_A)).toBe(0);
      expect(harness.readText(path)).toBe(BODY);
    });

    it('stages through a partial file and leaves none behind', async () => {
      const harness = await load(os);
      harness.serve(URL_A, { body: BODY });

      const path = await harness.download(URL_A);

      expect(harness.downloader.started[0]!.destination).toBe(`${path}.partial`);
      expect(harness.paths().filter((p) => p.endsWith('.partial'))).toEqual([]);
    });

    it('serves a second call from the cache', async () => {
      const harness = await load(os);
      harness.serve(URL_A, { body: BODY });

      const first = await harness.download(URL_A);
      const second = await harness.download(URL_A);

      expect(second).toBe(first);
      expect(harness.downloader.started).toHaveLength(1);
    });
  }
);

// Installing the package must not move the cache: the directory is chosen per
// platform and a model already downloaded under the fallback has to stay a hit.
it('keeps caching under the app-private external directory on Android', async () => {
  const harness = await load('android');
  harness.serve(URL_A, { body: BODY });

  const path = await harness.download(URL_A);

  expect(path.startsWith('/fake/sdcard/react-native-executorch/')).toBe(true);
});
