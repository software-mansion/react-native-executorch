# Speech & Audio

Speech-to-text (Whisper), text-to-speech (Kokoro), and voice activity detection (FSMN). All audio is exchanged as `Float32Array` PCM through `react-native-audio-api`.

Pick models through the typed `models` registry:

- `models.speech_to_text.<model>({ quant?, backend? })`
- `models.text_to_speech.kokoro.<locale>.<voice>()` — bundles model + voice + phonemizer per language
- `models.vad.fsmn_vad()`

---

## Critical audio rules

- **STT input: 16 kHz mono.** Mismatched sample rates produce silently garbled transcriptions.
- **VAD input: 16 kHz mono.** Same constraint as STT.
- **TTS output: 24 kHz.** Create the playback `AudioContext` with `{ sampleRate: 24000 }`.

---

## Speech-to-text — `useSpeechToText`

### One-shot transcription

```tsx
import { useSpeechToText, models } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';

const stt = useSpeechToText({ model: models.speech_to_text.whisper_tiny_en() });

const { uri } = await FileSystem.downloadAsync(
  'https://example.com/file.mp3',
  FileSystem.cacheDirectory + 'audio.mp3'
);

const audioContext = new AudioContext({ sampleRate: 16000 });
const decoded = await audioContext.decodeAudioData(uri);
const buffer = decoded.getChannelData(0); // Float32Array @ 16 kHz mono

const { text } = await stt.transcribe(buffer);
```

### Multilingual

Use a multilingual Whisper accessor and pass a language code:

```tsx
const stt = useSpeechToText({ model: models.speech_to_text.whisper_tiny() });
const { text } = await stt.transcribe(buffer, { language: 'es' });
```

### Word-level timestamps

Pass `verbose: true` to get segments with per-word timing, log-probs, and compression ratios:

```ts
const result = await stt.transcribe(buffer, { verbose: true });
// {
//   task: 'transcription',
//   text: '…',
//   duration: 9.05,
//   language: 'en',
//   segments: [
//     {
//       start: 0,
//       end: 5.4,
//       text: '…',
//       words: [{ word: 'Example', start: 0, end: 1.4 }, …],
//       tokens: [...],
//       temperature: 0.0,
//       avgLogProb: -1.235,
//       compressionRatio: 1.63,
//     },
//   ],
// }
```

### Streaming transcription

For audio longer than 30 s, use streaming. It applies the whisper-streaming algorithm so audio is chunked without cutting mid-sentence.

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { Button, SafeAreaView, Text, View } from 'react-native';
import { useSpeechToText, models } from 'react-native-executorch';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';

export default function StreamingStt() {
  const stt = useSpeechToText({ model: models.speech_to_text.whisper_tiny_en() });
  const [text, setText] = useState('');
  const isRecording = useRef(false);
  const [recorder] = useState(() => new AudioRecorder());

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
    });
    AudioManager.requestRecordingPermissions();
  }, []);

  const start = async () => {
    isRecording.current = true;
    setText('');

    const sampleRate = 16000;
    recorder.onAudioReady(
      { sampleRate, bufferLength: 0.1 * sampleRate, channelCount: 1 },
      (chunk) => stt.streamInsert(chunk.buffer.getChannelData(0))
    );
    await recorder.start();

    let committed = '';
    for await (const { committed: c, nonCommitted } of stt.stream({ verbose: false })) {
      if (!isRecording.current) break;
      if (c.text) committed += c.text;
      setText(committed + nonCommitted.text);
    }
  };

  const stop = () => {
    isRecording.current = false;
    recorder.stop();
    stt.streamStop();
  };

  return (
    <SafeAreaView>
      <View style={{ padding: 20 }}>
        <Text>{text || 'Press start to speak…'}</Text>
        <Button title="Start" onPress={start} disabled={stt.isGenerating} />
        <Button title="Stop" color="red" onPress={stop} />
      </View>
    </SafeAreaView>
  );
}
```

**Available STT accessors:**

| Accessor | Languages |
|---|---|
| `models.speech_to_text.whisper_tiny_en` / `whisper_base_en` / `whisper_small_en` | English only |
| `models.speech_to_text.whisper_tiny` / `whisper_base` / `whisper_small` | Multilingual |

---

## Text-to-speech — `useTextToSpeech`

Pick a Kokoro preset that bundles the model, a voice, and the phonemizer for that language:

```tsx
import { useTextToSpeech, models } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

