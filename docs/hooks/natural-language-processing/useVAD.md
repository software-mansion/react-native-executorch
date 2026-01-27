# useVAD

Voice Activity Detection (VAD) is the task of analyzing an audio signal to identify time segments containing human speech, separating them from non-speech sections like silence and background noise.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/collections/software-mansion/speech-to-text-68d0ec99ed794250491b8bbe). You can also use [constants](https://github.com/software-mansion/react-native-executorch/blob/main/packages/react-native-executorch/src/constants/modelUrls.ts) shipped with our library.

## Reference[​](#reference "Direct link to Reference")

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

### Arguments[​](#arguments "Direct link to Arguments")

**`model`** - Object containing the model source.

* **`modelSource`** - A string that specifies the location of the model binary.

**`preventLoad?`** - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

### Returns[​](#returns "Direct link to Returns")

| Field              | Type                                               | Description                                                                                                                                     |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `forward`          | `(waveform: Float32Array) => Promise<{Segment[]}>` | Executes the model's forward pass, where input array should be a waveform at 16kHz. Returns a promise containing an array of `Segment` objects. |
| `error`            | `string \| null`                                   | Contains the error message if the model failed to load.                                                                                         |
| `isGenerating`     | `boolean`                                          | Indicates whether the model is currently processing an inference.                                                                               |
| `isReady`          | `boolean`                                          | Indicates whether the model has successfully loaded and is ready for inference.                                                                 |
| `downloadProgress` | `number`                                           | Represents the download progress as a value between 0 and 1.                                                                                    |

![](/react-native-executorch/img/Arrow.svg)![](/react-native-executorch/img/Arrow-dark.svg)Type definitions

```typescript
interface Segment {
  start: number;
  end: number;
}

```

## Running the model[​](#running-the-model "Direct link to Running the model")

Before running the model's `forward` method, make sure to extract the audio waveform you want to process. You'll need to handle this step yourself, ensuring the audio is sampled at 16 kHz. Once you have the waveform, pass it as an argument to the forward method. The method returns a promise that resolves to the array of detected speech segments.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)info

Timestamps in returned speech segments, correspond to indices of input array (waveform).

## Example[​](#example "Direct link to Example")

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

## Supported models[​](#supported-models "Direct link to Supported models")

* [fsmn-vad](https://huggingface.co/funasr/fsmn-vad)

## Benchmarks[​](#benchmarks "Direct link to Benchmarks")

### Model size[​](#model-size "Direct link to Model size")

| Model     | XNNPACK \[MB] |
| --------- | ------------- |
| FSMN\_VAD | 1.83          |

### Memory usage[​](#memory-usage "Direct link to Memory usage")

| Model     | Android (XNNPACK) \[MB] | iOS (XNNPACK) \[MB] |
| --------- | ----------------------- | ------------------- |
| FSMN\_VAD | 97                      | 45,9                |

### Inference time[​](#inference-time "Direct link to Inference time")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)warning

Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.

Inference time were measured on a 60s audio, that can be found [here](https://models.silero.ai/vad_models/en.wav).

| Model     | iPhone 16 Pro (XNNPACK) \[ms] | iPhone 14 Pro Max (XNNPACK) \[ms] | iPhone SE 3 (XNNPACK) \[ms] | OnePlus 12 (XNNPACK) \[ms] |
| --------- | ----------------------------- | --------------------------------- | --------------------------- | -------------------------- |
| FSMN\_VAD | 151                           | 171                               | 180                         | 109                        |
