import { useEffect, useCallback, useState } from 'react';
import { SpeechToTextModule } from '../../modules/natural_language_processing/SpeechToTextModule';
import { DecodingOptions, SpeechToTextModelConfig } from '../../types/stt';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

/**
 *
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
}) => {
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
    /**
     * Contains the error message if the model failed to load.
     */
    error,

    /**
     * Indicates whether the model has successfully loaded and is ready for inference.
     */
    isReady,

    /**
     * Indicates whether the model is currently processing an inference.
     */
    isGenerating,

    /**
     * Tracks the progress of the model download process.
     */
    downloadProgress,

    /**
     * Contains the part of the transcription that is finalized and will not change. Useful for displaying stable results during streaming.
     */
    committedTranscription,

    /**
     * Contains the part of the transcription that is still being processed and may change. Useful for displaying live, partial results during streaming.
     */
    nonCommittedTranscription,

    /**
     * Runs the encoding part of the model on the provided waveform. Passing `number[]` is deprecated.
     */
    encode: stateWrapper(SpeechToTextModule.prototype.encode),

    /**
     * Runs the decoder of the model. Passing `number[]` is deprecated.
     * @param waveform - The encoded audio data.
     */
    decode: stateWrapper(SpeechToTextModule.prototype.decode),

    /**
     * Starts a transcription process for a given input array, which should be a waveform at 16kHz. The second argument is an options object, e.g. `{ language: 'es' }` for multilingual models. Resolves a promise with the output transcription when the model is finished. Passing `number[]` is deprecated.
     */
    transcribe: stateWrapper(SpeechToTextModule.prototype.transcribe),

    /**
     * Starts a streaming transcription process. Use in combination with `streamInsert` to feed audio chunks and `streamStop` to end the stream. The argument is an options object, e.g. `{ language: 'es' }` for multilingual models. Updates `committedTranscription` and `nonCommittedTranscription` as transcription progresses.
     * @param options - Decoding options including language.
     */
    stream,

    /**
     * Stops the ongoing streaming transcription process.
     */
    streamStop: wrapper(SpeechToTextModule.prototype.streamStop),

    /**
     * Inserts a chunk of audio data (sampled at 16kHz) into the ongoing streaming transcription. Call this repeatedly as new audio data becomes available. Passing `number[]` is deprecated.
     */
    streamInsert: wrapper(SpeechToTextModule.prototype.streamInsert),
  };
};
