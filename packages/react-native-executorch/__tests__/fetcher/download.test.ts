import { isRnExecuTorchError } from '../../src/core/error';
import { download } from '../../src/fetcher/fetcher';
import { setTelemetryEnabled } from '../../src/fetcher/telemetry';
import { until } from '../support/async';
import { deferred, fakeFs, fakeNet } from '../support/blobUtilMock';

// The cache path is derived from a djb2 hash of the URL, so tests locate files
// by suffix rather than by recomputing the hash.
const cachedPath = (basename: string): string | undefined =>
  fakeFs.paths().find((p) => p.endsWith(`_${basename}`));

const URL_A = 'https://huggingface.co/software-mansion/model/resolve/v1/model.pte';
const URL_B = 'https://huggingface.co/software-mansion/model/resolve/v1/tokenizer.json';
// The Hugging Face download counter fires for every SWM repo regardless of the
// telemetry opt-out, so it needs a route or `fakeNet` reports it as unhandled.
const HF_COUNTER = 'https://huggingface.co/software-mansion/model/resolve/main/config.json';

/**
 * Waits until the download of `url` has actually issued its GET.
 */
const untilFetching = (url: string, count = 1) =>
  until(() => fakeNet.countRequests('GET', url) >= count, `the GET for ${url}`);

beforeEach(() => {
  // Analytics have their own suite; keeping them off here means an unregistered
  // endpoint cannot fail an unrelated download test.
  setTelemetryEnabled(false);
  fakeNet.serve(HF_COUNTER);
});

afterEach(() => {
  setTelemetryEnabled(true);
});

describe('download — resolution', () => {
  it('passes a local path through untouched and reports completion', async () => {
    const onProgress = jest.fn();
    await expect(download('/local/model.pte', { onProgress })).resolves.toBe('/local/model.pte');
    expect(onProgress).toHaveBeenCalledWith(1);
    expect(fakeNet.requests()).toHaveLength(0);
  });

  it('downloads a remote URL and resolves with its local path', async () => {
    fakeNet.serve(URL_A, { body: 'model-bytes' });

    const path = await download(URL_A);

    expect(path).toBe(cachedPath('model.pte'));
    expect(fakeFs.readText(path)).toBe('model-bytes');
  });

  it('walks a nested config, replacing only the remote leaves', async () => {
    fakeNet.serve(URL_A);
    fakeNet.serve(URL_B);

    const config = {
      modelPath: URL_A,
      tokenizerPath: URL_B,
      localPath: '/already/local.pte',
      modelOpts: { labels: ['cat', 'dog'], normalizeOpts: { alpha: 0.5 } },
    };

    const resolved = await download(config);

    expect(resolved.modelPath).toBe(cachedPath('model.pte'));
    expect(resolved.tokenizerPath).toBe(cachedPath('tokenizer.json'));
    expect(resolved.localPath).toBe('/already/local.pte');
    expect(resolved.modelOpts).toEqual(config.modelOpts);
  });

  it('returns the original object identity when nothing needed downloading', async () => {
    const config = { modelPath: '/local/model.pte', modelOpts: { labels: ['a'] } };
    const resolved = await download(config);
    expect(resolved).toBe(config);
  });

  it('keeps untouched sub-objects referentially stable', async () => {
    fakeNet.serve(URL_A);
    const config = { modelPath: URL_A, modelOpts: { labels: ['a'] } };

    const resolved = await download(config);

    expect(resolved).not.toBe(config);
    expect(resolved.modelOpts).toBe(config.modelOpts);
  });

  it('resolves arrays of URLs', async () => {
    fakeNet.serve(URL_A);
    fakeNet.serve(URL_B);

    const resolved = await download([URL_A, URL_B, '/local.pte']);

    expect(resolved).toEqual([cachedPath('model.pte'), cachedPath('tokenizer.json'), '/local.pte']);
  });

  it('fetches a URL repeated across fields only once', async () => {
    fakeNet.serve(URL_A);

    const resolved = await download({ a: URL_A, b: URL_A });

    expect(resolved.a).toBe(resolved.b);
    expect(fakeNet.countRequests('GET', URL_A)).toBe(1);
  });

  it('leaves non-http strings alone', async () => {
    const resolved = await download({ scheme: 'ftp://example.com/model.pte', name: 'whisper' });
    expect(resolved).toEqual({ scheme: 'ftp://example.com/model.pte', name: 'whisper' });
  });
});

