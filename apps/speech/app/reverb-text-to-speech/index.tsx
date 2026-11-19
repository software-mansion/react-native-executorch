import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import RNBlobUtil from 'react-native-blob-util';
import DeviceInfo from 'react-native-device-info';
import {
  models,
  useSpeechToText,
  useTextToSpeech,
  REVERB_DEFAULT_VOICE_NAMES,
  REVERB_FRAME_RATE,
  REVERB_SAMPLE_RATE,
  WHISPER_SAMPLE_RATE_HZ,
  type ReverbDefaultVoiceName,
  type ReverbLanguage,
  type ReverbVoice,
} from 'react-native-executorch';

import ScreenWrapper from '../../components/ScreenWrapper';
import { ModelPicker } from '../../components/ModelPicker';
import { ModelStatus } from '../../components/ModelStatus';
import { Button } from '../../components/Button';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { theme } from '../../theme';

type ReverbVariant = Exclude<keyof typeof models.textToSpeech.REVERB, 'DEFAULT'>;

// The variant the registry resolves `DEFAULT` to on this device.
const DEFAULT_VARIANT = (
  Object.keys(models.textToSpeech.REVERB) as (keyof typeof models.textToSpeech.REVERB)[]
).find(
  (key): key is ReverbVariant =>
    key !== 'DEFAULT' && models.textToSpeech.REVERB[key] === models.textToSpeech.REVERB.DEFAULT
)!;

// An option without a platform runs on both.
const MODEL_OPTIONS: { label: string; value: ReverbVariant; platform?: typeof Platform.OS }[] = [
  { label: 'MLX int8', value: 'MLX_COREML_INT8', platform: 'ios' },
  { label: 'MLX fp16', value: 'MLX_COREML_FP16', platform: 'ios' },
  { label: 'MLX int4', value: 'MLX_COREML_INT4', platform: 'ios' },
  { label: 'Vulkan int4', value: 'VULKAN_INT4', platform: 'android' },
  // Offered where the registry picks it: a Snapdragon with the QNN backend linked.
  ...(DEFAULT_VARIANT === 'QNN_VULKAN_INT4'
    ? [{ label: 'QNN int4', value: 'QNN_VULKAN_INT4', platform: 'android' } as const]
    : []),
  // On the CPU, the codec included.
  { label: 'XNNPACK int8', value: 'XNNPACK_8DA8W' },
];

// Transcribes the recordings a new voice is made from.
const WHISPER_MODEL = models.speechToText.WHISPER.BASE.DEFAULT;

const LANGUAGES: { label: string; value: ReverbLanguage }[] = [
  { label: 'English', value: 'en' },
  { label: 'German', value: 'de' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'Italian', value: 'it' },
  { label: 'Polish', value: 'pl' },
  { label: 'Portuguese', value: 'pt' },
];

// cspell:disable
const SAMPLE_TEXTS: Record<ReverbLanguage, string> = {
  en: 'Reverb speaks in any voice, right on your phone.',
  de: 'Reverb spricht mit jeder Stimme, direkt am Handy.',
  es: 'Reverb habla con cualquier voz, en tu teléfono.',
  fr: "Reverb parle avec n'importe quelle voix, ici.",
  it: 'Reverb parla con qualsiasi voce, sul tuo telefono.',
  pl: 'Reverb mówi dowolnym głosem, prosto w telefonie.',
  pt: 'O Reverb fala com qualquer voz, no seu telefone.',
};
// cspell:enable

