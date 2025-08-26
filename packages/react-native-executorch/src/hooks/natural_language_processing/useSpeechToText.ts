import { useEffect, useCallback, useState } from 'react';
import { ETError, getError } from '../../Error';
import { SpeechToTextModule } from '../../modules/natural_language_processing/SpeechToTextModule';
import { SpeechToTextModelConfig } from '../../types/stt';

export const useSpeechToText = ({
  model,
  preventLoad = false,
}: {
  model: SpeechToTextModelConfig;
  preventLoad?: boolean;
}) => {
  const [error, setError] = useState<null | string>(null);
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
        setError((err as Error).message);
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
        if (!isReady) throw new Error(getError(ETError.ModuleNotLoaded));
        if (isGenerating) throw new Error(getError(ETError.ModelGenerating));
        setIsGenerating(true);
        try {
          return await fn.apply(modelInstance, args);
        } finally {
          setIsGenerating(false);
        }
      },
    [isReady, isGenerating, modelInstance]
  );

  const stream = useCallback(async () => {
    if (!isReady) throw new Error(getError(ETError.ModuleNotLoaded));
    if (isGenerating) throw new Error(getError(ETError.ModelGenerating));
    setIsGenerating(true);
    setCommittedTranscription('');
    setNonCommittedTranscription('');
    let transcription = '';
    try {
      for await (const { committed, nonCommitted } of modelInstance.stream()) {
        setCommittedTranscription((prev) => prev + committed);
        setNonCommittedTranscription(nonCommitted);
        transcription += committed;
      }
    } finally {
      setIsGenerating(false);
    }
    return transcription;
  }, [isReady, isGenerating, modelInstance]);

  const wrapper = useCallback(
    <T extends (...args: any[]) => any>(fn: T) => {
      return (...args: Parameters<T>): ReturnType<T> => {
        if (!isReady) throw new Error(getError(ETError.ModuleNotLoaded));
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
