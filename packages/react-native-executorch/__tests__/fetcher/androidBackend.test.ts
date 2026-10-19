/**
 * The Android download path.
 *
 * Android used to have a backend of its own — the system `DownloadManager` —
 * because blob-util's in-process reader stopped after 8 KB
 * (RonRadtke/react-native-blob-util#475). That fix shipped in 0.24.11, so both
 * platforms now share the streaming fallback, and what is left that is specific
 * to Android is the cache directory.
 *
 * `src/fetcher/fetcher.ts` derives that directory once, at module scope
 * (`const IS_ANDROID = Platform.OS === 'android'`), so exercising the Android
 * branch means re-importing the module with a different `Platform`. That also
 * re-instantiates the blob-util mock, so every handle used here has to come from
 * the same fresh module registry — hence the `load()` helper rather than the
 * file-level imports the other fetcher suites use.
 */
import type { Route } from '../support/blobUtilMock';

const URL_A = 'https://huggingface.co/software-mansion/model/resolve/v1/model.pte';
const HF_COUNTER = 'https://huggingface.co/software-mansion/model/resolve/main/config.json';

type Android = {
  download: typeof import('../../src/fetcher/fetcher').download;
  serve: (url: string, route?: Route) => void;
  requests: () => readonly { method: string; url: string; headers: Record<string, string> }[];
  paths: () => string[];
  readText: (path: string) => string | undefined;
  write: (path: string, contents: string) => void;
  remove: (path: string) => void;
  has: (path: string) => boolean;
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
    requests: blobUtil.fakeNet.requests,
    paths: blobUtil.fakeFs.paths,
    readText: blobUtil.fakeFs.readText,
    write: blobUtil.fakeFs.write,
    remove: blobUtil.fakeFs.remove,
    has: blobUtil.fakeFs.has,
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

  it('resumes from a partial file with a Range request, like iOS', async () => {
    const android = await load();
    android.serve(URL_A, { body: 'abcdefgh' });

    // Stage the aftermath of an interrupted download: the cached file is gone
    // and `partial` bytes sit next to it. DownloadManager never resumed through
    // a Range request, so this is what proves the shared backend is in use.
    const path = await android.download(URL_A);
    android.remove(path);
    android.write(`${path}.partial`, 'abc');
    const before = android.requests().length;

    await android.download(URL_A);

    const ranged = android
      .requests()
      .slice(before)
      .find((r) => r.headers.Range !== undefined);
    expect(ranged?.headers.Range).toBe('bytes=3-');
    expect(android.readText(path)).toBe('abcdefgh');
    expect(android.has(`${path}.partial`)).toBe(false);
  });

  it('leaves no temporary files behind on success', async () => {
    const android = await load();
    android.serve(URL_A);

    await android.download(URL_A);

    expect(android.paths().filter((p) => /\.(partial|chunk|downloading)$/.test(p))).toEqual([]);
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