const tts = useTextToSpeech({
  model: models.text_to_speech.kokoro.en_us.heart(),
});

const audioContext = new AudioContext({ sampleRate: 24000 });

const speak = async (text: string) => {
  const waveform = await tts.forward({ text, speed: 1.0 }); // Float32Array @ 24 kHz

  const buffer = audioContext.createBuffer(1, waveform.length, 24000);
  buffer.getChannelData(0).set(waveform);

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();
};
```

### Streaming TTS

Stream chunks for lower time-to-first-audio on long text:

```tsx
await tts.stream({
  text: 'Long text streamed chunk by chunk…',
  speed: 1.0,
  onBegin: async () => console.log('start'),
  onNext: async (chunk) =>
    new Promise<void>((resolve) => {
      const buffer = audioContext.createBuffer(1, chunk.length, 24000);
      buffer.getChannelData(0).set(chunk);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.onEnded = () => resolve();
      source.start();
    }),
  onEnd: async () => console.log('done'),
  stopAutomatically: true,
});
```

### Phoneme input

If you already have phonemes (e.g. from a custom pronunciation pipeline), skip the phonemizer:

```tsx
const waveform = await tts.forwardFromPhonemes({ phonemes: 'hɛloʊ', speed: 1.0 });

await tts.streamFromPhonemes({
  phonemes: 'hɛloʊ wɜːld',
  speed: 1.0,
  onNext: async (chunk) => { /* play */ },
});
```

### Available TTS presets

`models.text_to_speech.kokoro.<locale>.<voice>` — locale + voice combinations:

| Locale | Voices |
|---|---|
| `en_us` | `heart`, `river`, `sarah`, `adam`, `michael`, `santa` |
| `en_gb` | `emma`, `daniel` |
| `fr` | `siwis` |
| `es` | `dora`, `alex` |
| `it` | `sara`, `nicola` |
| `pt` | `dora`, `santa` |
| `hi` | `alpha`, `omega`, `psi` |
| `pl` | `mateusz` |
| `de` | `anna` |

---

## Voice activity detection — `useVAD`

Detects speech segments in an audio buffer. Useful for trimming silence, segmenting recordings, or gating STT.

```tsx
import { useVAD, models } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';

const vad = useVAD({ model: models.vad.fsmn_vad() });

const { uri } = await FileSystem.downloadAsync(
  'https://example.com/file.mp3',
  FileSystem.cacheDirectory + 'vad.mp3'
);

const audioContext = new AudioContext({ sampleRate: 16000 });
const decoded = await audioContext.decodeAudioDataSource(uri);
const buffer = decoded.getChannelData(0);

const segments = await vad.forward(buffer);
// segments: { start: number, end: number }[]
// start/end are sample indices — divide by 16000 to get seconds
```

To concatenate detected speech into a single buffer:

```ts
const total = segments.reduce((s, seg) => s + (seg.end - seg.start), 0);
const out = audioContext.createBuffer(1, total, decoded.sampleRate);
const dst = out.getChannelData(0);
let off = 0;
for (const seg of segments) {
  const slice = buffer.subarray(seg.start, seg.end);
  dst.set(slice, off);
  off += slice.length;
}
```

---

## Troubleshooting

- **Whisper output is garbled.** Audio is not 16 kHz mono — check the `AudioContext` sample rate and that you're reading channel 0.
- **TTS sounds chipmunked or slow.** Playback `AudioContext` is at the wrong rate. Always use `{ sampleRate: 24000 }` for Kokoro output.
- **`StreamingNotStarted` when calling `streamInsert`.** You must start `stream()` before inserting chunks.
- **`StreamingInProgress` on a second `stream()` call.** Call `streamStop()` and wait before starting again.
- **VAD segments look wrong in seconds.** They're sample indices — divide by 16000.
- **iOS microphone is silent.** `AudioManager.requestRecordingPermissions()` must be called and the user must accept; verify the app has microphone Info.plist entitlements.

---

## See also

- [useSpeechToText API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useSpeechToText)
- [useTextToSpeech API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextToSpeech)
- [useVAD API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useVAD)
- [react-native-audio-api](https://docs.swmansion.com/react-native-audio-api/)
