import { useEffect, useState } from 'react';
import { ETError, getError } from '../Error';

interface Params<LoadArgs extends any[], Input extends any[], Output> {
  loadArgs: LoadArgs;
  loadFn: (...args: LoadArgs) => Promise<void>;
  forwardFn: (...input: Input) => Promise<Output>;
  onDownloadProgress: (cb: (progress: number) => void) => void;
}

export const useModule2 = <
  LoadArgs extends any[],
  Input extends any[],
  Output,
>({
  loadArgs,
  loadFn,
  forwardFn,
  onDownloadProgress,
}: Params<LoadArgs, Input, Output>) => {
  const [error, setError] = useState<null | string>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const loadModule = async () => {
      try {
        setIsReady(false);
        onDownloadProgress(setDownloadProgress);
        await loadFn(...loadArgs);
        setIsReady(true);
      } catch (error) {
        setError((error as Error).message);
      }
    };
    loadModule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...loadArgs]);

  const forward = async (...input: Input): Promise<Output> => {
    if (!isReady) throw new Error(getError(ETError.ModuleNotLoaded));
    if (isGenerating) throw new Error(getError(ETError.ModelGenerating));
    try {
      setIsGenerating(true);
      return await forwardFn(...input);
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