const PRESETS: { name: ReverbDefaultVoiceName; title: string; subtitle: string }[] = [
  { name: 'de_female_standard', title: 'Standard', subtitle: 'German · female' },
  { name: 'de_male_standard', title: 'Standard', subtitle: 'German · male' },
  { name: 'en_female_narrator', title: 'Narrator', subtitle: 'English · female' },
  { name: 'en_female_whisper', title: 'Whisper', subtitle: 'English · female' },
  { name: 'en_male_angry', title: 'Angry', subtitle: 'English · male' },
  { name: 'en_male_narrator_1', title: 'Narrator 1', subtitle: 'English · male' },
  { name: 'en_male_narrator_2', title: 'Narrator 2', subtitle: 'English · male' },
  { name: 'es_male_standard_1', title: 'Standard 1', subtitle: 'Spanish · male' },
  { name: 'es_male_standard_2', title: 'Standard 2', subtitle: 'Spanish · male' },
  { name: 'fr_female_standard', title: 'Standard', subtitle: 'French · female' },
  { name: 'fr_male_standard', title: 'Standard', subtitle: 'French · male' },
  { name: 'it_male_expressive', title: 'Expressive', subtitle: 'Italian · male' },
  { name: 'it_male_standard', title: 'Standard', subtitle: 'Italian · male' },
  { name: 'pl_male_standard', title: 'Standard', subtitle: 'Polish · male' },
  { name: 'pt_female_standard', title: 'Standard', subtitle: 'Portuguese · female' },
  { name: 'pt_male_standard', title: 'Standard', subtitle: 'Portuguese · male' },
];

const SPEED_OPTIONS = [0.8, 0.9, 1.0, 1.1, 1.25].map((value) => ({ label: `${value}x`, value }));
const STEPS_OPTIONS = [4, 6, 8, 12, 16].map((value) => ({
  label: value === 6 ? '6 (default)' : `${value}`,
  value,
}));
const VARIATION_OPTIONS = [0, 0.15, 0.25, 0.4].map((value) => ({
  label: value === 0.25 ? '0.25 (default)' : `${value}`,
  value,
}));

const MAX_RECORDING_S = 20;
const MIN_RECORDING_S = 1;
const SILENCE_DB = -45;
const SILENCE_BELOW_PEAK_DB = 25;
const METER_BARS = 24;

type PresetInfo = { transcript: string; language: string; duration: number };
type CustomVoice = { id: number; name: string; voice: ReverbVoice; duration: number };
type VoiceChoice =
  | { kind: 'preset'; name: ReverbDefaultVoiceName }
  | { kind: 'custom'; id: number };

const isSimulator = DeviceInfo.isEmulatorSync();

const messageOf = (err: unknown) => (err instanceof Error ? err.message : String(err));

