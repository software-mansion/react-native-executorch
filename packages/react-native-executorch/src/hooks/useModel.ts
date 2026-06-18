import { useEffect, useState } from 'react';

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
