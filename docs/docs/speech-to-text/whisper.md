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
import { useSpeechToText, MOONSHINE_TINY_TOKENIZER_URL, MOONSHINE_TINY_ENCODER_URL, MOONSHINE_TINY_DECODER_URL } from 'react-native-executorch';

const model = useSpeechToText({
  encoderSource: MOONSHINE_TINY_ENCODER_URL,
  decoderSource: MOONSHINE_TINY_DECODER_URL,
  tokenizerSource: MOONSHINE_TINY_TOKENIZER_URL
  modelName: 'moonshine',
});

const audioUrl = 'https://your-url.com/never-gonna-give-you-up.mp3';

try {
  const audio = await model.loadAudio(audioUrl);
  const transcription = await model.transcribe();
  console.log(transcription);
} catch (error) {
  console.error(error);
}
```

### Arguments
**`encoderSource`**
A string that specifies the location of a .pte file for the encoder. For further information on passing model sources, check out [Loading Models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models).

`decoderSource`
Analogous to the encoderSource, this takes in a string which is a source for the decoder part of the model.

`tokenizerSource`
A string that specifies the location to the tokenizer for the model. This works just as the encoder and decoder do.

`modelName`
A literal of `"moonshine" | "whisper"` which serves as an identifier for which model should be used



### Returns

| Field          | Type                                    | Description                                                                                                                                                                                                                                                                                                             |
| -------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transcribe`   | `(input: number[]?) => Promise<string>` | Starts a transcription process for a given input array, which should be a waveform at 16kHz. This can be obtained from the `loadAudio` function. When no input is provided, it uses an internal state which is set by calling `loadAudio`. Resolves a promise with the output transcription when the model is finished. |
| `loadAudio`    | `(url: string) => number[]`             | Loads audio file from given URL and returns a waveform, which serves as an input to `transcribe()`. It also sets an internal state for the input, so when you call `loadAudio`, you don't need to pass anything to `transcribe`.                                                                                        |
| `error`        | <code>string &#124; null</code>         | Contains the error message if the model failed to load.                                                                                                                                                                                                                                                                 |
| `response`     | <code>string &#124; null</code>         | This property is updated with each generated token.                                                                                                                                                                                                                                                                     |
| `isGenerating` | `boolean`                               | Indicates whether the model is currently processing an inference.                                                                                                                                                                                                                                                       |
| `isReady`      | `boolean`                               | Indicates whether the model has successfully loaded and is ready for inference.                                                                                                                                                                                                                                         |

## Running the model

To run the model, you can use the `transcribe` method. It accepts one optional argument, which is the waveform representation of the audio. If you called `loadAudio` beforehand, you don't need to pass anything to `transcribe`. However, you can still pass this argument if you want to use your own audio. This function returns a promise, which will return the generated tokens when everything succeeds. If the model fails during inference, it will throw an error. If you want to obtain tokens in streaming fashion, you can also use the `.response` property which is updated with each generated token, analogously to the useLLM hook.


## Example

```typescript
import { Button, Text } from 'react-native';
import { useSpeechToText, WHISPER_TINY_TOKENIZER_URL, WHISPER_TINY_ENCODER_URL, WHISPER_TINY_DECODER_URL } from 'react-native-executorch';

function App() {
  const model = useSpeechToText({
    encoderSource: WHISPER_TINY_ENCODER_URL,
    decoderSource: WHISPER_TINY_DECODER_URL,
    tokenizerSource: WHISPER_TINY_TOKENIZER_URL
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
    <Text>{model.response}</Text>
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
| Whisper (tiny.en) | 8.65 tokens/s           | 5.41 tokens/s           | 5.31 tokens/s         | 20.0 tokens/s                |
| Moonshine (tiny)  | 13.23 tokens/s          | 7.77 tokens/s           | 7.61 tokens/s         | 20.0 tokens/s                |

#### Encoder
| Model             | iPhone 16 Pro (XNNPack) | iPhone 13 Pro (XNNPack) | iPhone SE 3 (XNNPack) | Samsung Galaxy S24 (XNNPack) |
| ----------------- | ----------------------- | ----------------------- | --------------------- | ---------------------------- |
| Whisper (tiny.en) | 1.00s                   | 1.40s                   | 1.49s                 | 1.00s                        |
| Moonshine (tiny)  | 0.48s                   | 0.69s                   | 0.69s                 | 1.00s                        |

