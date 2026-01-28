import { useEffect, useCallback, useState } from 'react';
import { SpeechToTextModule } from '../../modules/natural_language_processing/SpeechToTextModule';
import { DecodingOptions, SpeechToTextModelConfig, SpeechToTextType } from '../../types/stt';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

/**
 * React hook for managing a Speech to Text (STT) instance.
 * 
 * @category Hooks
 * @param speechToTextConfiguration - Configuration object containing `model` source and optional `preventLoad` flag.
 * @returns Ready to use Speech to Text model.
 */
export const useSpeechToText = ({
  model,
  preventLoad = false,
}: {
  /**
   * Object containing:
   *
   * `isMultilingual` - A boolean flag indicating whether the model supports multiple languages.
   *
   * `encoderSource` - A string that specifies the location of a `.pte` file for the encoder.
   *
   * `decoderSource` - A string that specifies the location of a `.pte` file for the decoder.
   *
   * `tokenizerSource` - A string that specifies the location to the tokenizer for the model.
   */
  model: SpeechToTextModelConfig;

  /**
   * Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
   */
  preventLoad?: boolean;
}): SpeechToTextType => {
  const [error, setError] = useState<null | RnExecutorchError>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [modelInstance] = useState(() => new SpeechToTextModule());
  const [committedTranscription, setCommittedTranscription] = useState('');
  const [nonCommittedTranscription, setNonCommittedTranscription] =
    useState('');

  useEffect(() => {
    if (preventLoad) return;
    (async () => {
      setDownloadProgress(0);
      setError(null);
      try {
        setIsReady(false);
        await modelInstance.load(
          {
            isMultilingual: model.isMultilingual,
            encoderSource: model.encoderSource,
            decoderSource: model.decoderSource,
            tokenizerSource: model.tokenizerSource,
          },
          setDownloadProgress
        );
        setIsReady(true);
      } catch (err) {
        setError(parseUnknownError(err));
      }
    })();
  }, [
    modelInstance,
    model.isMultilingual,
    model.encoderSource,
    model.decoderSource,
    model.tokenizerSource,
    preventLoad,
  ]);

  const stateWrapper = useCallback(
    <T extends (...args: any[]) => Promise<any>>(fn: T) =>
      async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
        if (!isReady)
          throw new RnExecutorchError(
            RnExecutorchErrorCode.ModuleNotLoaded,
            'The model is currently not loaded. Please load the model before calling this function.'
          );
        if (isGenerating)
          throw new RnExecutorchError(
            RnExecutorchErrorCode.ModelGenerating,
            'The model is currently generating. Please wait until previous model run is complete.'
          );
        setIsGenerating(true);
        try {
          return await fn.apply(modelInstance, args);
        } finally {
          setIsGenerating(false);
        }
      },
    [isReady, isGenerating, modelInstance]
  );

  const stream = useCallback(
    async (options?: DecodingOptions) => {
      if (!isReady)
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModuleNotLoaded,
          'The model is currently not loaded. Please load the model before calling this function.'
        );
      if (isGenerating)
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModelGenerating,
          'The model is currently generating. Please wait until previous model run is complete.'
        );
      setIsGenerating(true);
      setCommittedTranscription('');
      setNonCommittedTranscription('');
      let transcription = '';
      try {
        for await (const { committed, nonCommitted } of modelInstance.stream(
          options
        )) {
          setCommittedTranscription((prev) => prev + committed);
          setNonCommittedTranscription(nonCommitted);
          transcription += committed;
        }
      } finally {
        setIsGenerating(false);
      }
      return transcription;
    },
    [isReady, isGenerating, modelInstance]
  );

  const wrapper = useCallback(
    <T extends (...args: any[]) => any>(fn: T) => {
      return (...args: Parameters<T>): ReturnType<T> => {
        if (!isReady)
          throw new RnExecutorchError(
            RnExecutorchErrorCode.ModuleNotLoaded,
            'The model is currently not loaded. Please load the model before calling this function.'
          );
        return fn.apply(modelInstance, args);
      };
    },
    [isReady, modelInstance]
  );

  return {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    committedTranscription,
    nonCommittedTranscription,
    encode: stateWrapper(SpeechToTextModule.prototype.encode),
    decode: stateWrapper(SpeechToTextModule.prototype.decode),
    transcribe: stateWrapper(SpeechToTextModule.prototype.transcribe),
    stream,
    streamStop: wrapper(SpeechToTextModule.prototype.streamStop),
    streamInsert: wrapper(SpeechToTextModule.prototype.streamInsert),
  };
};
