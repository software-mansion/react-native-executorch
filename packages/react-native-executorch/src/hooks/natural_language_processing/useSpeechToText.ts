import { useEffect, useCallback, useState } from 'react';
import { SpeechToTextModule } from '../../modules/natural_language_processing/SpeechToTextModule';
import {
  DecodingOptions,
  SpeechToTextType,
  SpeechToTextProps,
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

  const [modelInstance] = useState(() => new SpeechToTextModule());

  const [committedTranscription, setCommittedTranscription] = useState<
    string | Word[]
  >('');
  const [nonCommittedTranscription, setNonCommittedTranscription] = useState<
    string | Word[]
  >('');

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
            'The model is currently not loaded.'
          );
        if (isGenerating)
          throw new RnExecutorchError(
            RnExecutorchErrorCode.ModelGenerating,
            'The model is currently generating.'
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
    async (options?: DecodingOptions & { enableTimestamps?: boolean }) => {
      if (!isReady)
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModuleNotLoaded,
          'Model not loaded'
        );
      if (isGenerating)
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModelGenerating,
          'Model is generating'
        );

      setIsGenerating(true);

      const enableTimestamps = options?.enableTimestamps ?? false;
      setCommittedTranscription(enableTimestamps ? [] : '');
      setNonCommittedTranscription(enableTimestamps ? [] : '');

      let fullResult: string | Word[] = enableTimestamps ? [] : '';

      try {
        for await (const { committed, nonCommitted } of modelInstance.stream(
          options
        )) {
          console.log(committed, nonCommitted);
          if (typeof committed === 'string') {
            if (committed.length > 0) {
              setCommittedTranscription((prev) => {
                const prevStr = typeof prev === 'string' ? prev : '';
                return prevStr + committed;
              });
              (fullResult as string) += committed;
            }
            setNonCommittedTranscription(nonCommitted as string);
          } else {
            const committedWords = committed as Word[];
            const nonCommittedWords = nonCommitted as Word[];

            if (committedWords.length > 0) {
              setCommittedTranscription((prev) => {
                const prevArr = Array.isArray(prev) ? prev : [];
                return [...prevArr, ...committedWords];
              });
              (fullResult as Word[]).push(...committedWords);
            }
            setNonCommittedTranscription(nonCommittedWords);
          }
        }
      } finally {
        setIsGenerating(false);
      }
      return fullResult;
    },
    [isReady, isGenerating, modelInstance]
  );

  const wrapper = useCallback(
    <T extends (...args: any[]) => any>(fn: T) => {
      return (...args: Parameters<T>): ReturnType<T> => {
        if (!isReady)
          throw new RnExecutorchError(
            RnExecutorchErrorCode.ModuleNotLoaded,
            'Model not loaded'
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
