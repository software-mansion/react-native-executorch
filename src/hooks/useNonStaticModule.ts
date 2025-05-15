import { useEffect, useState, useMemo } from 'react';
import { ETError, getError } from '../Error';

interface Module {
  load: (...args: any[]) => Promise<void>;
  forward: (...args: any[]) => Promise<any>;
}

interface ModuleConstructor<M extends Module> {
  new (): M;
}

export const useNonStaticModule = <
  M extends Module,
  LoadArgs extends Parameters<M['load']>,
  ForwardArgs extends any[],
  ForwardReturn,
>({
  module,
  loadArgs,
  preventLoad = false,
}: {
  module: ModuleConstructor<M>;
  loadArgs: LoadArgs;
  preventLoad?: boolean;
}) => {
  const [error, setError] = useState<null | string>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const model = useMemo(() => new module(), [module]);

  useEffect(() => {
    if (!preventLoad) {
      (async () => {
        setDownloadProgress(0);
        setError(null);
        try {
          setIsReady(false);
          await model.load(...loadArgs, setDownloadProgress);
          setIsReady(true);
        } catch (err) {
          setError((err as Error).message);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...loadArgs, preventLoad]);

  const forward = async (...input: ForwardArgs): Promise<ForwardReturn> => {
    if (!isReady) throw new Error(getError(ETError.ModuleNotLoaded));
    if (isGenerating) throw new Error(getError(ETError.ModelGenerating));
    try {
      setIsGenerating(true);
      return await model.forward(...input);
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
