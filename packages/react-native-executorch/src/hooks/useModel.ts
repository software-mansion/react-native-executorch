import { useEffect, useMemo, useState } from 'react';

/**
 * React hook to instantiate and manage a model or task instance with automatic
 * lifetime management.
 *
 * It manages the lifecycle of a model or task runner instance. When the
 * configuration changes or the component unmounts, it automatically disposes of
 * the previous instance to prevent native memory leaks.
 * @category Hooks
 * @typeParam TConfig The configuration type passed to the model creator.
 * @typeParam TModel The type of the compiled model instance containing a
 * `dispose` method.
 * @param createModel An asynchronous factory function to instantiate the model
 * or task runner.
 * @param config The configuration to pass to `createModel`, or `undefined` if
 * the model shouldn't be loaded yet. It is tracked by value, so the model is
 * re-created whenever the config's contents change and passing an inline object
 * is safe.
 * @returns An object containing the loaded model instance and any instantiation
 * error.
 */
export function useModel<TConfig, TModel extends { dispose: () => void }>(
  createModel: (config: TConfig) => Promise<TModel>,
  config: TConfig | undefined
) {
  const [model, setModel] = useState<TModel | undefined>();
  const [error, setError] = useState<Error | undefined>();

  // Configs are plain JSON data, so serializing is a sound structural identity
  // and keeps an inline `config` object from rebuilding the model every render.
  const configKey = useMemo(() => JSON.stringify(config), [config]);

  useEffect(() => {
    if (config === undefined) {
      setModel(undefined);
      setError(undefined);
      return;
    }

    let isMounted = true;
    let instance: TModel | undefined;
    setModel(undefined);
    setError(undefined);

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
        if (isMounted) setError(e instanceof Error ? e : new Error(String(e)));
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
