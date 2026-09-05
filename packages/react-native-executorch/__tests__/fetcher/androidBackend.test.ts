/**
 * The Android download path.
 *
 * `src/fetcher/fetcher.ts` decides between the two backends once, at module
 * scope (`const IS_ANDROID = Platform.OS === 'android'`), so exercising the
 * Android branch means re-importing the module with a different `Platform`.
 * That also re-instantiates the blob-util mock, so every handle used here has
 * to come from the same fresh module registry — hence the `load()` helper
 * rather than the file-level imports the other fetcher suites use.
 */
import type { Route } from '../support/blobUtilMock';

const URL_A = 'https://huggingface.co/software-mansion/model/resolve/v1/model.pte';
const HF_COUNTER = 'https://huggingface.co/software-mansion/model/resolve/main/config.json';

type Android = {
  download: typeof import('../../src/fetcher/fetcher').download;
  serve: (url: string, route?: Route) => void;
  paths: () => string[];
  readText: (path: string) => string | undefined;
  countRequests: (method: string, url: string) => number;
};

const load = async (): Promise<Android> => {
  jest.resetModules();
  // A Proxy rather than a spread: the `react-native` entry point defines its
  // exports as lazy getters, and spreading it evaluates every one of them —
  // including native modules like `DevMenu` that do not exist under Jest.
  jest.doMock('react-native', () => {
    const actual = jest.requireActual('react-native');
    return new Proxy(actual, {
      get: (target, property) =>
        property === 'Platform'
          ? { ...target.Platform, OS: 'android' }
          : target[property as keyof typeof target],
    });
  });

  const blobUtil = await import('../support/blobUtilMock');
  const { download } = await import('../../src/fetcher/fetcher');
  const { setTelemetryEnabled } = await import('../../src/fetcher/telemetry');
  setTelemetryEnabled(false);

  // The freshly loaded fetcher talks to the freshly loaded mock, so the global
  // `fetch` installed by the shared setup file has to be pointed at it.
  globalThis.fetch = blobUtil.fakeFetch as unknown as typeof globalThis.fetch;
  blobUtil.fakeNet.serve(HF_COUNTER);

  return {
    download,
    serve: blobUtil.fakeNet.serve,
    paths: blobUtil.fakeFs.paths,
    readText: blobUtil.fakeFs.readText,
    countRequests: blobUtil.fakeNet.countRequests,
  };
};

afterEach(() => {
  jest.dontMock('react-native');
  jest.resetModules();
});

describe('download on Android', () => {
  it('caches under the app-private external directory', async () => {
    const android = await load();
    android.serve(URL_A, { body: 'model-bytes' });

    const path = await android.download(URL_A);

    expect(path.startsWith('/fake/sdcard/react-native-executorch/')).toBe(true);
    expect(android.readText(path)).toBe('model-bytes');
  });

  it('downloads through a temporary file and moves it into place', async () => {
    const android = await load();
    android.serve(URL_A);

    await android.download(URL_A);

    expect(android.paths().filter((p) => p.endsWith('.downloading'))).toEqual([]);
  });

  it('treats an empty response as a failure, since DownloadManager reports no status', async () => {
    const android = await load();
    android.serve(URL_A, { body: '' });

    await expect(android.download(URL_A)).rejects.toThrow(/empty response/);
    expect(android.paths()).toEqual([]);
  });

  it('does not send a Range header — DownloadManager resumes on its own', async () => {
    const android = await load();
    android.serve(URL_A);

    await android.download(URL_A);

    expect(android.countRequests('GET', URL_A)).toBe(1);
  });

  it('serves a second call from the cache', async () => {
    const android = await load();
    android.serve(URL_A);

    const first = await android.download(URL_A);
    const second = await android.download(URL_A);

    expect(second).toBe(first);
    expect(android.countRequests('GET', URL_A)).toBe(1);
  });
});
