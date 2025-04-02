import { useEffect, useState } from 'react';
import { SpeechToTextController } from '../../controllers/SpeechToTextController';
import { ResourceSource } from '../../types/common';
import { STREAMING_ACTION } from '../../constants/sttDefaults';
import { AvailableModels, SpeechToTextLanguage } from '../../types/stt';

interface SpeechToTextModule {
  isReady: boolean;
  isGenerating: boolean;
  sequence: string;
  downloadProgress: number;
  configureStreaming: SpeechToTextController['configureStreaming'];
  error: Error | undefined;
  transcribe: (
    input: number[],
    audioLanguage?: SpeechToTextLanguage
  ) => ReturnType<SpeechToTextController['transcribe']>;
  streamingTranscribe: (
    input: number[],
    streamAction: STREAMING_ACTION,
    audioLanguage?: SpeechToTextLanguage
  ) => ReturnType<SpeechToTextController['streamingTranscribe']>;
}

export const useSpeechToText = ({
  modelName,
  encoderSource,
  decoderSource,
  tokenizerSource,
  overlapSeconds,
  windowSize,
  streamingConfig,
}: {
  modelName: AvailableModels;
  encoderSource?: ResourceSource;
  decoderSource?: ResourceSource;
  tokenizerSource?: ResourceSource;
  overlapSeconds?: ConstructorParameters<
    typeof SpeechToTextController
  >['0']['overlapSeconds'];
  windowSize?: ConstructorParameters<
    typeof SpeechToTextController
  >['0']['windowSize'];
  streamingConfig?: ConstructorParameters<
    typeof SpeechToTextController
  >['0']['streamingConfig'];
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
        streamingConfig: streamingConfig,
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
    configureStreaming: model.configureStreaming,
    sequence,
    error,
    transcribe: (waveform: number[], audioLanguage?: SpeechToTextLanguage) =>
      model.transcribe(waveform, audioLanguage),
    streamingTranscribe: (
      waveform: number[],
      streamAction: STREAMING_ACTION,
      audioLanguage?: SpeechToTextLanguage
    ) => model.streamingTranscribe(waveform, streamAction, audioLanguage),
  };
};
