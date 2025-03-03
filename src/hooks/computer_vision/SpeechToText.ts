import { useState } from 'react';
import { SpeechToTextController } from '../../controllers/SpeechToTextController';

interface SpeechToTextModule {
  isReady: boolean;
  isGenerating: boolean;
  sequence: number[];
  decodeSeq: (seq?: number[]) => string;
  transcribe: (input: number[]) => Promise<string>;
  loadAudio: (url: string) => void;
}

export const useSpeechToText = ({
  overlap_seconds,
  window_size,
}: {
  overlap_seconds?: number;
  window_size?: number;
}): SpeechToTextModule => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [model, _] = useState(
    () =>
      new SpeechToTextController({
        transribeCallback: setSequence,
        overlap_seconds: overlap_seconds,
        window_size: window_size,
      })
  );

  return {
    isReady: model.isReady,
    isGenerating: model.isGenerating,
    sequence: sequence,
    decodeSeq: model.decodeSeq,
    transcribe: model.transcribe,
    loadAudio: model.loadAudio,
  };
};
