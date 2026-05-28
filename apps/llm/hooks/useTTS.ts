import { useState, useRef, useEffect, useCallback } from 'react';
import { Keyboard } from 'react-native';
import {
  models,
  useTextToSpeech,
  type TextToSpeechModelConfig,
} from 'react-native-executorch';
import { AudioManager, AudioContext } from 'react-native-audio-api';

const tts = models.text_to_speech.kokoro;

const VOICE_MAP: Record<string, TextToSpeechModelConfig> = {
  us: tts.en_us.heart(),
  es: tts.es.dora(),
  pt: tts.pt.dora(),
  fr: tts.fr.siwis(),
  it: tts.it.sara(),
  de: tts.de.anna(),
  pl: tts.pl.mateusz(),
  in: tts.hi.alpha(),
};

export function useTTS(presetId: string) {
  const voice = VOICE_MAP[presetId] ?? VOICE_MAP.us;
  const ttsModel = useTextToSpeech(voice);
  const ttsRef = useRef(ttsModel);
  ttsRef.current = ttsModel;

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = (() => {
    if (ttsModel.isGenerating) return 'Generating audio...';
    if (isPlaying) return 'Playing...';
    if (ttsModel.isReady) return null;
    return null;
  })();

  const isActive = ttsModel.isGenerating || isPlaying;

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['defaultToSpeaker'],
    });

    const ctx = new AudioContext({ sampleRate: 24000 });
    audioCtxRef.current = ctx;
    ctx.suspend();

    const gain = ctx.createGain();
    gain.gain.value = 2.0;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    return () => {
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      gainRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (ttsModel.error) setError(String(ttsModel.error));
  }, [ttsModel.error]);

  const handleSend = useCallback(async (inputText: string) => {
    if (!inputText.trim()) return;

    Keyboard.dismiss();
    setIsPlaying(true);
    setError(null);

    try {
      const ctx = audioCtxRef.current;
      if (!ctx) {
        setIsPlaying(false);
        return;
      }

      let didEnd = false;
      const markEnded = async () => {
        if (didEnd) return;
        didEnd = true;
        setIsPlaying(false);
        await ctx.suspend();
      };

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const onNext = async (audioVec: Float32Array) => {
        return new Promise<void>((resolve) => {
          const audioBuffer = ctx.createBuffer(1, audioVec.length, 24000);
          audioBuffer.getChannelData(0).set(audioVec);

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;

          if (gainRef.current) {
            source.connect(gainRef.current);
          } else {
            source.connect(ctx.destination);
          }

          source.onEnded = () => resolve();
          source.start();
        });
      };

      const onEnd = async () => {
        await markEnded();
      };

      await ttsRef.current.stream({
        text: inputText,
        speed: 0.9,
        phonemize: true,
        onNext,
        onEnd,
      });

      await markEnded();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setIsPlaying(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { handleSend, isActive, isPlaying, error, status, clearError };
}
