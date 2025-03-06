---
title: useSpeechToText
sidebar_position: 1
---

With the latest `v0.3.0` release we introduce a new hook - `useSpeechToText`. Speech to text is a task that allows to transform spoken language to written text. It is commonly used to implement features such as transcription or voice assistants. As of now, [all supported STT models](#supported-models) run on the XNNPACK backend.

:::info
Currently, we do not support direct microphone input streaming to the model. Instead, in v0.3.0, we provide a way to transcribe an audio file.
:::

:::caution
It is recommended to use models provided by us, which are available at our [Hugging Face repository](https://huggingface.co/software-mansion/react-native-executorch-moonshine-tiny). You can also use [constants](https://github.com/software-mansion/react-native-executorch/tree/main/src/constants/modelUrls.ts) shipped with our library
:::

## Reference

```typescript
import { useSpeechToText } from 'react-native-executorch';

const { transcribe, error, loadAudio } = useSpeechToText({
  modelName: 'moonshine',
});

const audioUrl = ...; // URL with audio to transcribe

await loadAudio(audioUrl);
const transcription = await transcribe();
if (error) {
  console.log(error);
} else {
  console.log(transcription);
}
```

### Streaming

Given that STT models can process audio no longer than 30 seconds, there is a need to chunk the input audio. Chunking audio may result in cutting speech mid-sentence, which might be hard to understand for the model. To make it work, we employed an algorithm (adapted for mobile devices from [whisper-streaming](https://aclanthology.org/2023.ijcnlp-demo.3.pdf)) that uses overlapping audio chunks. This might introduce some overhead, but allows for processing audio inputs of arbitrary length.

### Arguments

**`modelName`**
A literal of `"moonshine" | "whisper"` which serves as an identifier for which model should be used.

**`encoderSource?`**
A string that specifies the location of a .pte file for the encoder. For further information on passing model sources, check out [Loading Models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models). Defaults to [constants](https://github.com/software-mansion/react-native-executorch/blob/main/src/constants/modelUrls.ts) for given model.

**`decoderSource?`**
Analogous to the encoderSource, this takes in a string which is a source for the decoder part of the model. Defaults to [constants](https://github.com/software-mansion/react-native-executorch/blob/main/src/constants/modelUrls.ts) for given model.

**`tokenizerSource?`**
A string that specifies the location to the tokenizer for the model. This works just as the encoder and decoder do. Defaults to [constants](https://github.com/software-mansion/react-native-executorch/blob/main/src/constants/modelUrls.ts) for given model.

**`overlapSeconds?`**
Specifies the length of overlap between consecutive audio chunks (expressed in seconds).

**`windowSize?`**
Specifies the size of each audio chunk (expressed in seconds).

### Returns

| Field              | Type                                    | Description                                                                                                                                                                                                                                                         |
| ------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transcribe`       | `(input?: number[]) => Promise<string>` | Starts a transcription process for a given input array, which should be a waveform at 16kHz. When no input is provided, it uses an internal state which is set by calling `loadAudio`. Resolves a promise with the output transcription when the model is finished. |
| `loadAudio`        | `(url: string) => void`                 | Loads audio file from given url. It sets an internal state which serves as an input to `transcribe()`.                                                                                                                                                              |
| `error`            | <code>Error &#124; undefined</code>         | Contains the error message if the model failed to load.                                                                                                                                                                                                             |
| `sequence`         | <code>string</code>         | This property is updated with each generated token. If you're looking to obtain tokens as they're generated, you should use this property.                                                                                                                          |
| `isGenerating`     | `boolean`                               | Indicates whether the model is currently processing an inference.                                                                                                                                                                                                   |
| `isReady`          | `boolean`                               | Indicates whether the model has successfully loaded and is ready for inference.                                                                                                                                                                                     |
| `downloadProgress` | `number`                                | Tracks the progress of the model download process.                                                                                                                                                                                                                  |

## Running the model

Before running the model's `transcribe` method be sure to obtain waveform of the audio You wish to transcribe. You can either use `loadAudio` method to load audio from a url and save it in model's internal state or obtain the waveform on your own (remember to use sampling rate of 16kHz!). In the latter case just pass the obtained waveform as argument to the `transcribe` method which returns a promise resolving to the generated tokens when successful. If the model fails during inference the `error` property contains details of the error. If you want to obtain tokens in a streaming fashion, you can also use the sequence property, which is updated with each generated token, similar to the [useLLM](../llms/useLLM.md) hook.

## Example

```typescript
import { Button, Text } from 'react-native';
import { useSpeechToText } from 'react-native-executorch';

function App() {
  const { loadAudio, transcribe, sequence, error } = useSpeechToText({
    modelName: 'whisper',
  });

  const audioUrl = ...; // URL with audio to transcribe

  return (
    <View>
      <Button
        onPress={async () => {
          await loadAudio(audioUrl);
          await transcribe();
        }
        title="Transcribe"
      />
      <Text>{error ? error : sequence}</Text>
    </View>
  );
}
```

## Supported models

| Model                                                                 | Language |
| --------------------------------------------------------------------- | -------- |
| [Whisper tiny.en](https://huggingface.co/openai/whisper-tiny.en)      | English  |
| [Moonshine tiny](https://huggingface.co/UsefulSensors/moonshine-tiny) | English  |

## Benchmarks

### Model size

| Model          | XNNPACK [MB] |
| -------------- | ------------ |
| WHISPER_TINY   | 231.0        |
| MOONSHINE_TINY | 148.9        |

### Memory usage

| Model          | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| -------------- | ---------------------- | ------------------ |
| WHISPER_TINY   | 900                    | 600                |
| MOONSHINE_TINY | 650                    | 560                |