const formatSeconds = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function concat(chunks: readonly Float32Array[]): Float32Array {
  const out = new Float32Array(chunks.reduce((n, chunk) => n + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

// Linear interpolation up; down, the mean of the input samples each output covers (a crude
// anti-alias filter).
function resample(input: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return input;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    if (ratio > 1) {
      const start = Math.floor(i * ratio);
      const end = Math.min(input.length, Math.max(start + 1, Math.floor((i + 1) * ratio)));
      let sum = 0;
      for (let j = start; j < end; j++) sum += input[j]!;
      out[i] = sum / (end - start);
    } else {
      const x = i * ratio;
      const j = Math.floor(x);
      out[i] = input[j]! + (input[Math.min(j + 1, input.length - 1)]! - input[j]!) * (x - j);
    }
  }
  return out;
}

const rms = (audio: Float32Array, start = 0, end = audio.length) => {
  let sum = 0;
  for (let i = start; i < end; i++) sum += audio[i]! * audio[i]!;
  return Math.sqrt(sum / Math.max(1, end - start));
};

// Drops the silence before the first and after the last word, keeping 0.15 s at each edge. Silence
// is relative to the loudest 20 ms: a phone's noise floor can sit above a fixed level (-42 dBFS
// measured on a Galaxy S24 FE).
function trimSilence(audio: Float32Array, rate: number): Float32Array {
  const win = Math.round(rate * 0.02);
  const levels: number[] = [];
  for (let start = 0; start < audio.length; start += win) {
    levels.push(rms(audio, start, Math.min(start + win, audio.length)));
  }
  const peak = levels.reduce((max, level) => Math.max(max, level), 0);
  const threshold = Math.max(10 ** (SILENCE_DB / 20), peak * 10 ** (-SILENCE_BELOW_PEAK_DB / 20));
  const first = levels.findIndex((level) => level >= threshold);
  if (first < 0) return audio;
  let last = levels.length - 1;
  while (levels[last]! < threshold) last--;
  const pad = Math.round(rate * 0.15);
  return audio.slice(
    Math.max(0, first * win - pad),
    Math.min(audio.length, (last + 1) * win + pad)
  );
}

// Records mono audio, resampled to Reverb's 24 kHz when the device delivers another rate.
function useVoiceRecorder() {
  const recorderRef = useRef<AudioRecorder | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const samplesRef = useRef(0);
  const rateRef = useRef(REVERB_SAMPLE_RATE);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);

  const start = useCallback(async (): Promise<string | null> => {
    if ((await AudioManager.requestRecordingPermissions()) !== 'Granted') {
      return 'Microphone access was denied.';
    }
    chunksRef.current = [];
    samplesRef.current = 0;
    setSeconds(0);
    const recorder = new AudioRecorder();
    recorder.onAudioReady(
      { sampleRate: REVERB_SAMPLE_RATE, bufferLength: REVERB_SAMPLE_RATE / 10, channelCount: 1 },
      (event) => {
        const samples = new Float32Array(event.buffer.getChannelData(0));
        rateRef.current = event.buffer.sampleRate;
        chunksRef.current.push(samples);
        samplesRef.current += samples.length;
        setSeconds(samplesRef.current / rateRef.current);
        const db = 20 * Math.log10(rms(samples) + 1e-9);
        setLevel(Math.min(1, Math.max(0, (db + 60) / 60)));
      }
    );
    const result = await recorder.start();
    if (result.status === 'error') {
      recorder.clearOnAudioReady();
      return result.message;
    }
    recorderRef.current = recorder;
    setIsRecording(true);
    return null;
  }, []);

  const stop = useCallback(async (): Promise<Float32Array | null> => {
    const recorder = recorderRef.current;
    if (!recorder) return null;
    recorderRef.current = null;
    recorder.clearOnAudioReady();
    await recorder.stop().catch(() => {});
    setIsRecording(false);
    setLevel(0);
    const audio = concat(chunksRef.current);
    chunksRef.current = [];
    return resample(audio, rateRef.current, REVERB_SAMPLE_RATE);
  }, []);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop().catch(() => {});
    };
  }, []);

  return { isRecording, seconds, level, start, stop };
}

function VoiceTile({
  title,
  subtitle,
  selected,
  disabled,
  onPress,
  onRemove,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  onRemove?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.voiceTile, selected && styles.voiceTileSelected, disabled && styles.dimmed]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.voiceTileHeader}>
        <View style={[styles.avatar, selected && styles.avatarSelected]}>
          <Text style={[styles.avatarText, selected && styles.avatarTextSelected]}>
            {title.charAt(0)}
          </Text>
        </View>
        {onRemove && !disabled && (
          <TouchableOpacity onPress={onRemove} hitSlop={10}>
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.voiceTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.voiceSubtitle} numberOfLines={1}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

function RecordButton({
  isRecording,
  disabled,
  onPress,
}: {
  isRecording: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isRecording) return;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true })
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [isRecording, pulse]);

  return (
    <View style={styles.recordButtonWrapper}>
      {isRecording && (
        <Animated.View
          style={[
            styles.recordPulse,
            {
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
              transform: [
                { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) },
              ],
            },
          ]}
        />
      )}
      <TouchableOpacity
        style={[styles.recordButton, disabled && styles.recordButtonDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
      >
        <View style={isRecording ? styles.recordStopIcon : styles.recordDotIcon} />
      </TouchableOpacity>
    </View>
  );
}

function LevelMeter({ level, active }: { level: number; active: boolean }) {
  const lit = active ? Math.round(level * METER_BARS) : 0;
  return (
    <View style={styles.meter}>
      {Array.from({ length: METER_BARS }, (_, i) => (
        <View
          key={i}
          style={[
            styles.meterBar,
            { height: 6 + ((i * 7) % 4) * 3 },
            i < lit && (i < METER_BARS * 0.8 ? styles.meterBarLit : styles.meterBarHot),
          ]}
        />
      ))}
    </View>
  );
}

