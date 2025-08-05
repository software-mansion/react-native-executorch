import { useEffect, useMemo, useState } from 'react';
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
    streamAction: STREAMING_ACTION,
    input?: number[],
    audioLanguage?: SpeechToTextLanguage
  ) => ReturnType<SpeechToTextController['streamingTranscribe']>;
}

export const useSpeechToText = ({
  model,
  overlapSeconds,
  windowSize,
  streamingConfig,
  preventLoad = false,
}: {
  model: {
    modelName: AvailableModels;
    encoderSource: ResourceSource;
    decoderSource: ResourceSource;
    tokenizerSource: ResourceSource;
  };
  overlapSeconds?: ConstructorParameters<
    typeof SpeechToTextController
  >['0']['overlapSeconds'];
  windowSize?: ConstructorParameters<
    typeof SpeechToTextController
  >['0']['windowSize'];
  streamingConfig?: ConstructorParameters<
    typeof SpeechToTextController
  >['0']['streamingConfig'];
  preventLoad?: boolean;
}): SpeechToTextModule => {
  const [sequence, setSequence] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const controllerInstance = useMemo(
    () =>
      new SpeechToTextController({
        transcribeCallback: setSequence,
        isReadyCallback: setIsReady,
        isGeneratingCallback: setIsGenerating,
        onErrorCallback: setError,
      }),
    []
  );

  useEffect(() => {
    controllerInstance.configureStreaming(
      overlapSeconds,
      windowSize,
      streamingConfig
    );
  }, [controllerInstance, overlapSeconds, windowSize, streamingConfig]);

  useEffect(() => {
    const loadModel = async () => {
      await controllerInstance.load({
        modelName: model.modelName,
        encoderSource: model.encoderSource,
        decoderSource: model.decoderSource,
        tokenizerSource: model.tokenizerSource,
        onDownloadProgressCallback: setDownloadProgress,
      });
    };
    if (!preventLoad) {
      loadModel();
    }
  }, [
    controllerInstance,
    model.modelName,
    model.encoderSource,
    model.decoderSource,
    model.tokenizerSource,
    preventLoad,
  ]);

  return {
    isReady,
    isGenerating,
    downloadProgress,
    configureStreaming: controllerInstance.configureStreaming,
    sequence,
    error,
    transcribe: (waveform: number[], audioLanguage?: SpeechToTextLanguage) =>
      controllerInstance.transcribe(waveform, audioLanguage),
    streamingTranscribe: (
      streamAction: STREAMING_ACTION,
      waveform?: number[],
      audioLanguage?: SpeechToTextLanguage
    ) =>
      controllerInstance.streamingTranscribe(
        streamAction,
        waveform,
        audioLanguage
      ),
  };
};
