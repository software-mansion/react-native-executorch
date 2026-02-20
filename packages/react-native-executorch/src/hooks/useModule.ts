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
  const [runOnFrame, setRunOnFrame] = useState<any>(null);

  useEffect(() => {
    if (preventLoad) return;

    (async () => {
      setDownloadProgress(0);
      setError(null);
      try {
        setIsReady(false);
        await moduleInstance.load(model, setDownloadProgress);
        setIsReady(true);

        // Extract runOnFrame worklet from VisionModule if available
        // Use "state trick" to make the worklet serializable for VisionCamera
        if ('runOnFrame' in moduleInstance) {
          const worklet = moduleInstance.runOnFrame;
          if (worklet) {
            setRunOnFrame(() => worklet);
          }
        }
      } catch (err) {
        setError(parseUnknownError(err));
      }
    })();

    return () => {
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

    /**
     * Synchronous worklet function for real-time VisionCamera frame processing.
     * Automatically handles native buffer extraction and cleanup.
     *
     * Only available for Computer Vision modules that support real-time frame processing
     * (e.g., ObjectDetection, Classification, ImageSegmentation).
     * Returns `null` if the module doesn't implement frame processing.
     *
     * **Use this for VisionCamera frame processing in worklets.**
     * For async processing, use `forward()` instead.
     *
     * @example
     * ```typescript
     * const { runOnFrame } = useObjectDetection({ model: MODEL });
     *
     * const frameOutput = useFrameOutput({
     *   onFrame(frame) {
     *     'worklet';
     *     if (!runOnFrame) return;
     *     const detections = runOnFrame(frame, 0.5);
     *     frame.dispose();
     *   }
     * });
     * ```
     */
    runOnFrame,
  };
};
