import { useEffect, useCallback, useState, useMemo } from 'react';
import { SpeechToTextModule } from '../../modules/natural_language_processing/SpeechToTextModule';
import {
  DecodingOptions,
  SpeechToTextType,
  SpeechToTextProps,
  TranscriptionResult,
} from '../../types/stt';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';

/**
 * React hook for managing a Speech to Text (STT) instance.
 *
 * @category Hooks
 * @param speechToTextProps - Configuration object containing `model` source and optional `preventLoad` flag.
 * @returns Ready to use Speech to Text model.
 */
export const useSpeechToText = ({
  model,
  preventLoad = false,
}: SpeechToTextProps): SpeechToTextType => {
  const [error, setError] = useState<null | RnExecutorchError>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const moduleInstance = useMemo(() => new SpeechToTextModule(), []);

  useEffect(() => {
    if (preventLoad) return;
    let isMounted = true;

    (async () => {
      setDownloadProgress(0);
      setError(null);
      try {
        setIsReady(false);
        await moduleInstance.load(
          {
            isMultilingual: model.isMultilingual,
            encoderSource: model.encoderSource,
            decoderSource: model.decoderSource,
            tokenizerSource: model.tokenizerSource,
          },
          (progress) => {
            if (isMounted) setDownloadProgress(progress);
          }
        );
        if (isMounted) setIsReady(true);
      } catch (err) {
        if (isMounted) setError(parseUnknownError(err));
      }
    })();

    return () => {
      isMounted = false;
      moduleInstance.delete();
    };
  }, [
    moduleInstance,
    model.isMultilingual,
    model.encoderSource,
    model.decoderSource,
    model.tokenizerSource,
    preventLoad,
  ]);

  const transcribe = useCallback(
    async (
      waveform: Float32Array,
      options: DecodingOptions = {}
    ): Promise<TranscriptionResult> => {
      if (!isReady) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModuleNotLoaded,
          'The model is currently not loaded.'
        );
      }
      if (isGenerating) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModelGenerating,
          'The model is currently generating.'
        );
      }

      setIsGenerating(true);
      try {
        return await moduleInstance.transcribe(waveform, options);
      } finally {
        setIsGenerating(false);
      }
    },
    [isReady, isGenerating, moduleInstance]
  );

  const stream = useCallback(
    async function* (options: DecodingOptions = {}): AsyncGenerator<
      {
        committed: TranscriptionResult;
        nonCommitted: TranscriptionResult;
      },
      void,
      unknown
    > {
      if (!isReady) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModuleNotLoaded,
          'The model is currently not loaded. Please load the model before calling this function.'
        );
      }
      if (isGenerating) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModelGenerating,
          'The model is currently generating. Please wait until previous model run is complete.'
        );
      }

      setIsGenerating(true);
      try {
        const generator = moduleInstance.stream(options);
        for await (const result of generator) {
          yield result;
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [isReady, isGenerating, moduleInstance]
  );

  const streamInsert = useCallback(
    (waveform: Float32Array) => {
      if (!isReady) return;
      moduleInstance.streamInsert(waveform);
    },
    [isReady, moduleInstance]
  );

  const streamStop = useCallback(() => {
    if (!isReady) return;
    moduleInstance.streamStop();
  }, [isReady, moduleInstance]);

  return {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    transcribe,
    stream,
    streamInsert,
    streamStop,
    encode: moduleInstance.encode.bind(moduleInstance),
    decode: moduleInstance.decode.bind(moduleInstance),
  };
};
