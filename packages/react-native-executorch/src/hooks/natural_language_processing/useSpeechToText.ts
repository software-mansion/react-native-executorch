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
  const [commitedTranscription, setCommitedTranscription] = useState('');
  const [nonCommitedTranscription, setNonCommitedTranscription] = useState('');

  useEffect(() => {
    if (preventLoad) return;
    (async () => {
      setDownloadProgress(0);
      setError(null);
      try {
        setIsReady(false);
        await modelInstance.load(
          {
            type: model.type,
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
    model.type,
    model.isMultilingual,
    model.encoderSource,
    model.decoderSource,
    model.tokenizerSource,
    preventLoad,
  ]);

  const stateWrapper = useCallback(
    <T extends (...args: any[]) => any>(fn: T) => {
      return (...args: Parameters<T>): ReturnType<T> => {
        if (!isReady) throw new Error(getError(ETError.ModuleNotLoaded));
        if (isGenerating) throw new Error(getError(ETError.ModelGenerating));
        setIsGenerating(true);
        try {
          return fn.apply(modelInstance, args);
        } finally {
          setIsGenerating(false);
        }
      };
    },
    [isReady, isGenerating, modelInstance]
  );

  const stream = useCallback(async () => {
    if (!isReady) throw new Error(getError(ETError.ModuleNotLoaded));
    if (isGenerating) throw new Error(getError(ETError.ModelGenerating));
    setIsGenerating(true);
    setCommitedTranscription('');
    setNonCommitedTranscription('');
    let transcription = '';
    try {
      for await (const { commited, nonCommited } of modelInstance.stream()) {
        setCommitedTranscription((prev) => prev + commited);
        setNonCommitedTranscription(nonCommited);
        transcription += commited;
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
    commitedTranscription,
    nonCommitedTranscription,
    encode: stateWrapper(SpeechToTextModule.prototype.encode),
    decode: stateWrapper(SpeechToTextModule.prototype.decode),
    transcribe: stateWrapper(SpeechToTextModule.prototype.transcribe),
    stream,
    streamStop: wrapper(SpeechToTextModule.prototype.streamStop),
    streamInsert: wrapper(SpeechToTextModule.prototype.streamInsert),
  };
};
