import { useEffect, useState, useMemo } from 'react';
import { ETError, getError } from '../Error';

interface Module {
  load: (...args: any[]) => Promise<void>;
  forward: (...args: any[]) => Promise<any>;
  delete: () => void;
}

interface ModuleConstructor<M extends Module> {
  new (): M;
}

export const useNonStaticModule = <
  M extends Module,
  LoadArgs extends Parameters<M['load']>,
  ForwardArgs extends Parameters<M['forward']>,
  ForwardReturn extends Awaited<ReturnType<M['forward']>>,
>({
  module,
  model,
  preventLoad = false,
}: {
  module: ModuleConstructor<M>;
  model: LoadArgs[0];
  preventLoad?: boolean;
}) => {
  const [error, setError] = useState<null | string>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const moduleInstance = useMemo(() => new module(), [module]);

  useEffect(() => {
    if (preventLoad) return;

    (async () => {
      setDownloadProgress(0);
      setError(null);
      try {
        setIsReady(false);
        await moduleInstance.load(model, setDownloadProgress);
        setIsReady(true);
      } catch (err) {
        setError((err as Error).message);
      }
    })();

    return () => {
      moduleInstance.delete();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleInstance, ...Object.values(model), preventLoad]);

  const forward = async (...input: ForwardArgs): Promise<ForwardReturn> => {
    if (!isReady) throw new Error(getError(ETError.ModuleNotLoaded));
    if (isGenerating) throw new Error(getError(ETError.ModelGenerating));
    try {
      setIsGenerating(true);
      return await moduleInstance.forward(...input);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    forward,
  };
};