function ReverbContent() {
  const [selectedModel, setSelectedModel] = useState<ReverbVariant>(DEFAULT_VARIANT);
  const [language, setLanguage] = useState<ReverbLanguage>('en');
  const [text, setText] = useState(SAMPLE_TEXTS.en);
  const [choice, setChoice] = useState<VoiceChoice>({ kind: 'preset', name: 'en_male_narrator_1' });
  const [presetInfo, setPresetInfo] = useState<Partial<Record<ReverbDefaultVoiceName, PresetInfo>>>(
    {}
  );
  const [customVoices, setCustomVoices] = useState<CustomVoice[]>([]);
  const nextVoiceId = useRef(1);

  const [speed, setSpeed] = useState(1.0);
  const [showSampler, setShowSampler] = useState(false);
  const [steps, setSteps] = useState(6);
  const [remaskRatio, setRemaskRatio] = useState(0.25);
  const [fixedSeed, setFixedSeed] = useState<number | null>(null);
  const [lastSeed, setLastSeed] = useState<number | null>(null);
  const [trimEdges, setTrimEdges] = useState(true);

  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [recording, setRecording] = useState<Float32Array | null>(null);
  const [transcript, setTranscript] = useState('');
  const [recordingLanguage, setRecordingLanguage] = useState<ReverbLanguage>('en');
  const [cloneStep, setCloneStep] = useState<'transcribing' | 'encoding' | null>(null);

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [chunkProgress, setChunkProgress] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const { isPlaying, playStream, stop } = useAudioPlayer(REVERB_SAMPLE_RATE);
  const recorder = useVoiceRecorder();

  const { isReady, downloadProgress, error, resource, synthesize, synthesizeStop, encodeVoice } =
    useTextToSpeech(models.textToSpeech.REVERB[selectedModel]);
  const whisper = useSpeechToText(WHISPER_MODEL, { preventLoad: !isCloneOpen });

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'default',
      iosOptions: ['defaultToSpeaker', 'allowBluetoothA2DP'],
    });
  }, []);

  useEffect(() => {
    return () => {
      synthesizeStop?.();
      stop();
    };
  }, [stop, synthesizeStop]);

  // The preset voices' reference transcripts and lengths, read from their JSON files.
  useEffect(() => {
    const voices = resource?.voices;
    if (!voices) return;
    let cancelled = false;
    (async () => {
      const info: Partial<Record<ReverbDefaultVoiceName, PresetInfo>> = {};
      for (const name of REVERB_DEFAULT_VOICE_NAMES) {
        try {
          const json = JSON.parse(await RNBlobUtil.fs.readFile(voices[name], 'utf8'));
          info[name] = {
            transcript: json.transcript,
            language: json.language,
            duration: json.codes.length / 8 / REVERB_FRAME_RATE,
          };
        } catch {
          // A preset without its description still synthesizes.
        }
      }
      if (!cancelled) setPresetInfo(info);
    })();
    return () => {
      cancelled = true;
    };
  }, [resource]);

  const selectedCustom =
    choice.kind === 'custom' ? customVoices.find((v) => v.id === choice.id) : undefined;
  const reference =
    choice.kind === 'preset'
      ? presetInfo[choice.name]
      : selectedCustom && {
          transcript: selectedCustom.voice.transcript,
          language: selectedCustom.voice.language,
          duration: selectedCustom.duration,
        };

  const isBusy = isSynthesizing || isPlaying || recorder.isRecording || cloneStep !== null;
  const recordingSeconds = recording ? recording.length / REVERB_SAMPLE_RATE : 0;

  const transcribeRecording = async (audio: Float32Array, lang: ReverbLanguage) => {
    if (!whisper.transcribe) return;
    setCloneStep('transcribing');
    try {
      const heard = await whisper.transcribe(
        resample(audio, REVERB_SAMPLE_RATE, WHISPER_SAMPLE_RATE_HZ),
        { language: lang }
      );
      setTranscript(heard.trim());
    } catch (err) {
      setRunError(messageOf(err));
    } finally {
      setCloneStep(null);
    }
  };

  const finishRecording = async () => {
    const audio = await recorder.stop();
    if (!audio) return;
    const trimmed = trimSilence(audio, REVERB_SAMPLE_RATE);
    setRecording(trimmed);
    setTranscript('');
    await transcribeRecording(trimmed, recordingLanguage);
  };

  const toggleRecording = async () => {
    if (recorder.isRecording) {
      await finishRecording();
      return;
    }
    setRunError(null);
    stop();
    const failure = await recorder.start();
    if (failure) setRunError(failure);
  };

  // Stops at the longest reference the encoder takes.
  useEffect(() => {
    if (recorder.isRecording && recorder.seconds >= MAX_RECORDING_S) finishRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.isRecording, recorder.seconds]);

  const playRecording = async () => {
    if (!recording) return;
    async function* once() {
      yield { audio: recording!, sampleRate: REVERB_SAMPLE_RATE };
    }
    await playStream(once()).catch((err) => setRunError(messageOf(err)));
  };

  const createVoice = async () => {
    if (!encodeVoice || !recording || !transcript.trim()) return;
    setRunError(null);
    setCloneStep('encoding');
    try {
      const voice = await encodeVoice(recording, transcript.trim(), recordingLanguage);
      const id = nextVoiceId.current++;
      setCustomVoices((voices) => [
        ...voices,
        { id, name: `My voice ${id}`, voice, duration: recordingSeconds },
      ]);
      setChoice({ kind: 'custom', id });
      setRecording(null);
      setTranscript('');
      setIsCloneOpen(false);
    } catch (err) {
      setRunError(messageOf(err));
    } finally {
      setCloneStep(null);
    }
  };

  const removeVoice = (id: number) => {
    setCustomVoices((voices) => voices.filter((v) => v.id !== id));
    if (choice.kind === 'custom' && choice.id === id) {
      setChoice({ kind: 'preset', name: 'en_male_narrator_1' });
    }
  };

  const handleSynthesize = async () => {
    const voice = choice.kind === 'preset' ? choice.name : selectedCustom?.voice;
    if (!synthesize || !voice || isBusy || !text.trim()) return;

    setRunError(null);
    setResult(null);
    setChunkProgress(null);
    setIsSynthesizing(true);

    const seed = fixedSeed ?? Math.floor(Math.random() * 2 ** 31);
    setLastSeed(seed);
    let audioSeconds = 0;
    let firstAudio: number | null = null;
    const t0 = performance.now();

    try {
      const chunks = synthesize(text, {
        voice,
        language,
        speed,
        sampling: { steps, remaskRatio, seed },
        postprocess: { enabled: trimEdges },
      });
      await playStream(
        chunks,
        (chunk) => {
          audioSeconds += chunk.duration;
          setChunkProgress(
            `Chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks} (${chunk.duration.toFixed(1)} s)`
          );
        },
        () => {
          firstAudio = (performance.now() - t0) / 1000;
        }
      );
      const elapsed = (performance.now() - t0) / 1000;
      setResult(
        `${audioSeconds.toFixed(1)} s of audio · first audio after ${(firstAudio ?? elapsed).toFixed(1)} s`
      );
      setChunkProgress(null);
    } catch (err) {
      setRunError(messageOf(err));
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleStop = () => {
    synthesizeStop?.();
    stop();
    setIsSynthesizing(false);
  };

  const selectLanguage = (lang: ReverbLanguage) => {
    if (text === SAMPLE_TEXTS[language]) setText(SAMPLE_TEXTS[lang]);
    setLanguage(lang);
    if (!recording) setRecordingLanguage(lang);
  };

  const whisperStatus = !whisper.isReady
    ? whisper.error
      ? `Whisper failed to load: ${whisper.error.message}`
      : `Loading Whisper to transcribe… ${Math.round(whisper.downloadProgress)}%`
    : cloneStep === 'transcribing'
      ? 'Transcribing with Whisper…'
      : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reverb Text-to-Speech</Text>
        <Text style={styles.cardDescription}>
          Speech in the voice of any short recording, in 7 languages, generated on-device. Pick a
          preset voice or clone your own.
        </Text>
        <ModelStatus
          isReady={isReady}
          downloadProgress={downloadProgress}
          error={error ? error.message : null}
          modelTypeLabel="Reverb models"
        />
        <ModelPicker
          label="Model"
          options={MODEL_OPTIONS.map((m) => ({
            label: m.label,
            value: m.value,
            disabled: isBusy || (m.platform !== undefined && m.platform !== Platform.OS),
          }))}
          selectedValue={selectedModel}
          onValueChange={setSelectedModel}
        />
      </View>

      {runError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{runError}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Voice</Text>
        <View style={styles.voiceGrid}>
          {PRESETS.map(({ name, title, subtitle }) => (
            <VoiceTile
              key={name}
              title={title}
              subtitle={subtitle}
              selected={choice.kind === 'preset' && choice.name === name}
              disabled={isBusy}
              onPress={() => setChoice({ kind: 'preset', name })}
            />
          ))}
          {customVoices.map((v) => (
            <VoiceTile
              key={v.id}
              title={v.name}
              subtitle={`Cloned · ${v.voice.language} · ${v.duration.toFixed(1)} s`}
              selected={choice.kind === 'custom' && choice.id === v.id}
              disabled={isBusy}
              onPress={() => setChoice({ kind: 'custom', id: v.id })}
              onRemove={() => removeVoice(v.id)}
            />
          ))}
          <TouchableOpacity
            style={[styles.voiceTile, styles.newVoiceTile, isCloneOpen && styles.newVoiceTileOpen]}
            onPress={() => setIsCloneOpen((open) => !open)}
            disabled={isBusy}
            activeOpacity={0.8}
          >
            <Text style={styles.newVoicePlus}>{isCloneOpen ? '–' : '+'}</Text>
            <Text style={styles.newVoiceText}>{isCloneOpen ? 'Close' : 'Clone a voice'}</Text>
          </TouchableOpacity>
        </View>

        {reference && !isCloneOpen && (
          <View style={styles.referenceBox}>
            <Text style={styles.referenceLabel}>
              Reference · {reference.language} · {reference.duration.toFixed(1)} s
            </Text>
            <Text style={styles.referenceText}>“{reference.transcript}”</Text>
          </View>
        )}

        {isCloneOpen && (
          <View style={styles.clonePanel}>
            <Text style={styles.stepTitle}>1 · Record a reference</Text>
            <Text style={styles.hint}>
              Read anything for 5–15 seconds in a quiet room. Reverb copies the voice, the pace and
              the mood of the recording.
            </Text>
            <View style={styles.recorderRow}>
              <RecordButton
                isRecording={recorder.isRecording}
                disabled={isSimulator || (!recorder.isRecording && isBusy)}
                onPress={toggleRecording}
              />
              <View style={styles.recorderInfo}>
                <Text style={styles.timer}>
                  {formatSeconds(recorder.isRecording ? recorder.seconds : recordingSeconds)}
                  <Text style={styles.timerLimit}> / {formatSeconds(MAX_RECORDING_S)}</Text>
                </Text>
                <LevelMeter level={recorder.level} active={recorder.isRecording} />
                <Text style={styles.recorderState}>
                  {isSimulator
                    ? 'Recording needs a physical device.'
                    : recorder.isRecording
                      ? 'Recording… tap to stop'
                      : recording
                        ? 'Recorded'
                        : 'Tap to record'}
                </Text>
              </View>
            </View>
            {recording && !recorder.isRecording && (
              <View style={styles.inlineButtons}>
                <TouchableOpacity
                  style={styles.ghostButton}
                  onPress={isPlaying ? stop : playRecording}
                  disabled={cloneStep !== null || isSynthesizing}
                >
                  <Text style={styles.ghostButtonText}>{isPlaying ? '■ Stop' : '▶ Listen'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ghostButton}
                  onPress={() => transcribeRecording(recording, recordingLanguage)}
                  disabled={!whisper.isReady || isBusy}
                >
                  <Text style={styles.ghostButtonText}>↻ Transcribe</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.stepTitle}>2 · Check the transcript</Text>
            <ModelPicker
              label="Spoken language"
              options={LANGUAGES.map((l) => ({ ...l, disabled: isBusy }))}
              selectedValue={recordingLanguage}
              onValueChange={setRecordingLanguage}
            />
            {whisperStatus && <Text style={styles.statusLine}>{whisperStatus}</Text>}
            <TextInput
              style={[styles.textInput, styles.transcriptInput]}
              value={transcript}
              onChangeText={setTranscript}
              placeholder="What the recording says, word for word"
              placeholderTextColor={theme.colors.textPlaceholder}
              multiline
              editable={!isBusy}
            />

            <Text style={styles.stepTitle}>3 · Create the voice</Text>
            <View style={styles.buttonRow}>
              <Button
                title="Create voice"
                onPress={createVoice}
                loading={cloneStep === 'encoding'}
                disabled={
                  !isReady ||
                  !recording ||
                  recordingSeconds < MIN_RECORDING_S ||
                  !transcript.trim() ||
                  isBusy
                }
              />
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Text</Text>
        <ModelPicker
          label="Language"
          options={LANGUAGES.map((l) => ({ ...l, disabled: isBusy }))}
          selectedValue={language}
          onValueChange={selectLanguage}
        />
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="Enter text to synthesize..."
          placeholderTextColor={theme.colors.textPlaceholder}
          multiline
          editable={!isBusy}
        />
      </View>

      <View style={styles.card}>
        <ModelPicker
          label="Speed"
          options={SPEED_OPTIONS.map((s) => ({ ...s, disabled: isBusy }))}
          selectedValue={speed}
          onValueChange={setSpeed}
        />
        <TouchableOpacity style={styles.disclosure} onPress={() => setShowSampler((v) => !v)}>
          <Text style={styles.disclosureText}>Sampler settings</Text>
          <Text style={styles.disclosureChevron}>{showSampler ? '▾' : '▸'}</Text>
        </TouchableOpacity>
        {showSampler && (
          <>
            <ModelPicker
              label="Steps"
              options={STEPS_OPTIONS.map((s) => ({ ...s, disabled: isBusy }))}
              selectedValue={steps}
              onValueChange={setSteps}
            />
            <ModelPicker
              label="Re-masking (variation)"
              options={VARIATION_OPTIONS.map((s) => ({ ...s, disabled: isBusy }))}
              selectedValue={remaskRatio}
              onValueChange={setRemaskRatio}
            />
            <ModelPicker
              label="Seed"
              options={[
                { label: 'New each take', value: false, disabled: isBusy },
                {
                  label: `Keep ${fixedSeed ?? lastSeed ?? 42}`,
                  value: true,
                  disabled: isBusy,
                },
              ]}
              selectedValue={fixedSeed !== null}
              onValueChange={(keep) => setFixedSeed(keep ? (lastSeed ?? 42) : null)}
            />
            <ModelPicker
              label="Trim silence"
              options={[
                { label: 'On', value: true, disabled: isBusy },
                { label: 'Off (raw output)', value: false, disabled: isBusy },
              ]}
              selectedValue={trimEdges}
              onValueChange={setTrimEdges}
            />
          </>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.buttonRow}>
          {!isPlaying ? (
            <Button
              title={isSynthesizing ? 'Synthesizing...' : 'Synthesize & Play'}
              onPress={handleSynthesize}
              disabled={!isReady || !text.trim() || isBusy}
              loading={isSynthesizing}
            />
          ) : (
            <Button title="Stop Playback" variant="accent" onPress={handleStop} />
          )}
        </View>
        {chunkProgress && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{chunkProgress}</Text>
          </View>
        )}
        {result && !isSynthesizing && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>{result}</Text>
            {lastSeed !== null && <Text style={styles.resultSubtext}>Seed {lastSeed}</Text>}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default function ReverbTTSScreen() {
  return (
    <ScreenWrapper>
      <ReverbContent />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.large, paddingBottom: 40 },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.large,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.lightBorder,
  },
  cardTitle: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: theme.typography.title.fontWeight,
    color: theme.colors.strongPrimary,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 12,
  },
  dimmed: { opacity: 0.5 },
  voiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  voiceTile: {
    width: '31%',
    minHeight: 96,
    padding: 10,
    borderRadius: theme.radius.medium,
    borderWidth: 1.5,
    borderColor: theme.colors.lightBorder,
    backgroundColor: theme.colors.background,
  },
  voiceTileSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#eef1fb',
  },
  voiceTileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.placeholderBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: { backgroundColor: theme.colors.primary },
  avatarText: { fontSize: 14, fontWeight: '700', color: theme.colors.textMuted },
  avatarTextSelected: { color: '#fff' },
  removeText: { fontSize: 13, color: theme.colors.textMuted },
  voiceTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.strongPrimary },
  voiceSubtitle: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
  newVoiceTile: {
    borderStyle: 'dashed',
    borderColor: theme.colors.accent,
    backgroundColor: '#f4f8fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newVoiceTileOpen: { borderStyle: 'solid' },
  newVoicePlus: { fontSize: 24, color: theme.colors.accent, fontWeight: '300' },
  newVoiceText: { fontSize: 12, color: theme.colors.accent, fontWeight: '600', marginTop: 2 },
  referenceBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: theme.radius.small,
    backgroundColor: theme.colors.background,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  referenceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  referenceText: { fontSize: 13, color: '#333', fontStyle: 'italic', lineHeight: 19 },
  clonePanel: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightBorder,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.strongPrimary,
    marginTop: 4,
    marginBottom: 8,
  },
  hint: { fontSize: 13, color: theme.colors.textMuted, lineHeight: 18, marginBottom: 14 },
  recorderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  recordButtonWrapper: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  recordPulse: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ff3b30',
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonDisabled: { borderColor: '#c7c7cc' },
  recordDotIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#ff3b30' },
  recordStopIcon: { width: 22, height: 22, borderRadius: 4, backgroundColor: '#ff3b30' },
  recorderInfo: { flex: 1 },
  timer: {
    fontSize: 26,
    fontWeight: '600',
    color: theme.colors.strongPrimary,
    fontVariant: ['tabular-nums'],
  },
  timerLimit: { fontSize: 15, fontWeight: '400', color: theme.colors.textMuted },
  meter: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 18, marginVertical: 6 },
  meterBar: { width: 4, borderRadius: 2, backgroundColor: theme.colors.placeholderBackground },
  meterBarLit: { backgroundColor: '#22c55e' },
  meterBarHot: { backgroundColor: '#f59e0b' },
  recorderState: { fontSize: 12, color: theme.colors.textMuted },
  inlineButtons: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  ghostButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  ghostButtonText: { fontSize: 13, color: theme.colors.primary, fontWeight: '600' },
  statusLine: { fontSize: 12, color: theme.colors.accent, marginBottom: 8 },
  textInput: {
    height: 120,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.small,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.background,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  transcriptInput: { height: 84, marginBottom: 14 },
  disclosure: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightBorder,
  },
  disclosureText: { fontSize: 14, fontWeight: '600', color: theme.colors.strongPrimary },
  disclosureChevron: { fontSize: 14, color: theme.colors.textMuted },
  buttonRow: { flexDirection: 'row', gap: theme.spacing.small },
  progressContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#e8f4fd',
    borderRadius: theme.radius.small,
  },
  progressText: { fontSize: 13, color: '#1a73e8', fontWeight: '500', textAlign: 'center' },
  resultContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#e6f9e6',
    borderRadius: theme.radius.small,
  },
  resultText: { fontSize: 13, color: '#2e7d32', fontWeight: '500', textAlign: 'center' },
  resultSubtext: { fontSize: 11, color: '#2e7d32', textAlign: 'center', marginTop: 2 },
  errorContainer: {
    backgroundColor: theme.colors.errorBackground,
    padding: 12,
    borderRadius: theme.radius.small,
    marginBottom: 20,
  },
  errorText: { color: theme.colors.errorText, fontSize: 14, textAlign: 'center' },
});
