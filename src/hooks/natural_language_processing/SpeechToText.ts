import { useEffect, useState } from 'react';
import { SpeechToTextController } from '../../modules/natural_language_processing/SpeechToTextController';

interface SpeechToTextModule {
  isReady: boolean;
  isGenerating: boolean;
  sequence: number[];
  decodeSeq: (seq?: number[]) => string;
  transcribe: (input: number[]) => Promise<string>;
  loadAudio: (url: string) => void;
}

export const useSpeechToText = ({
  modelName,
  overlap_seconds,
  window_size,
}: {
  modelName: 'moonshine' | 'whisper';
  overlap_seconds?: number;
  window_size?: number;
}): SpeechToTextModule => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [model, _] = useState(
    () =>
      new SpeechToTextController({
        transribeCallback: setSequence,
        overlap_seconds: overlap_seconds,
        window_size: window_size,
      })
  );

  useEffect(() => {
    const loadModel = async () => {
      await model.loadModel(modelName);
    };
    loadModel();
  }, [model, modelName]);

  useEffect(() => {
    setIsReady(model.isReady);
  }, [model.isReady]);

  useEffect(() => {
    setIsGenerating(model.isGenerating);
  }, [model.isGenerating]);

  return {
    isReady: isReady,
    isGenerating: isGenerating,
    sequence: sequence,
    decodeSeq: model.decodeSeq,
    transcribe: model.transcribe,
    loadAudio: model.loadAudio,
  };
};
