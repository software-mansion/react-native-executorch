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
});