describe('download — caching', () => {
  it('serves a second call from the cache without a request', async () => {
    fakeNet.serve(URL_A);

    const first = await download(URL_A);
    const requestsAfterFirst = fakeNet.countRequests('GET', URL_A);
    const second = await download(URL_A);

    expect(second).toBe(first);
    expect(fakeNet.countRequests('GET', URL_A)).toBe(requestsAfterFirst);
  });

  it('reports full progress immediately on a cache hit', async () => {
    fakeNet.serve(URL_A);
    await download(URL_A);

    const onProgress = jest.fn();
    await download(URL_A, { onProgress });

    expect(onProgress).toHaveBeenLastCalledWith(1);
  });

  it('re-downloads and replaces the cached copy when forceDownload is set', async () => {
    fakeNet.serve(URL_A, { body: 'v1' });
    const path = await download(URL_A);
    expect(fakeFs.readText(path)).toBe('v1');

    fakeNet.serve(URL_A, { body: 'v2-longer' });
    await download(URL_A, { forceDownload: true });

    expect(fakeFs.readText(path)).toBe('v2-longer');
    expect(fakeNet.countRequests('GET', URL_A)).toBe(2);
  });
});

describe('download — progress', () => {
  it('weights progress by byte size across several files', async () => {
    fakeNet.serve(URL_A, { body: 'a'.repeat(90) });
    fakeNet.serve(URL_B, { body: 'b'.repeat(10) });

    const seen: number[] = [];
    await download({ model: URL_A, tokenizer: URL_B }, { onProgress: (p) => seen.push(p) });

    // Every report is a valid fraction, monotonically bounded, ending at 1.
    expect(seen.every((p) => p >= 0 && p <= 1)).toBe(true);
    expect(seen.at(-1)).toBe(1);
    // The 10-byte file finishing on its own can never carry progress past 10%.
    expect(Math.max(...seen.filter((p) => p < 1))).toBeLessThan(1);
  });

  it('falls back to equal weighting when a content length is unavailable', async () => {
    fakeNet.serve(URL_A, { headOk: false });
    fakeNet.serve(URL_B);

    const seen: number[] = [];
    await download([URL_A, URL_B], { onProgress: (p) => seen.push(p) });

    expect(seen.at(-1)).toBe(1);
  });

  it('never reports a fraction above 1', async () => {
    fakeNet.serve(URL_A, { body: 'a'.repeat(4) });

    const seen: number[] = [];
    await download(URL_A, { onProgress: (p) => seen.push(p) });

    expect(Math.max(...seen)).toBe(1);
  });
});

describe('download — failure handling', () => {
  it('rejects on an HTTP error status', async () => {
    fakeNet.serve(URL_A, { status: 404 });
    await expect(download(URL_A)).rejects.toThrow(/HTTP status 404/);
  });

  it('leaves no cached file behind after a failed download', async () => {
    fakeNet.serve(URL_A, { status: 500 });
    await expect(download(URL_A)).rejects.toThrow();
    expect(cachedPath('model.pte')).toBeUndefined();
  });

  it('propagates a transport error', async () => {
    fakeNet.serve(URL_A, { error: new Error('network unreachable') });
    await expect(download(URL_A)).rejects.toThrow('network unreachable');
  });

  it('retries a failed URL on the next call rather than caching the failure', async () => {
    fakeNet.serve(URL_A, { status: 500 });
    await expect(download(URL_A)).rejects.toThrow();

    fakeNet.serve(URL_A, { body: 'recovered' });
    const path = await download(URL_A);
    expect(fakeFs.readText(path)).toBe('recovered');
  });
});

