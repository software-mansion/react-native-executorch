---
title: Audio related models usage
description: Reference for using Speech to Text, Text to Speech and Voice Activity Detection models.
---

# useSpeechToText

**Purpose:** Convert spoken audio to text (transcription).
**Use cases:** Voice assistants, transcription apps, voice commands, accessibility features.

## Basic Usage

```typescript
import { useSpeechToText, WHISPER_TINY_EN } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';

const model = useSpeechToText({
  model: WHISPER_TINY_EN,
});

const { uri } = await FileSystem.downloadAsync(
  'https://some-audio-url.com/file.mp3',
  FileSystem.cacheDirectory + 'audio_file'
);

const audioContext = new AudioContext({ sampleRate: 16000 });
const decodedAudioData = await audioContext.decodeAudioData(uri);
const audioBuffer = decodedAudioData.getChannelData(0);

try {
  const transcription = await model.transcribe(audioBuffer);
  console.log(transcription.text);
} catch (error) {
  console.error('Error during audio transcription', error);
}
```

## Multilingual Transcription

```typescript
import { WHISPER_TINY } from 'react-native-executorch';

const model = useSpeechToText({ model: WHISPER_TINY });

// Specify language
const transcription = await model.transcribe(spanishAudio, {
  language: 'es',
});
```

## Timestamps & Transcription Stat Data

You can obtain word-level timestamps and other useful parameters from transcription by setting `verbose: true` in the options:

```typescript
const transcription = await model.transcribe(audioBuffer, { verbose: true });
// Example result
// {
//   task: "transcription",
//   text: "Example text for a ...",
//   duration: 9.05,
//   language: "en",
//   segments: [
//     {
//       start: 0,
//       end: 5.4,
//       text: "Example text for",
//       words: [
//         {
//            word: "Example",
//            start: 0,
//            end: 1.4
//         },
//         ...
//       ],
//       tokens: [1, 32, 45, ...],
//       temperature: 0.0,
//       avgLogProb: -1.235,
//       compressionRatio: 1.632
//     },
//     ...
//   ]
// }
```

## Streaming Transcription

For audio longer than 30 seconds, use streaming transcription with the whisper-streaming algorithm. This intelligently chunks audio to avoid cutting speech mid-sentence:

```tsx
import React, { useEffect, useState, useRef } from 'react';
import { Text, Button, View, SafeAreaView } from 'react-native';
import { useSpeechToText, WHISPER_TINY_EN } from 'react-native-executorch';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';

export default function App() {
  const model = useSpeechToText({
    model: WHISPER_TINY_EN,
  });

  const [transcribedText, setTranscribedText] = useState('');

  const isRecordingRef = useRef(false);

  const [recorder] = useState(() => new AudioRecorder());

  useEffect(() => {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playAndRecord',
      iosMode: 'spokenAudio',
      iosOptions: ['allowBluetooth', 'defaultToSpeaker'],
    });
    AudioManager.requestRecordingPermissions();
  }, []);

  const handleStartStreamingTranscribe = async () => {
    isRecordingRef.current = true;
    setTranscribedText('');

    const sampleRate = 16000;

    recorder.onAudioReady(
      {
        sampleRate,
        bufferLength: 0.1 * sampleRate,
        channelCount: 1,
      },
      (chunk) => {
        model.streamInsert(chunk.buffer.getChannelData(0));
      }
    );

    try {
      await recorder.start();
    } catch (e) {
      console.error('Recorder failed:', e);
      return;
    }

    try {
      let accumulatedCommitted = '';

      const streamIter = model.stream({ verbose: false });

      for await (const { committed, nonCommitted } of streamIter) {
        if (!isRecordingRef.current) break;

        if (committed.text) {
          accumulatedCommitted += committed.text;
        }

        setTranscribedText(accumulatedCommitted + nonCommitted.text);
      }
    } catch (error) {
      console.error('Error during streaming transcription:', error);
    }
  };

  const handleStopStreamingTranscribe = () => {
    isRecordingRef.current = false;
    recorder.stop();
    model.streamStop();
  };

  return (
    <SafeAreaView>
      <View style={{ padding: 20 }}>
        <Text style={{ marginBottom: 20, fontSize: 18 }}>
          {transcribedText || 'Press start to speak...'}
        </Text>

        <Button
          onPress={handleStartStreamingTranscribe}
          title="Start Streaming"
          disabled={model.isGenerating}
        />
        <View style={{ height: 10 }} />
        <Button
          onPress={handleStopStreamingTranscribe}
          title="Stop Streaming"
          color="red"
        />
      </View>
    </SafeAreaView>
  );
}
```

