import { useEffect, useState } from 'react';
import { RnExecutorchErrorCode } from '../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../errors/errorUtils';

interface Module {
  load: (...args: any[]) => Promise<void>;
  forward: (...args: any[]) => Promise<any>;
  delete: () => void;
}

interface ModuleConstructor<M extends Module> {
  new (): M;
}

export const useModule = <
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
  const [error, setError] = useState<null | RnExecutorchError>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [moduleInstance] = useState(() => new module());

  useEffect(() => {
    if (preventLoad) return;

    let isMounted = true;

    (async () => {
      setDownloadProgress(0);
      setError(null);
      try {
        setIsReady(false);
        await moduleInstance.load(model, (progress: number) => {
          if (isMounted) setDownloadProgress(progress);
        });
        if (isMounted) setIsReady(true);
      } catch (err) {
        if (isMounted) setError(parseUnknownError(err));
      }
    })();

    return () => {
      isMounted = false;
      moduleInstance.delete();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleInstance, ...Object.values(model), preventLoad]);

  const forward = async (...input: ForwardArgs): Promise<ForwardReturn> => {
    if (!isReady)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    if (isGenerating)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModelGenerating,
        'The model is currently generating. Please wait until previous model run is complete.'
      );
    try {
      setIsGenerating(true);
      return await moduleInstance.forward(...input);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    /**
     * Contains the error message if the model failed to load.
     */
    error,

    /**
     * Indicates whether the model is ready.
     */
    isReady,

    /**
     * Indicates whether the model is currently generating a response.
     */
    isGenerating,

    /**
     * Represents the download progress as a value between 0 and 1, indicating the extent of the model file retrieval.
     */
    downloadProgress,
    forward,
  };
};
