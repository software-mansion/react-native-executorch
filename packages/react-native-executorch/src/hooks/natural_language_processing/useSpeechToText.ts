import { useEffect, useCallback, useState } from 'react';
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
  const [moduleInstance, setModuleInstance] =
    useState<SpeechToTextModule | null>(null);

  useEffect(() => {
    if (preventLoad) return;

    let active = true;
    setDownloadProgress(0);
    setError(null);
    setIsReady(false);

    SpeechToTextModule.fromModelName(
      {
        modelName: model.modelName,
        isMultilingual: model.isMultilingual,
        modelSource: model.modelSource,
        tokenizerSource: model.tokenizerSource,
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
  }, [
    model.modelName,
    model.isMultilingual,
    model.modelSource,
    model.tokenizerSource,
    preventLoad,
  ]);

  const transcribe = useCallback(
    async (
      waveform: Float32Array,
      options: DecodingOptions = {}
    ): Promise<TranscriptionResult> => {
      if (!isReady || !moduleInstance) {
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
      if (!isReady || !moduleInstance) {
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
      if (!isReady || !moduleInstance) return;
      moduleInstance.streamInsert(waveform);
    },
    [isReady, moduleInstance]
  );

  const streamStop = useCallback(() => {
    if (!isReady || !moduleInstance) return;
    moduleInstance.streamStop();
  }, [isReady, moduleInstance]);

  const encode = useCallback(
    (waveform: Float32Array): Promise<Float32Array> => {
      if (!moduleInstance)
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModuleNotLoaded,
          'The model is currently not loaded. Please load the model before calling this function.'
        );
      return moduleInstance.encode(waveform);
    },
    [moduleInstance]
  );

  const decode = useCallback(
    (
      tokens: Int32Array,
      encoderOutput: Float32Array
    ): Promise<Float32Array> => {
      if (!moduleInstance)
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModuleNotLoaded,
          'The model is currently not loaded. Please load the model before calling this function.'
        );
      return moduleInstance.decode(tokens, encoderOutput);
    },
    [moduleInstance]
  );

  return {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    transcribe,
    stream,
    streamInsert,
    streamStop,
    encode,
    decode,
  };
};
