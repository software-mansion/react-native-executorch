import { renderHook, waitFor } from '@testing-library/react-native';

import { useResourceDownload } from '../../src/hooks/useResourceDownload';
import { setTelemetryEnabled } from '../../src/fetcher/telemetry';
import { deferred, fakeFs, fakeNet } from '../support/blobUtilMock';

const MODEL_URL = 'https://huggingface.co/software-mansion/model/resolve/v1/model.pte';
const TOKENIZER_URL = 'https://huggingface.co/software-mansion/model/resolve/v1/tokenizer.json';
const HF_COUNTER = 'https://huggingface.co/software-mansion/model/resolve/main/config.json';

const cachedPath = (basename: string): string | undefined =>
  fakeFs.paths().find((p) => p.endsWith(`_${basename}`));

beforeEach(() => {
  setTelemetryEnabled(false);
  fakeNet.serve(HF_COUNTER);
});

afterEach(() => {
  setTelemetryEnabled(true);
});

describe('useResourceDownload', () => {
  it('starts with no resource and zero progress', async () => {
    fakeNet.serve(MODEL_URL, { gate: deferred().promise });

    const { result } = await renderHook(() => useResourceDownload(MODEL_URL));

    expect(result.current).toEqual({
      resource: undefined,
      downloadProgress: 0,
      downloadError: undefined,
    });
  });

  it('resolves a local path without touching the network', async () => {
    const { result } = await renderHook(() => useResourceDownload('/local/model.pte'));

    await waitFor(() => expect(result.current.resource).toBe('/local/model.pte'));
    expect(result.current.downloadProgress).toBe(100);
    expect(fakeNet.requests()).toHaveLength(0);
  });

  it('resolves a whole config, replacing only the remote leaves', async () => {
    fakeNet.serve(MODEL_URL);
    fakeNet.serve(TOKENIZER_URL);
    const config = {
      modelPath: MODEL_URL,
      tokenizerPath: TOKENIZER_URL,
      modelOpts: { labels: ['a', 'b'] },
    };

    const { result } = await renderHook(() => useResourceDownload(config));

    await waitFor(() => expect(result.current.resource).toBeDefined());
    expect(result.current.resource).toEqual({
      modelPath: cachedPath('model.pte'),
      tokenizerPath: cachedPath('tokenizer.json'),
      modelOpts: { labels: ['a', 'b'] },
    });
  });

  it('reports 100 once every file has arrived', async () => {
    fakeNet.serve(MODEL_URL);

    const { result } = await renderHook(() => useResourceDownload(MODEL_URL));

    await waitFor(() => expect(result.current.downloadProgress).toBe(100));
  });

  it('surfaces a download failure and leaves the resource unset', async () => {
    fakeNet.serve(MODEL_URL, { status: 404 });

    const { result } = await renderHook(() => useResourceDownload(MODEL_URL));

    await waitFor(() => expect(result.current.downloadError).not.toBeNull());
    expect(result.current.downloadError?.message).toMatch(/HTTP status 404/);
    expect(result.current.resource).toBeUndefined();
  });

  it('downloads nothing while preventLoad is set', async () => {
    fakeNet.serve(MODEL_URL);

    const { result } = await renderHook(() =>
      useResourceDownload(MODEL_URL, { preventLoad: true })
    );

    expect(result.current.resource).toBeUndefined();
    expect(fakeNet.countRequests('GET', MODEL_URL)).toBe(0);
  });

  it('starts downloading once preventLoad is lifted', async () => {
    fakeNet.serve(MODEL_URL);
    const { result, rerender } = await renderHook(
      ({ preventLoad }: { preventLoad: boolean }) =>
        useResourceDownload(MODEL_URL, { preventLoad }),
      { initialProps: { preventLoad: true } }
    );

    await rerender({ preventLoad: false });

    await waitFor(() => expect(result.current.resource).toBe(cachedPath('model.pte')));
  });

  it('resets its state when preventLoad is switched back on', async () => {
    fakeNet.serve(MODEL_URL);
    const { result, rerender } = await renderHook(
      ({ preventLoad }: { preventLoad: boolean }) =>
        useResourceDownload(MODEL_URL, { preventLoad }),
      { initialProps: { preventLoad: false } }
    );
    await waitFor(() => expect(result.current.resource).toBeDefined());

    await rerender({ preventLoad: true });

    expect(result.current.resource).toBeUndefined();
    expect(result.current.downloadProgress).toBe(0);
  });

  it('keys the config by value, so an equal inline object does not re-download', async () => {
    fakeNet.serve(MODEL_URL);
    const { result, rerender } = await renderHook(
      ({ config }: { config: { modelPath: string } }) => useResourceDownload(config),
      { initialProps: { config: { modelPath: MODEL_URL } } }
    );
    await waitFor(() => expect(result.current.resource).toBeDefined());
    const resolved = result.current.resource;

    await rerender({ config: { modelPath: MODEL_URL } });

    expect(result.current.resource).toBe(resolved);
  });

  it('re-resolves when the config actually changes', async () => {
    fakeNet.serve(MODEL_URL);
    fakeNet.serve(TOKENIZER_URL);
    const { result, rerender } = await renderHook(
      ({ url }: { url: string }) => useResourceDownload(url),
      { initialProps: { url: MODEL_URL } }
    );
    await waitFor(() => expect(result.current.resource).toBe(cachedPath('model.pte')));

    await rerender({ url: TOKENIZER_URL });

    await waitFor(() => expect(result.current.resource).toBe(cachedPath('tokenizer.json')));
  });

  it('does not report an error after being unmounted mid-download', async () => {
    const gate = deferred();
    fakeNet.serve(MODEL_URL, { gate: gate.promise, status: 500 });
    const { unmount } = await renderHook(() => useResourceDownload(MODEL_URL));

    await unmount();
    gate.resolve();

    // An update after unmount would warn or throw; getting here quietly is the
    // assertion. A tick lets the aborted download settle first.
    await new Promise((resolve) => setImmediate(resolve));
  });

  it('re-downloads when forceDownload is set', async () => {
    fakeNet.serve(MODEL_URL, { body: 'v1' });
    const { result, rerender } = await renderHook(
      ({ force }: { force: boolean }) => useResourceDownload(MODEL_URL, { forceDownload: force }),
      { initialProps: { force: false } }
    );
    await waitFor(() => expect(result.current.resource).toBeDefined());

    fakeNet.serve(MODEL_URL, { body: 'v2' });
    await rerender({ force: true });
    await waitFor(() => expect(fakeNet.countRequests('GET', MODEL_URL)).toBe(2));

    expect(fakeFs.readText(cachedPath('model.pte')!)).toBe('v2');
  });
});
