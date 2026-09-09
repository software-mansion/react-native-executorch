import { defaultWorkletRuntime, wrapAsync } from '../../src/core/runtime';

describe('wrapAsync', () => {
  it('forwards every argument and resolves with the return value', async () => {
    const fn = jest.fn((a: number, b: string) => `${a}-${b}`);
    await expect(wrapAsync(fn)(7, 'x')).resolves.toBe('7-x');
    expect(fn).toHaveBeenCalledWith(7, 'x');
  });

  it('returns a promise even for a synchronous function', () => {
    expect(wrapAsync(() => 1)()).toBeInstanceOf(Promise);
  });

  it('rejects with an Error carrying the original message', async () => {
    const boom = () => {
      throw new Error('model failed to load');
    };
    await expect(wrapAsync(boom)()).rejects.toThrow('model failed to load');
  });

  it('rejects with an Error even when a non-Error was thrown', async () => {
    const boom = () => {
      throw 'plain string failure';
    };
    const rejection = await wrapAsync(boom)().catch((e) => e);
    expect(rejection).toBeInstanceOf(Error);
    expect(rejection.message).toBe('plain string failure');
  });

  it('runs on the default runtime when none is given', () => {
    expect(defaultWorkletRuntime).toBeDefined();
  });

  it('accepts an explicit runtime', async () => {
    const runtime = { name: 'custom' } as never;
    await expect(wrapAsync(() => 'ok', runtime)()).resolves.toBe('ok');
  });

  // worklets < 0.10.0 rebuilds an ArrayBufferView over its whole backing
  // buffer, so a window into a larger one arrives silently widened. wrapAsync
  // tightens both directions first — see src/core/serialization.ts.
  it('tightens an offset view before it reaches the worklet', async () => {
    const recording = new Float32Array(1024);
    recording.fill(0.25, 256, 260);
    const window = recording.subarray(256, 260);

    const seen = jest.fn((view: Float32Array) => view.length);
    await expect(wrapAsync(seen)(window)).resolves.toBe(4);

    const received = seen.mock.calls[0]![0];
    expect(received.length).toBe(4);
    expect(received.byteOffset).toBe(0);
    expect([...received]).toEqual([0.25, 0.25, 0.25, 0.25]);
  });

  it('tightens an offset view on the way back', async () => {
    const audio = new Float32Array(512);
    audio.fill(1, 0, 8);

    const trimmed = await wrapAsync(() => audio.subarray(0, 8))();

    expect(trimmed.length).toBe(8);
    expect(trimmed.buffer.byteLength).toBe(8 * Float32Array.BYTES_PER_ELEMENT);
  });

  it('leaves a tight view alone in both directions', async () => {
    const tight = new Uint8Array(16);
    const echo = jest.fn((view: Uint8Array) => view);

    const returned = await wrapAsync(echo)(tight);

    expect(echo.mock.calls[0]![0]).toBe(tight);
    expect(returned).toBe(tight);
  });
});
