---
title: useSpeechToText
sidebar_position: 1
---

With the latest `v0.3.0` release we introduce a new hook - `useSpeechToText`. Speech to text is a task that allows to transform spoken language to written text. It is commonly used to implement features such as transcription or voice assistants. As of now, [every supported STT model](#supported-models) runs on the XNNPack backend.

:::info
Currently, we do not support direct microphone input streaming to the model. Instead, in  v0.3.0, we provide a way to transcribe an audio file.
:::

## Reference

```typescript
import { useSpeechToText, MOONSHINE_TOKENIZER_URL, MOONSHINE_TINY_ENCODER_URL, MOONSHINE_TINY_DECODER_URL } from 'react-native-executorch';

const model = useSpeechToText({
  encoderSource: MOONSHINE_TINY_ENCODER_URL,
  decoderSource: MOONSHINE_TINY_DECODER_URL,
  tokenizerSource: MOONSHINE_TOKENIZER_URL
  modelName: 'moonshine',
});

const audioUrl = 'https://your-url.com/never-gonna-give-you-up.mp3';

try {
  await model.loadAudio(audioUrl);
  const transcription = await model.transcribe();
  console.log(transcription);
} catch (error) {
  console.error(error);
}
```
### Streaming
Given that STT models need to take in a specified sequence length, there is a need to chunk the input audio. Chunking audio may result in cutting speech mid-sentence, which might be hard to understand for the model. To make it work, we employed an algorithm that uses overlapping audio chunks which might introduce some overhead, but gives way better results.

### Arguments
**`modelName`**
A literal of `"moonshine" | "whisper"` which serves as an identifier for which model should be used.

**`encoderSource?`**
A string that specifies the location of a .pte file for the encoder. For further information on passing model sources, check out [Loading Models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models). Defaults to (constants)[https://github.com/software-mansion/react-native-executorch/blob/main/src/constants/modelUrls.ts] for given model.

**`decoderSource?`**
Analogous to the encoderSource, this takes in a string which is a source for the decoder part of the model. Defaults to [constants](https://github.com/software-mansion/react-native-executorch/blob/main/src/constants/modelUrls.ts) for given model.

**`tokenizerSource?`**
A string that specifies the location to the tokenizer for the model. This works just as the encoder and decoder do. Defaults to [constants](https://github.com/software-mansion/react-native-executorch/blob/main/src/constants/modelUrls.ts) for given model.

**`overlapSeconds?`**
Specifies the length of overlap between each audio chunk.

**`windowSize?`**
Specifies the size of each audio chunk.

### Returns

| Field          | Type                                    | Description                                                                                                                                                                                                                                                         |
| -------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transcribe`   | `(input?: number[]) => Promise<string>` | Starts a transcription process for a given input array, which should be a waveform at 16kHz. When no input is provided, it uses an internal state which is set by calling `loadAudio`. Resolves a promise with the output transcription when the model is finished. |
| `loadAudio`    | `(url: string) => void`                 | Loads audio file from given url. It sets an internal state which serves as an input to `transcribe()`.                                                                                                                                                              |
| `error`        | <code>string &#124; null</code>         | Contains the error message if the model failed to load.                                                                                                                                                                                                             |
| `sequence`     | <code>string &#124; null</code>         | This property is updated with each generated token. If you're looking to obtain tokens as they're generated, you should use this property.                                                                                                                                                                                                                 |
| `isGenerating` | `boolean`                               | Indicates whether the model is currently processing an inference.                                                                                                                                                                                                   |
| `isReady`      | `boolean`                               | Indicates whether the model has successfully loaded and is ready for inference. |
| `downloadProgress`      | `number`                               | Tracks the progress of the model download process.                                                                                                                          |

## Running the model

To run the model, you can use the `transcribe` method. It accepts one optional argument, which is the waveform representation of the audio. If you called `loadAudio` beforehand, you don't need to pass anything to `transcribe`. However, you can still pass this argument if you want to use your own audio. This function returns a promise, which will return the generated tokens when everything succeeds. If the model fails during inference, it will throw an error. If you want to obtain tokens in streaming fashion, you can also use the `.sequence` property which is updated with each generated token, analogously to the useLLM hook.


## Example

```typescript
import { Button, Text } from 'react-native';
import { useSpeechToText, WHISPER_TOKENIZER_URL, WHISPER_TINY_ENCODER_URL, WHISPER_TINY_DECODER_URL } from 'react-native-executorch';

function App() {
  const model = useSpeechToText({
    encoderSource: WHISPER_TINY_ENCODER_URL,
    decoderSource: WHISPER_TINY_DECODER_URL,
    tokenizerSource: WHISPER_TOKENIZER_URL
    modelName: 'whisper',
  });
  const audioUrl = 'file:///Users/.../never-gonna-give-you-up.mp3';

  return (
    <Button
      onPress=(async () => {
        // Alternatively, you can obtain audio from any other source and pass it to transcribe()
        model.loadAudio(audioUrl);
        await model.transcribe();
      })
    />
    <Text>{model.sequence}</Text>
  )
  // ... Rest of your component
}
```
## Supported models
- [Whisper (tiny.en)](https://github.com/openai/whisper)
- [Moonshine (tiny)](https://github.com/usefulsensors/moonshine)

## Benchmarks

### Model size

| Model             | XNNPACK [MB] |
| ----------------- | ------------ |
| Whisper (tiny.en) | 231          |
| Moonshine tiny    | 149          |

### Memory usage

| Model             | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ----------------- | ---------------------- | ------------------ |
| Whisper (tiny.en) | ❌                      | 950                |
| Moonshine (tiny)  | ❌                      | 868                |

### Inference time

:::warning warning
Given that Whisper accepts a 30 seconds audio chunks, we employed a streaming algorithm to maintain consistency across long audio files. Therefore, data presented in this table may differ from what you experience in your apps.
:::

#### Decoder

| Model             | iPhone 16 Pro (XNNPack) | iPhone 13 Pro (XNNPack) | iPhone SE 3 (XNNPack) | Samsung Galaxy S24 (XNNPack) |
| ----------------- | ----------------------- | ----------------------- | --------------------- | ---------------------------- |
| Whisper (tiny.en) | 8.65 tokens/s           | 5.41 tokens/s           | 5.31 tokens/s         | ❌                            |
| Moonshine (tiny)  | 13.23 tokens/s          | 7.77 tokens/s           | 7.61 tokens/s         | ❌                            |

#### Encoder
| Model             | iPhone 16 Pro (XNNPack) | iPhone 13 Pro (XNNPack) | iPhone SE 3 (XNNPack) | Samsung Galaxy S24 (XNNPack) |
| ----------------- | ----------------------- | ----------------------- | --------------------- | ---------------------------- |
| Whisper (tiny.en) | 1.00s                   | 1.40s                   | 1.49s                 | ❌                            |
| Moonshine (tiny)  | 0.48s                   | 0.69s                   | 0.69s                 | ❌                            |