describe('download — completeness check', () => {
  it('rejects a body shorter than the advertised length', async () => {
    // The check exists so a truncated `.pte` cannot be promoted into the cache,
    // where the existence-only hit check would serve it forever and the failure
    // would only surface much later, at load.
    fakeNet.serve(URL_A, { body: 'short', headLength: 4096 });
    await expect(download(URL_A)).rejects.toThrow(/incomplete/);
    expect(cachedPath('model.pte')).toBeUndefined();
  });

  it('accepts a body longer than the advertised length', async () => {
    // No transfer can produce more bytes than the resource holds, so an
    // over-long result disproves the expectation rather than the transfer.
    // Observed in the wild: a HEAD against a signed Xet CDN URL answered 26 for
    // a 1,835,532-byte model, and every retry answered the same, so a complete
    // and valid file was rejected three times out of three.
    const whole = 'the-whole-file-'.repeat(8); // 120 bytes against an advertised 26
    fakeNet.serve(URL_A, { body: whole, headLength: 26 });

    const path = await download(URL_A);

    expect(fakeFs.readText(path)).toBe(whole);
  });

  it('skips the check when the server will not give a length', async () => {
    fakeNet.serve(URL_A, { body: 'model-bytes', headOk: false });

    const path = await download(URL_A);

    expect(path).toBe(cachedPath('model.pte'));
    expect(fakeFs.readText(path)).toBe('model-bytes');
  });

  it('believes x-linked-size over a content-length describing the redirect', async () => {
    // Hugging Face answers a model URL with a 302 to a CDN and reports the
    // object's real size in `x-linked-size` on every hop; `content-length` on
    // the redirect hop describes the redirect body instead. Reading the wrong
    // one is what makes a complete file look over-long.
    fakeNet.serve(URL_A, { body: 'a'.repeat(64), headLength: 1082, linkedSize: 64 });

    const path = await download(URL_A);

    expect(fakeFs.readText(path)).toBe('a'.repeat(64));
  });

  it('still rejects a short body when x-linked-size is the header in play', async () => {
    fakeNet.serve(URL_A, { body: 'short', headLength: 1082, linkedSize: 4096 });
    await expect(download(URL_A)).rejects.toThrow(/incomplete/);
  });
});

describe('download — cancellation', () => {
  it('rejects with DOWNLOAD_ABORTED when the signal is already aborted', async () => {
    fakeNet.serve(URL_A);
    const controller = new AbortController();
    controller.abort();

    const rejection = await download(URL_A, { signal: controller.signal }).catch((e) => e);
    expect(isRnExecuTorchError(rejection, 'DOWNLOAD_ABORTED')).toBe(true);
  });

  it('rejects with DOWNLOAD_ABORTED when aborted mid-flight', async () => {
    const gate = deferred();
    fakeNet.serve(URL_A, { gate: gate.promise });

    const controller = new AbortController();
    const rejection = download(URL_A, { signal: controller.signal }).catch((e) => e);

    await untilFetching(URL_A);
    controller.abort();
    gate.resolve();

    expect(isRnExecuTorchError(await rejection, 'DOWNLOAD_ABORTED')).toBe(true);
    expect(cachedPath('model.pte')).toBeUndefined();
  });

  it('rejects before issuing a request when aborted during the size probe', async () => {
    fakeNet.serve(URL_A);

    const controller = new AbortController();
    const rejection = download(URL_A, { signal: controller.signal }).catch((e) => e);
    controller.abort();

    expect(isRnExecuTorchError(await rejection, 'DOWNLOAD_ABORTED')).toBe(true);
    expect(fakeNet.countRequests('GET', URL_A)).toBe(0);
  });
});