## Troubleshooting

**Audio must be 16kHz:** Ensure proper sample rate before processing
**Streaming algorithm:** Use whisper-streaming for longer audio (handles 30s chunks automatically)

## Additional references

- [useSpeechToText docs](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useSpeechToText)
- [HuggingFace STT collection](https://huggingface.co/collections/software-mansion/speech-to-text)
- [Available models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---speech-to-text)
- [useSpeechToText API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useSpeechToText)
- [Typescript API implementation of useSpeechToText](https://docs.swmansion.com/react-native-executorch/docs/typescript-api/natural-language-processing/SpeechToTextModule)

---

# useTextToSpeech

**Purpose:** Convert text to natural-sounding speech (TTS).
**Use cases:** Voice assistants, audiobooks, accessibility tools, voice navigation.

## Basic Usage

```typescript
import {
  useTextToSpeech,
  KOKORO_MEDIUM,
  KOKORO_VOICE_AF_HEART,
} from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';

const model = useTextToSpeech({
  model: KOKORO_MEDIUM,
  voice: KOKORO_VOICE_AF_HEART,
});

const audioContext = new AudioContext({ sampleRate: 24000 });

const handleSpeech = async (text: string) => {
  const speed = 1.0;
  const waveform = await model.forward(text, speed);

  const audioBuffer = audioContext.createBuffer(1, waveform.length, 24000);
  audioBuffer.getChannelData(0).set(waveform);

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
};
```

## Streaming TTS

```typescript
// Stream chunks for lower latency
await tts.stream({
  text: 'Long text to be streamed chunk by chunk...',
  speed: 1.0,
  onNext: async (chunk) => {
    return new Promise((resolve) => {
      const buffer = ctx.createBuffer(1, chunk.length, 24000);
      buffer.getChannelData(0).set(chunk);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onEnded = () => resolve();
      source.start();
    });
  },
});
```

## Available Models & Voices

**Model:** Kokoro (English only)

For all available models check out [this exported HuggingFace models collection](https://huggingface.co/software-mansion/react-native-executorch-kokoro).

**Available Voices:**

- `KOKORO_VOICE_AF_HEART` - Female, heart
- `KOKORO_VOICE_AF_SKY` - Female, sky
- `KOKORO_VOICE_AF_BELLA` - Female, bella
- `KOKORO_VOICE_AF_NICOLE` - Female, nicole
- `KOKORO_VOICE_AF_SARAH` - Female, sarah
- `KOKORO_VOICE_AM_ADAM` - Male, adam
- `KOKORO_VOICE_AM_MICHAEL` - Male, michael
- `KOKORO_VOICE_BF_EMMA` - British Female, emma
- `KOKORO_VOICE_BF_ISABELLA` - British Female, isabella
- `KOKORO_VOICE_BM_GEORGE` - British Male, george
- `KOKORO_VOICE_BM_LEWIS` - British Male, lewis

## Troubleshooting

**Streaming vs Forward:** Use `stream()` for long texts to reduce time-to-first-audio

## Additional references

- [useTextToSpeech docs - reference and examples](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextToSpeech)
- [Supported Voices](https://docs.swmansion.com/react-native-executorch/docs/api-reference#tts-supported-voices)
- [useTextToSpeech API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useTextToSpeech)
- [HuggingFace TTS collection](https://huggingface.co/collections/software-mansion/text-to-speech)
- [Typescript API implementation of useTextToSpeech hook](https://docs.swmansion.com/react-native-executorch/docs/typescript-api/natural-language-processing/TextToSpeechModule)

---

# useVAD

**Purpose:** Detect speech segments in audio (Voice Activity Detection).

**Use cases:** Audio preprocessing, removing silence, speech segmentation, smart recording.

## Basic Usage

```typescript
import { useVAD, FSMN_VAD } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';

const model = useVAD({
  model: FSMN_VAD,
});

const { uri } = await FileSystem.downloadAsync(
  'https://some-audio-url.com/file.mp3',
  FileSystem.cacheDirectory + 'audio_file'
);

const audioContext = new AudioContext({ sampleRate: 16000 });
const decodedAudioData = await audioContext.decodeAudioDataSource(uri);
const audioBuffer = decodedAudioData.getChannelData(0);

try {
  // NOTE: to obtain segments in seconds, you need to divide
  // start / end of the segment by the sampling rate (16k)

  const speechSegments = await model.forward(audioBuffer);
  console.log(speechSegments);
} catch (error) {
  console.error('Error during running VAD model', error);
}
```

## Example usage

```tsx
import React from 'react';
import { Button, Text, SafeAreaView } from 'react-native';
import { useVAD, FSMN_VAD } from 'react-native-executorch';
import { AudioContext } from 'react-native-audio-api';
import * as FileSystem from 'expo-file-system';

export default function App() {
  const model = useVAD({
    model: FSMN_VAD,
  });

  const audioURL = 'https://some-audio-url.com/file.mp3';

  const handleAudio = async () => {
    if (!model) {
      console.error('VAD model is not loaded yet.');
      return;
    }

    console.log('Processing URL:', audioURL);

    try {
      const { uri } = await FileSystem.downloadAsync(
        audioURL,
        FileSystem.cacheDirectory + 'vad_example.tmp'
      );

      const audioContext = new AudioContext({ sampleRate: 16000 });
      const originalDecodedBuffer =
        await audioContext.decodeAudioDataSource(uri);
      const originalChannelData = originalDecodedBuffer.getChannelData(0);

      const segments = await model.forward(originalChannelData);
      if (segments.length === 0) {
        console.log('No speech segments were found.');
        return;
      }
      console.log(`Found ${segments.length} speech segments.`);

      const totalLength = segments.reduce(
        (sum, seg) => sum + (seg.end - seg.start),
        0
      );
      const newAudioBuffer = audioContext.createBuffer(
        1, // Mono
        totalLength,
        originalDecodedBuffer.sampleRate
      );
      const newChannelData = newAudioBuffer.getChannelData(0);

      let offset = 0;
      for (const segment of segments) {
        const slice = originalChannelData.subarray(segment.start, segment.end);
        newChannelData.set(slice, offset);
        offset += slice.length;
      }

      //  Play the processed audio
      const source = audioContext.createBufferSource();
      source.buffer = newAudioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Error processing audio data:', error);
    }
  };

  return (
    <SafeAreaView>
      <Text>
        Press the button to process and play speech from a sample file.
      </Text>
      <Button onPress={handleAudio} title="Run VAD Example" />
    </SafeAreaView>
  );
}
```

## Available Models

**Model:** [FSMN-VAD](https://huggingface.co/software-mansion/react-native-executorch-fsmn-vad)

For all available models check out exported models in [this HuggingFace VAD models collection](https://huggingface.co/collections/software-mansion/voice-activity-detection).

## Troubleshooting

**Audio must be 16kHz:** Ensure proper sample rate  
**Timestamps are indices:** Divide by sample rate (16000) to get seconds  
**Returns array of segments:** `[{ start: number, end: number }]`

## Additional references

- [useVAD docs](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useVAD)
- [HuggingFace VAD collection](https://huggingface.co/collections/software-mansion/voice-activity-detection)
- [useVAD API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useVAD)
- [available VAD model constants](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---voice-activity-detection)
- [Typescript API implementation of useVad hook](https://docs.swmansion.com/react-native-executorch/docs/typescript-api/natural-language-processing/VADModule)
