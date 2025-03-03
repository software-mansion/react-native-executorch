import { useEffect, useState } from 'react';
import { SpeechToTextController } from '../../controllers/SpeechToTextController';
import { ResourceSource } from '../../types/common';

interface SpeechToTextModule {
  isModelReady: boolean;
  isModelGenerating: boolean;
  sequence: string;
  downloadProgress: number;
  transcribe: (input?: number[]) => Promise<string>;
  loadAudio: (url: string) => void;
}

export const useSpeechToText = ({
  modelName,
  encoderSource,
  decoderSource,
  tokenizerSource,
  overlap_seconds,
  window_size,
}: {
  modelName: 'moonshine' | 'whisper';
  encoderSource?: ResourceSource;
  decoderSource?: ResourceSource;
  tokenizerSource?: ResourceSource;
  overlap_seconds?: number;
  window_size?: number;
}): SpeechToTextModule => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const [model, _] = useState(
    () =>
      new SpeechToTextController({
        transribeCallback: setSequence,
        isReadyCallback: setIsReady,
        isGeneratingCallback: setIsGenerating,
        modelDownloadProgessCallback: setDownloadProgress,
        overlap_seconds: overlap_seconds,
        window_size: window_size,
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
    sequence: model.decodeSeq(sequence),
    transcribe: (waveform?: number[]) => model.transcribe(waveform),
    loadAudio: (url: string) => model.loadAudio(url),
  };
};
