import { useCallback, useState } from 'react';
import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import {
  createTextToSpeech,
  type TextToSpeechModel,
  type TextToSpeechInput,
} from '../extensions/speech/tasks/textToSpeech';

export function useTextToSpeech(config: TextToSpeechModel, options?: { preventLoad?: boolean }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    localPath: dpPath,
    downloadProgress: dpProgress,
    downloadError: dpError,
  } = useResourceDownload(config.durationPredictorPath, options?.preventLoad);

  const {
    localPath: synthPath,
    downloadProgress: synthProgress,
    downloadError: synthError,
  } = useResourceDownload(config.synthesizerPath, options?.preventLoad);

  const {
    localPath: voicePath,
    downloadProgress: voiceProgress,
    downloadError: voiceError,
  } = useResourceDownload(config.voicePath, options?.preventLoad);

  const {
    localPath: taggerPath,
    downloadProgress: taggerProgress,
    downloadError: taggerError,
  } = useResourceDownload(config.phonemizerConfig.taggerSource ?? '', options?.preventLoad);

  const {
    localPath: lexiconPath,
    downloadProgress: lexiconProgress,
    downloadError: lexiconError,
  } = useResourceDownload(config.phonemizerConfig.lexiconSource ?? '', options?.preventLoad);

  const {
    localPath: neuralPath,
    downloadProgress: neuralProgress,
    downloadError: neuralError,
  } = useResourceDownload(config.phonemizerConfig.neuralModelSource ?? '', options?.preventLoad);

  const allReady = dpPath && synthPath && voicePath;

  const { model, error } = useModel(
    createTextToSpeech,
    allReady
      ? {
          ...config,
          durationPredictorPath: dpPath,
          synthesizerPath: synthPath,
          voicePath,
          phonemizerConfig: {
            ...config.phonemizerConfig,
            taggerSource: taggerPath,
            lexiconSource: lexiconPath,
            neuralModelSource: neuralPath,
          },
        }
      : null,
    [dpPath, synthPath, voicePath, taggerPath, lexiconPath, neuralPath]
  );

  const stream = useCallback(
    async (input: TextToSpeechInput) => {
      if (!model) return;
      setIsGenerating(true);
      try {
        // Resolves only once both synthesis and playback have finished.
        await model.stream(input);
      } finally {
        setIsGenerating(false);
      }
    },
    [model]
  );

  const downloadProgress =
    (dpProgress +
      synthProgress +
      voiceProgress +
      taggerProgress +
      lexiconProgress +
      neuralProgress) /
    6;

  return {
    isReady: !!model,
    isGenerating,
    error:
      dpError || synthError || voiceError || taggerError || lexiconError || neuralError || error,
    downloadProgress,
    stream,
    synthesizeWorklet: model?.synthesizeWorklet,
  };
}