describe('download — concurrent callers', () => {
  it('shares one request between callers that ask for the same URL', async () => {
    const gate = deferred();
    fakeNet.serve(URL_A, { gate: gate.promise });

    const first = download(URL_A);
    const second = download(URL_A);
    gate.resolve();

    expect(await first).toBe(await second);
    expect(fakeNet.countRequests('GET', URL_A)).toBe(1);
  });

  it('fans progress out to every joined caller', async () => {
    const gate = deferred();
    fakeNet.serve(URL_A, { gate: gate.promise });

    const firstProgress = jest.fn();
    const secondProgress = jest.fn();
    const first = download(URL_A, { onProgress: firstProgress });
    const second = download(URL_A, { onProgress: secondProgress });
    gate.resolve();
    await Promise.all([first, second]);

    expect(firstProgress).toHaveBeenLastCalledWith(1);
    expect(secondProgress).toHaveBeenLastCalledWith(1);
  });

  it('keeps the shared request alive when only one caller aborts', async () => {
    const gate = deferred();
    fakeNet.serve(URL_A, { gate: gate.promise });

    const controller = new AbortController();
    const leavingRejection = download(URL_A, { signal: controller.signal }).catch((e) => e);
    const staying = download(URL_A);

    await untilFetching(URL_A);
    controller.abort();
    gate.resolve();

    expect(isRnExecuTorchError(await leavingRejection, 'DOWNLOAD_ABORTED')).toBe(true);
    expect(await staying).toBe(cachedPath('model.pte'));
    expect(fakeNet.countRequests('GET', URL_A)).toBe(1);
  });

  it('starts a fresh request after a shared one was fully abandoned', async () => {
    const gate = deferred();
    fakeNet.serve(URL_A, { gate: gate.promise });

    const controller = new AbortController();
    const abandoned = download(URL_A, { signal: controller.signal }).catch((e) => e);
    await untilFetching(URL_A);
    controller.abort();
    gate.resolve();
    expect(isRnExecuTorchError(await abandoned, 'DOWNLOAD_ABORTED')).toBe(true);

    fakeNet.serve(URL_A, { body: 'second attempt' });
    const path = await download(URL_A);
    expect(fakeFs.readText(path)).toBe('second attempt');
    expect(fakeNet.countRequests('GET', URL_A)).toBe(2);
  });
});

describe('download — iOS resume', () => {
  /**
   * Stages the aftermath of an interrupted download: the cached file is gone
   * and `partial` bytes are sitting next to it. The cache path is only known
   * after one successful download, so it is learned and then undone.
   */
  const stagePartial = async (partial: string): Promise<string> => {
    const path = await download(URL_A);
    fakeFs.remove(path);
    fakeFs.write(`${path}.partial`, partial);
    return path;
  };

  it('resumes from a partial file with a Range request', async () => {
    fakeNet.serve(URL_A, { body: 'abcdefgh' });
    const path = await stagePartial('abc');
    const before = fakeNet.requests().length;

    await download(URL_A);

    const ranged = fakeNet
      .requests()
      .slice(before)
      .find((r) => r.headers.Range !== undefined);
    expect(ranged?.headers.Range).toBe('bytes=3-');
    expect(fakeFs.readText(path)).toBe('abcdefgh');
    expect(fakeFs.has(`${path}.partial`)).toBe(false);
  });

  it('replaces the partial when the server ignores the Range header', async () => {
    fakeNet.serve(URL_A, { body: 'abcdefgh', supportsRange: false });
    const path = await stagePartial('XX');

    await download(URL_A);

    expect(fakeFs.readText(path)).toBe('abcdefgh');
  });

  it('treats a 416 as "the partial already holds everything"', async () => {
    fakeNet.serve(URL_A, { body: 'abcd' });
    const path = await stagePartial('abcd');

    await download(URL_A);

    expect(fakeFs.readText(path)).toBe('abcd');
  });

  it('leaves no temporary files behind on success', async () => {
    fakeNet.serve(URL_A);
    fakeNet.serve(URL_B);
    await download([URL_A, URL_B]);

    expect(fakeFs.paths().filter((p) => /\.(partial|chunk|downloading)$/.test(p))).toEqual([]);
  });
});
