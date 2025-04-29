import { useEffect, useRef, useState } from 'react';
import { ETError, getError } from '../Error';

interface Module {
  load: (...args: any[]) => Promise<any>;
}

export const useNonStaticModule = <
  M extends Module,
  LoadArgs extends Parameters<M['load']>,
  ForwardArgs extends any[],
  ForwardReturn,
>({
  module,
  loadArgs,
}: {
  module: M;
  loadArgs: LoadArgs;
}) => {
  const [error, setError] = useState<null | string>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  let modelRef = useRef<any>(null);

  useEffect(() => {
    setIsReady(false);

    const loadModule = async () => {
      try {
        setIsReady(false);
        modelRef.current = await module.load(...loadArgs, setDownloadProgress);
        setIsReady(true);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    loadModule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...loadArgs]);

  const forward = async (...input: ForwardArgs): Promise<ForwardReturn> => {
    if (!isReady) throw new Error(getError(ETError.ModuleNotLoaded));
    if (isGenerating) throw new Error(getError(ETError.ModelGenerating));
    try {
      setIsGenerating(true);
      return await modelRef.current.forward(...input);
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
