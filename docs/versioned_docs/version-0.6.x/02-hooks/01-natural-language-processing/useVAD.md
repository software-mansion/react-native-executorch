---
title: useVAD
---

Voice Activity Detection (VAD) is the task of analyzing an audio signal to identify time segments containing human speech, separating them from non-speech sections like silence and background noise.

:::warning
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/speech-to-text-68d0ec99ed794250491b8bbe). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.
:::

## Reference

You can obtain waveform from audio in any way most suitable to you, however in the snippet below we utilize `react-native-audio-api` library to process a `.mp3` file.

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

### Arguments

**`model`** - Object containing the model source.

- **`modelSource`** - A string that specifies the location of the model binary.

**`preventLoad?`** - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

### Returns

| Field              | Type                                               | Description                                                                                                                                     |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `forward`          | `(waveform: Float32Array) => Promise<{Segment[]}>` | Executes the model's forward pass, where input array should be a waveform at 16kHz. Returns a promise containing an array of `Segment` objects. |
| `error`            | <code>string &#124; null</code>                    | Contains the error message if the model failed to load.                                                                                         |
| `isGenerating`     | `boolean`                                          | Indicates whether the model is currently processing an inference.                                                                               |
| `isReady`          | `boolean`                                          | Indicates whether the model has successfully loaded and is ready for inference.                                                                 |
| `downloadProgress` | `number`                                           | Represents the download progress as a value between 0 and 1.                                                                                    |

<details>
<summary>Type definitions</summary>

```typescript
interface Segment {
  start: number;
  end: number;
}
```

</details>
## Running the model

Before running the model's `forward` method, make sure to extract the audio waveform you want to process. You'll need to handle this step yourself, ensuring the audio is sampled at 16 kHz. Once you have the waveform, pass it as an argument to the forward method. The method returns a promise that resolves to the array of detected speech segments.

:::info
Timestamps in returned speech segments, correspond to indices of input array (waveform).
:::

## Example

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

## Supported models

- [fsmn-vad](https://huggingface.co/funasr/fsmn-vad)

## Benchmarks

### Model size

| Model    | XNNPACK [MB] |
| -------- | :----------: |
| FSMN_VAD |     1.83     |

### Memory usage

| Model    | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| -------- | :--------------------: | :----------------: |
| FSMN_VAD |           97           |        45,9        |

### Inference time

<!-- TODO: MEASURE INFERENCE TIME FOR SAMSUNG GALAXY S24 WHEN POSSIBLE -->

:::warning warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

Inference time were measured on a 60s audio, that can be found [here](https://models.silero.ai/vad_models/en.wav).

| Model    | iPhone 16 Pro (XNNPACK) [ms] | iPhone 14 Pro Max (XNNPACK) [ms] | iPhone SE 3 (XNNPACK) [ms] | OnePlus 12 (XNNPACK) [ms] |
| -------- | :--------------------------: | :------------------------------: | :------------------------: | :-----------------------: |
| FSMN_VAD |             151              |               171                |            180             |            109            |
