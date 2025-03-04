import { useEffect, useState } from 'react';
import { SpeechToTextController } from '../../controllers/SpeechToTextController';
import { ResourceSource } from '../../types/common';

interface SpeechToTextModule {
  isModelReady: boolean;
  isModelGenerating: boolean;
  sequence: string;
  downloadProgress: number;
  transcribe: (
    input?: number[]
  ) => ReturnType<SpeechToTextController['transcribe']>;
  loadAudio: (url: string) => ReturnType<SpeechToTextController['loadAudio']>;
}

export const useSpeechToText = ({
  modelName,
  encoderSource,
  decoderSource,
  tokenizerSource,
  overlapSeconds,
  windowSize,
}: {
  modelName: 'moonshine' | 'whisper';
  encoderSource?: ResourceSource;
  decoderSource?: ResourceSource;
  tokenizerSource?: ResourceSource;
  overlapSeconds?: number;
  windowSize?: number;
}): SpeechToTextModule => {
  const [sequence, setSequence] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const [model, _] = useState(
    () =>
      new SpeechToTextController({
        transcribeCallback: setSequence,
        isReadyCallback: setIsReady,
        isGeneratingCallback: setIsGenerating,
        modelDownloadProgessCallback: setDownloadProgress,
        overlapSeconds: overlapSeconds,
        windowSize: windowSize,
      })
  );

  useEffect(() => {
    const loadModel = async () => {
      await model.loadModel(
        modelName,
        encoderSource,
        decoderSource,
        tokenizerSource
      );
    };
    loadModel();
  }, [model, modelName, encoderSource, decoderSource, tokenizerSource]);

  return {
    isModelReady: isReady,
    isModelGenerating: isGenerating,
    downloadProgress,
    sequence: sequence,
    transcribe: (waveform?: number[]) => model.transcribe(waveform),
    loadAudio: (url: string) => model.loadAudio(url),
  };
};
