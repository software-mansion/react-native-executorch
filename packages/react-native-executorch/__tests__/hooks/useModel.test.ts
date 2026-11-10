import type { DataLoader } from '../../src/core/model';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useModel } from '../../src/hooks/useModel';
import { deferred } from '../support/blobUtilMock';

type Instance = { dispose: jest.Mock; id: string };

/**
 * A factory returning a fresh disposable per call, recording every instance.
 */
const factoryOf = (instances: Instance[]) =>
  jest.fn(async (config: { id: string }) => {
    const instance = { dispose: jest.fn(), id: config.id };
    instances.push(instance);
    return instance;
  });

describe('useModel', () => {
  it('does not rebuild when only reader function identity changes', async () => {
    const reader = (): DataLoader => ({ size: () => 0, load: () => new ArrayBuffer(0) });
    const first = reader();
    const second = reader();
    const factory = jest.fn(async ({ modelSource }: { modelSource: DataLoader }) => ({
      modelSource,
      dispose: jest.fn(),
    }));
    const { result, rerender, unmount } = await renderHook(
      ({ loader }: { loader: DataLoader }) => useModel(factory, { modelSource: loader }),
      { initialProps: { loader: first } }
    );
    await waitFor(() => expect(result.current.model?.modelSource).toBe(first));
    const previous = result.current.model!;

    await rerender({ loader: first });
    expect(factory).toHaveBeenCalledTimes(1);

    await rerender({ loader: second });
    expect(factory).toHaveBeenCalledTimes(1);
    expect(result.current.model).toBe(previous);
    expect(previous.dispose).not.toHaveBeenCalled();

    await unmount();
    expect(previous.dispose).toHaveBeenCalledTimes(1);
  });

  it('starts with no model and no error', async () => {
    const { result } = await renderHook(() => useModel(factoryOf([]), undefined));
    expect(result.current).toEqual({ model: undefined, error: undefined });
  });

  it('exposes the instance once the factory resolves', async () => {
    const instances: Instance[] = [];
    const { result } = await renderHook(() => useModel(factoryOf(instances), { id: 'a' }));

    await waitFor(() => expect(result.current.model).toBeDefined());
    expect(result.current.model).toBe(instances[0]);
  });

  it('does not create anything for an undefined config', async () => {
    const factory = factoryOf([]);
    await renderHook(() => useModel(factory, undefined));
    expect(factory).not.toHaveBeenCalled();
  });

  it('disposes the instance on unmount', async () => {
    const instances: Instance[] = [];
    const { result, unmount } = await renderHook(() => useModel(factoryOf(instances), { id: 'a' }));
    await waitFor(() => expect(result.current.model).toBeDefined());

    await unmount();

    expect(instances[0]!.dispose).toHaveBeenCalledTimes(1);
  });

  it('disposes the previous instance when the config changes', async () => {
    const instances: Instance[] = [];
    const factory = factoryOf(instances);
    const { result, rerender } = await renderHook(
      ({ config }: { config: { id: string } }) => useModel(factory, config),
      { initialProps: { config: { id: 'a' } } }
    );
    await waitFor(() => expect(result.current.model).toBeDefined());

    await rerender({ config: { id: 'b' } });
    await waitFor(() => expect(result.current.model?.id).toBe('b'));

    expect(instances[0]!.dispose).toHaveBeenCalledTimes(1);
    expect(instances[1]!.dispose).not.toHaveBeenCalled();
  });

  it('keys the config by value, so an equal inline object does not rebuild', async () => {
    const instances: Instance[] = [];
    const factory = factoryOf(instances);
    const { result, rerender } = await renderHook(
      ({ config }: { config: { id: string } }) => useModel(factory, config),
      { initialProps: { config: { id: 'a' } } }
    );
    await waitFor(() => expect(result.current.model).toBeDefined());

    // A new object with identical contents — the common case for an inline
    // config literal being re-created on every render.
    await rerender({ config: { id: 'a' } });

    expect(factory).toHaveBeenCalledTimes(1);
    expect(instances).toHaveLength(1);
  });

  it('disposes an instance that arrives after unmount', async () => {
    const gate = deferred();
    const instance = { dispose: jest.fn(), id: 'late' };
    const factory = jest.fn(async () => {
      await gate.promise;
      return instance;
    });

    const { unmount } = await renderHook(() => useModel(factory, { id: 'late' }));
    await unmount();
    await act(async () => {
      gate.resolve();
      await gate.promise;
    });

    // Nothing holds a reference to it any more, so the hook has to release it.
    expect(instance.dispose).toHaveBeenCalledTimes(1);
  });

  it('surfaces a factory rejection as an Error', async () => {
    const factory = jest.fn(async () => {
      throw new Error('spec mismatch');
    });

    const { result } = await renderHook(() => useModel(factory, { id: 'a' }));

    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.error?.message).toBe('spec mismatch');
    expect(result.current.model).toBeUndefined();
  });

  it('wraps a non-Error rejection in an Error', async () => {
    const factory = jest.fn(async () => {
      throw 'plain failure';
    });

    const { result } = await renderHook(() => useModel(factory, { id: 'a' }));

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.error?.message).toBe('plain failure');
  });

  it('clears a previous error when the config changes', async () => {
    let shouldFail = true;
    const factory = jest.fn(async (config: { id: string }) => {
      if (shouldFail) throw new Error('spec mismatch');
      return { dispose: jest.fn(), id: config.id };
    });

    const { result, rerender } = await renderHook(
      ({ config }: { config: { id: string } }) => useModel(factory, config),
      { initialProps: { config: { id: 'bad' } } }
    );
    await waitFor(() => expect(result.current.error).toBeDefined());

    shouldFail = false;
    await rerender({ config: { id: 'good' } });

    await waitFor(() => expect(result.current.model).toBeDefined());
    expect(result.current.error).toBeUndefined();
  });

  it('clears the model when the config becomes undefined', async () => {
    const instances: Instance[] = [];
    const factory = factoryOf(instances);
    const { result, rerender } = await renderHook(
      ({ config }: { config: { id: string } | undefined }) => useModel(factory, config),
      { initialProps: { config: { id: 'a' } as { id: string } | undefined } }
    );
    await waitFor(() => expect(result.current.model).toBeDefined());

    await rerender({ config: undefined });

    await waitFor(() => expect(result.current.model).toBeUndefined());
    expect(instances[0]!.dispose).toHaveBeenCalledTimes(1);
  });
});
