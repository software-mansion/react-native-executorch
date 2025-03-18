import { useEffect, useState } from 'react';
import { SpeechToTextController } from '../../controllers/SpeechToTextController';
import { ResourceSource } from '../../types/common';

interface SpeechToTextModule {
  isReady: boolean;
  isGenerating: boolean;
  sequence: string;
  downloadProgress: number;
  error: Error | undefined;
  transcribe: (
    input: number[]
  ) => ReturnType<SpeechToTextController['transcribe']>;
}

export const useSpeechToText = ({
  modelName,
  encoderSource,
  decoderSource,
  tokenizerSource,
  overlapSeconds,
  windowSize,
  preset,
}: {
  modelName: 'moonshine' | 'whisper';
  encoderSource?: ResourceSource;
  decoderSource?: ResourceSource;
  tokenizerSource?: ResourceSource;
  overlapSeconds?: ConstructorParameters<
    typeof SpeechToTextController
  >['0']['overlapSeconds'];
  windowSize?: ConstructorParameters<
    typeof SpeechToTextController
  >['0']['windowSize'];
  preset?: ConstructorParameters<typeof SpeechToTextController>['0']['preset'];
}): SpeechToTextModule => {
  const [sequence, setSequence] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const [model, _] = useState(
    () =>
      new SpeechToTextController({
        transcribeCallback: setSequence,
        isReadyCallback: setIsReady,
        isGeneratingCallback: setIsGenerating,
        onErrorCallback: setError,
        modelDownloadProgessCallback: setDownloadProgress,
        overlapSeconds: overlapSeconds,
        windowSize: windowSize,
        preset: preset,
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
    isReady,
    isGenerating,
    downloadProgress,
    sequence: sequence,
    error: error,
    transcribe: (waveform: number[]) => model.transcribe(waveform),
  };
};
