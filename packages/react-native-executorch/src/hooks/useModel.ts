import { useEffect, useState } from 'react';

/**
 * React hook to instantiate and compile a model/task pipeline with automatic
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
 * model shouldn't be loaded yet.
 * @param deps Dependency array specifying when to re-create the model.
 * @returns An object containing the loaded model instance and any instantiation
 * error.
 */
export function useModel<TConfig, TModel extends { dispose: () => void }>(
  createModel: (config: TConfig) => Promise<TModel>,
  config: TConfig | null,
  deps: React.DependencyList
) {
  const [model, setModel] = useState<TModel | null>(null);
  const [error, setError] = useState<Error | null>(null);

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
        if (isMounted) setError(e instanceof Error ? e : new Error(String(e)));
      });

    return () => {
      isMounted = false;
      instance?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { model, error };
}
