import { useEffect, useRef, useState, useCallback } from 'react';
import {
  useSpeechToText,
  WHISPER_TINY_EN,
  useTextToSpeech,
  KOKORO,
  TextToSpeechVoiceConfig,
  KOKORO_VOICE_AMERICAN_ENGLISH_FEMALE_HEART,
} from 'react-native-executorch';
import {
  AudioManager,
  AudioRecorder,
  AudioContext,
  AudioBuffer,
  AudioBufferSourceNode,
} from 'react-native-audio-api';

const createAudioBufferFromVector = (
  audioVector: Float32Array,
  audioContext: AudioContext | null = null,
  sampleRate: number = 24000
): AudioBuffer => {
  if (audioContext == null) audioContext = new AudioContext({ sampleRate });

  const audioBuffer = audioContext.createBuffer(
    1,
    audioVector.length,
    sampleRate
  );
  const channelData = audioBuffer.getChannelData(0);
  channelData.set(audioVector);

  return audioBuffer;
};

/**
 * Simple heuristic to deduplicate common hallucinations or repeated phrases in STT.
 * @param text Original transcription text.
 */
const deduplicateTranscription = (text: string): string => {
  if (!text) return '';

  const fragments = text
    .split(/([.!?]+|\n)/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  const uniqueFragments: string[] = [];
  for (let i = 0; i < fragments.length; i++) {
    const fragment = fragments[i];
    if (/^[.!?\n]+$/.test(fragment)) {
      if (uniqueFragments.length > 0) {
        uniqueFragments[uniqueFragments.length - 1] += fragment;
      }
      continue;
    }

    const normalizedCurrent = fragment.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isDuplicate = uniqueFragments.some((prev) => {
      const normalizedPrev = prev.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normalizedPrev === normalizedCurrent;
    });

    if (!isDuplicate) {
      uniqueFragments.push(fragment);
    }
  }

  return uniqueFragments.join(' ');
};

interface SpeechToSpeechProps {
  onProcessText: (text: string) => Promise<string | null>;
  voice?: TextToSpeechVoiceConfig;
}

export const useSpeechToSpeech = ({
  onProcessText,
  voice = KOKORO_VOICE_AMERICAN_ENGLISH_FEMALE_HEART,
}: SpeechToSpeechProps) => {
  const sttModel = useSpeechToText({ model: WHISPER_TINY_EN });
  const ttsModel = useTextToSpeech({
    model: KOKORO,
    voice: voice,
  });

  const [liveSttResult, setLiveSttResult] = useState<string>('');
  const [processedText, setProcessedText] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState(false);

  const recorder = useRef(new AudioRecorder());
  const isRecordingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode>(null);

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetoothHFP', 'defaultToSpeaker'],
    });

    const checkPerms = async () => {
      const status = await AudioManager.requestRecordingPermissions();
      setHasMicPermission(status === 'Granted');
    };
    checkPerms();

    audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current.suspend();

    return () => {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  const handlePlayTts = useCallback(
    async (text: string) => {
      if (isTtsPlaying) return;
      setIsTtsPlaying(true);

      try {
        const audioContext = audioContextRef.current;
        if (!audioContext) return;

        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const onNext = async (audioVec: Float32Array) => {
          return new Promise<void>((resolve) => {
            const audioBuffer = createAudioBufferFromVector(
              audioVec,
              audioContext,
              24000
            );
            const source = (sourceRef.current =
              audioContext.createBufferSource());
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.onEnded = () => resolve();
            source.start();
          });
        };

        const onEnd = async () => {
          setIsTtsPlaying(false);
          await audioContext.suspend();
        };

        await ttsModel.stream({ text, onNext, onEnd });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setIsTtsPlaying(false);
      }
    },
    [isTtsPlaying, ttsModel]
  );

  const startRecording = useCallback(async () => {
    if (!hasMicPermission) {
      setError('Microphone permission denied. Please enable it in Settings.');
      return;
    }

    if (!sttModel.isReady || !ttsModel.isReady) {
      return;
    }

    isRecordingRef.current = true;
    setIsRecording(true);
    setLiveSttResult('');
    setProcessedText('');

    const sampleRate = 16000;
    sttModel.streamStop();
    recorder.current.onAudioReady(
      { sampleRate, bufferLength: 0.1 * sampleRate, channelCount: 1 },
      ({ buffer }) => {
        sttModel.streamInsert(buffer.getChannelData(0));
      }
    );

    try {
      await AudioManager.setAudioSessionActivity(true);
      recorder.current.start();

      let accumulatedText = '';
      const streamIter = sttModel.stream({ verbose: false });

      for await (const { committed, nonCommitted } of streamIter) {
        if (!isRecordingRef.current) break;
        if (committed.text) {
          accumulatedText += committed.text;
        }
        setLiveSttResult(accumulatedText + nonCommitted.text);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  }, [hasMicPermission, sttModel, ttsModel]);

  const stopRecording = useCallback(async () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    recorder.current.stop();
    sttModel.streamStop();

    if (liveSttResult.trim()) {
      const cleanedText = deduplicateTranscription(liveSttResult);
      try {
        const response = await onProcessText(cleanedText);
        if (response) {
          setProcessedText(response);
          await handlePlayTts(response);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    }
  }, [liveSttResult, sttModel, onProcessText, handlePlayTts]);

  const getStatus = () => {
    if (!sttModel.isReady)
      return `Loading STT: ${(100 * sttModel.downloadProgress).toFixed(2)}%`;
    if (!ttsModel.isReady)
      return `Loading TTS: ${(100 * ttsModel.downloadProgress).toFixed(2)}%`;
    if (isRecording) return 'Listening...';
    if (sttModel.isGenerating) return 'Processing...';
    if (ttsModel.isGenerating) return 'Synthesizing...';
    if (isTtsPlaying) return 'Playing...';
    return 'Ready';
  };

  return {
    liveSttResult,
    processedText,
    isRecording,
    isTtsPlaying,
    error,
    setError,
    startRecording,
    stopRecording,
    getStatus,
    isReady: sttModel.isReady && ttsModel.isReady,
  };
};
