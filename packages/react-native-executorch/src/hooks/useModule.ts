import { useEffect, useState } from 'react';
import { ETError, getError } from '../Error';

interface Module {
  load: (...args: any[]) => Promise<void>;
  forward: (...input: any[]) => Promise<any>;
  onDownloadProgress: (cb: (progress: number) => void) => void;
}

export const useModule = <
  M extends Module,
  LoadArgs extends Parameters<M['load']>,
  ForwardArgs extends Parameters<M['forward']>,
  ForwardReturn extends Awaited<ReturnType<M['forward']>>,
>({
  module,
  loadArgs,
  preventLoad = false,
}: {
  module: M;
  loadArgs: LoadArgs;
  preventLoad?: boolean;
}) => {
  const [error, setError] = useState<null | string>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const loadModule = async () => {
      try {
        setIsReady(false);
        module.onDownloadProgress(setDownloadProgress);
        await module.load(...loadArgs);
        setIsReady(true);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    if (!preventLoad) {
      loadModule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...loadArgs, preventLoad]);

  const forward = async (...input: ForwardArgs): Promise<ForwardReturn> => {
    if (!isReady) throw new Error(getError(ETError.ModuleNotLoaded));
    if (isGenerating) throw new Error(getError(ETError.ModelGenerating));
    try {
      setIsGenerating(true);
      return await module.forward(...input);
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
