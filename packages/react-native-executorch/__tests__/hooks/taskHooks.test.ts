/**
 * The path an app actually takes: a `use<Task>` hook resolving a remote config,
 * loading the pipeline, exposing its methods, and releasing native memory on
 * unmount.
 */
import { renderHook, waitFor } from '@testing-library/react-native';

import { f32, method } from '../../src/core/schema';
import { setTelemetryEnabled } from '../../src/fetcher/telemetry';
import { useClassifier } from '../../src/hooks/useClassifier';
import { useTokenizer } from '../../src/hooks/useTokenizer';
import { deferred, fakeNet } from '../support/blobUtilMock';
import { cachePathFor } from '../support/cachePath';
import { fakeJsi } from '../support/fakeJsi';
import { STRETCH_PREPROCESSING, exported, imageBuffer, writesOutputs } from '../support/fixtures';

const MODEL_URL = 'https://huggingface.co/software-mansion/model/resolve/v1/model.pte';
const TOKENIZER_URL = 'https://huggingface.co/software-mansion/model/resolve/v1/tokenizer.json';
const HF_COUNTER = 'https://huggingface.co/software-mansion/model/resolve/main/config.json';

const LABELS = ['cat', 'dog'] as const;
const config = { modelPath: MODEL_URL, modelOpts: { ...STRETCH_PREPROCESSING, labels: LABELS } };

/**
 * A hook downloads and loads in one uninterrupted pass, so the fake program has
 * to sit at its final cache path before the hook renders.
 */
const registerModelAtCachePath = (outputs = [f32(1, 2)]) =>
  fakeJsi.registerModel(cachePathFor(MODEL_URL), {
    schema: exported(method('forward', [f32(1, 3, 4, 4)], outputs)),
    execute: writesOutputs([0, 5]),
  });

beforeEach(() => {
  setTelemetryEnabled(false);
  fakeNet.serve(HF_COUNTER);
  fakeNet.serve(MODEL_URL);
  fakeNet.serve(TOKENIZER_URL);
});

afterEach(() => {
  setTelemetryEnabled(true);
});

describe('useClassifier', () => {
  it('downloads the model to the path the pipeline then loads from', async () => {
    // Guards the duplicated derivation in `support/cachePath.ts`.
    registerModelAtCachePath();
    const { result } = await renderHook(() => useClassifier(config));

    await waitFor(() => expect(result.current.resource).toBeDefined());

    expect(result.current.resource?.modelPath).toBe(cachePathFor(MODEL_URL));
  });

  it('reports not-ready while the download is still in flight', async () => {
    registerModelAtCachePath();
    const gate = deferred();
    fakeNet.serve(MODEL_URL, { gate: gate.promise });

    const { result } = await renderHook(() => useClassifier(config));

    expect(result.current.isReady).toBe(false);
    expect(result.current.classify).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    gate.resolve();
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.classify).toBeInstanceOf(Function);
    expect(result.current.classifyWorklet).toBeInstanceOf(Function);
  });

  it('exposes the labels from the config before anything has loaded', async () => {
    fakeNet.serve(MODEL_URL, { gate: deferred().promise });

    const { result } = await renderHook(() => useClassifier(config));

    expect(result.current.isReady).toBe(false);
    expect(result.current.labels).toBe(LABELS);
  });

  it('runs inference through the hook-provided method', async () => {
    registerModelAtCachePath();
    const { result } = await renderHook(() => useClassifier(config));
    await waitFor(() => expect(result.current.isReady).toBe(true));

    const results = await result.current.classify!(imageBuffer(8, 8));

    expect(results.map((r) => r.label)).toEqual(['dog', 'cat']);
  });

  it('releases every native resource on unmount', async () => {
    registerModelAtCachePath();
    const { result, unmount } = await renderHook(() => useClassifier(config));
    await waitFor(() => expect(result.current.isReady).toBe(true));

    await unmount();

    expect(fakeJsi.liveTensors()).toBe(0);
    expect(fakeJsi.liveModels()).toEqual([]);
  });

  it('surfaces a download failure through the shared error field', async () => {
    fakeNet.serve(MODEL_URL, { status: 403 });

    const { result } = await renderHook(() => useClassifier(config));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toMatch(/HTTP status 403/);
    expect(result.current.isReady).toBe(false);
  });

  it('surfaces a model-compilation failure through the same error field', async () => {
    // A model whose output dimension does not match the two configured labels.
    registerModelAtCachePath([f32(1, 9)]);

    const { result } = await renderHook(() => useClassifier(config));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toMatch(/labels length \(2\)/);
    expect(result.current.isReady).toBe(false);

    // The hook never receives a `dispose` for a pipeline that failed to build,
    // so the factory has to have released the model itself. `useModel` re-runs
    // the factory on every config change, which is what makes this the
    // app-level shape of `tasks/constructionFailure.test.ts`.
    expect(fakeJsi.liveModels()).toEqual([]);
  });

  it('loads nothing while preventLoad is set', async () => {
    registerModelAtCachePath();
    const { result } = await renderHook(() => useClassifier(config, { preventLoad: true }));

    expect(result.current.isReady).toBe(false);
    expect(fakeNet.countRequests('GET', MODEL_URL)).toBe(0);
  });

  it('rebuilds the pipeline when the config changes, releasing the old one', async () => {
    const otherUrl = MODEL_URL.replace('model.pte', 'other.pte');
    fakeNet.serve(otherUrl);
    registerModelAtCachePath();
    fakeJsi.registerModel(cachePathFor(otherUrl), {
      schema: exported(method('forward', [f32(1, 3, 4, 4)], [f32(1, 2)])),
    });

    const { result, rerender } = await renderHook(
      ({ modelPath }: { modelPath: string }) => useClassifier({ ...config, modelPath }),
      { initialProps: { modelPath: MODEL_URL } }
    );
    await waitFor(() => expect(result.current.isReady).toBe(true));

    await rerender({ modelPath: otherUrl });
    await waitFor(() => expect(result.current.resource?.modelPath).toBe(cachePathFor(otherUrl)));

    expect(fakeJsi.liveModels()).toEqual([cachePathFor(otherUrl)]);
  });
});

describe('useTokenizer', () => {
  const registerTokenizer = () =>
    fakeJsi.registerTokenizer(cachePathFor(TOKENIZER_URL), { tokens: ['hello', 'world'] });

  it('resolves a remote tokenizer and exposes its operations', async () => {
    registerTokenizer();
    const { result } = await renderHook(() => useTokenizer(TOKENIZER_URL));

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(await result.current.encode!('hello world')).toEqual(Int32Array.from([0, 1]));
    expect(result.current.getVocabSize!()).toBe(2);
  });

  it('releases the native tokenizer on unmount', async () => {
    registerTokenizer();
    const { result, unmount } = await renderHook(() => useTokenizer(TOKENIZER_URL));
    await waitFor(() => expect(result.current.isReady).toBe(true));

    await unmount();

    expect(fakeJsi.liveTokenizers()).toEqual([]);
  });
});

describe('use<Task> hooks — shared contract', () => {
  it('returns the loading fields every app relies on', async () => {
    const { result } = await renderHook(() => useClassifier(config, { preventLoad: true }));

    expect(result.current).toMatchObject({
      isReady: expect.any(Boolean),
      error: undefined,
      downloadProgress: expect.any(Number),
    });
    expect('resource' in result.current).toBe(true);
  });
});
