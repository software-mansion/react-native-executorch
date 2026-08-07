import { useEffect, useMemo, useState } from 'react';
import { RnExecutorchError, toRnExecutorchError } from '../errors';

/**
 * React hook to instantiate and compile a model pipeline with automatic
 * lifetime management.
 *
 * It manages the lifecycle of a model or task runner instance. When the
 * configuration changes or the component unmounts, it automatically disposes of
 * the previous instance to prevent native memory leaks.
 * @category Hooks
 * @typeParam TConfig The configuration type passed to the model creator.
 * @typeParam TModel The type of the compiled model instance containing a
 * `dispose` method.
 * @param createModel An asynchronous factory function to instantiate the
 * model/task.
 * @param config The configuration to pass to `createModel`, or `null` if the
 * model shouldn't be loaded yet. It is tracked by value, so the model is
 * re-created whenever the config's contents change and passing an inline object
 * is safe.
 * @returns An object containing the loaded model instance and any instantiation
 * error.
 */
export function useModel<TConfig, TModel extends { dispose: () => void }>(
  createModel: (config: TConfig) => Promise<TModel>,
  config: TConfig | null
) {
  const [model, setModel] = useState<TModel | null>(null);
  const [error, setError] = useState<RnExecutorchError | null>(null);

  // Configs are plain JSON data, so serializing is a sound structural identity
  // and keeps an inline `config` object from rebuilding the model every render.
  const configKey = useMemo(() => JSON.stringify(config), [config]);

  useEffect(() => {
    if (!config) {
      setModel(null);
      setError(null);
      return;
    }

    let isMounted = true;
    let instance: TModel | null = null;
    setModel(null);
    setError(null);

    createModel(config)
      .then((m) => {
        if (isMounted) {
          instance = m;
          setModel(m);
        } else {
          m.dispose();
        }
      })
      .catch((e) => {
        if (isMounted) setError(toRnExecutorchError(e));
      });

    return () => {
      isMounted = false;
      instance?.dispose();
    };
    // `createModel` is a module-level factory, so the config alone decides when
    // the instance has to be rebuilt, and it is tracked by value via `configKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  return { model, error };
}
