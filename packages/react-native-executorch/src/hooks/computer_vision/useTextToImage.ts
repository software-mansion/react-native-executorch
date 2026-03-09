import { useCallback, useEffect, useState } from 'react';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { TextToImageModule } from '../../modules/computer_vision/TextToImageModule';
import { TextToImageProps, TextToImageType } from '../../types/tti';

/**
 * React hook for managing a Text to Image instance.
 *
 * @category Hooks
 * @param TextToImageProps - Configuration object containing `model` source, `inferenceCallback`, and optional `preventLoad` flag.
 * @returns Ready to use Text to Image model.
 */
export const useTextToImage = ({
  model,
  inferenceCallback,
  preventLoad = false,
}: TextToImageProps): TextToImageType => {
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<RnExecutorchError | null>(null);
  const [moduleInstance, setModuleInstance] =
    useState<TextToImageModule | null>(null);

  useEffect(() => {
    if (preventLoad) return;

    let active = true;
    setDownloadProgress(0);
    setError(null);
    setIsReady(false);

    TextToImageModule.fromModelName(
      {
        modelName: model.modelName,
        tokenizerSource: model.tokenizerSource,
        schedulerSource: model.schedulerSource,
        encoderSource: model.encoderSource,
        unetSource: model.unetSource,
        decoderSource: model.decoderSource,
        inferenceCallback,
      },
      (p) => {
        if (active) setDownloadProgress(p);
      }
    )
      .then((mod) => {
        if (!active) {
          mod.delete();
          return;
        }
        setModuleInstance((prev) => {
          prev?.delete();
          return mod;
        });
        setIsReady(true);
      })
      .catch((err) => {
        if (active) setError(parseUnknownError(err));
      });

    return () => {
      active = false;
      setModuleInstance((prev) => {
        prev?.delete();
        return null;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    model.modelName,
    model.tokenizerSource,
    model.schedulerSource,
    model.encoderSource,
    model.unetSource,
    model.decoderSource,
    preventLoad,
  ]);

  const generate = async (
    input: string,
    imageSize?: number,
    numSteps?: number,
    seed?: number
  ): Promise<string> => {
    if (!isReady || !moduleInstance)
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
      return await moduleInstance.forward(input, imageSize, numSteps, seed);
    } finally {
      setIsGenerating(false);
    }
  };

  const interrupt = useCallback(() => {
    if (isGenerating && moduleInstance) {
      moduleInstance.interrupt();
    }
  }, [moduleInstance, isGenerating]);

  return {
    isReady,
    isGenerating,
    downloadProgress,
    error,
    generate,
    interrupt,
  };
};
