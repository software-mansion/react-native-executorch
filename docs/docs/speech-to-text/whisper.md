---
title: useSpeechToText
sidebar_position: 1
---

With the latest `v0.3.0` release we introduce a new hook - `useSpeechToText`. Speech to text is a task that allows to transform spoken language to written text. It is commonly used to implement features such as transcription, or voice assistants. Currently, all the models are running on XNNPack backend. We support `Whisper (tiny.en)` and `Moonshine` models.

:::info
Currently, we do not support direct microphone input streaming to the model. Instead, in  `v0.3.0`, we provide a method that accepts an URL to the audio file.
:::

## Reference

```typescript
import { useSpeechToText } from 'react-native-executorch';

const model = useSpeechToText({
  modelName: 'moonshine',
});

const audioUrl = 'https://your-url.com/never-gonna-give-you-up.mp3';

try {
  const transcription = await model.transcribe(audioUrl);
  console.log(transcription);
} catch (error) {
  console.error(error);
}
```

### Arguments

**`modelName`**
Can be either `'whisper'` or `'moonshine'`. The first one will use the [Whisper](https://openai.com/index/whisper/), while the latter will run [Moonshine](https://github.com/usefulsensors/moonshine). For best performance, we recommend using Moonshine.

### Returns

| Field          | Type                                                         | Description                                                                                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `transcribe`      | `(input: string) => Promise<string>` | Starts a transcription process for an audio at given `input` URL. Resolves a promise with the output transcription when the model is finished. |
| `error`        | <code>string &#124; null</code>                              | Contains the error message if the model failed to load.                                                  |
| `response`        | <code>string &#124; null</code>                              | This property is updated with each generated token.                                                  |
| `isGenerating` | `boolean`                                                    | Indicates whether the model is currently processing an inference.                                        |
| `isReady`      | `boolean`                                                    | Indicates whether the model has successfully loaded and is ready for inference.                          |

## Running the model

To run the model, you can use the `transcribe` method. It accepts one argument, which is the URL to the audio file. The function returns a promise, which will return the generated tokens when everything succeeds. If the model fails, it will throw an error. If you want to stream tokens, you can also use the `.response` property which is updated with each generated token, analogously to the useLLM hook.


## Example

```typescript
import { Button, Text } from 'react-native';
import { useSpeechToText } from 'react-native-executorch';

function App() {
  const model = useSpeechToText({
    modelName: 'whisper',
  });
  const audioUrl = 'file:///Users/.../never-gonna-give-you-up.mp3';

  return (
    <Button
      onPress=(async () => {
        const transcription = await model.transcribe(audioUrl);;
      })
    />
    <Text>{model.response}</Text>
  )
  // ... Rest of your component
}
```
## Supported models
- [Whisper tiny.en](https://github.com/openai/whisper)
- [Moonshine](https://github.com/usefulsensors/moonshine)

## Benchmarks

### Model size

| Model             | XNNPACK [MB] |
| ----------------- | ------------ |
| Whisper | 231     |
| Moonshine | 149   |

### Memory usage

| Model             | Android (XNNPACK) [MB] | iOS (XNNPACK) [MB] |
| ----------------- | ---------------------- | ------------------ |
| Whisper | ❌                    | 950                 |

### Inference time

:::warning warning
Times presented in the tables are measured as consecutive runs of the model. Initial run times may be up to 2x longer due to model loading and initialization.
:::

#### Decoder

| Model | iPhone 16 Pro (XNNPack) | iPhone 13 Pro (XNNPack) | iPhone SE 3 (XNNPack) | Samsung Galaxy S24 (XNNPack) |
| ------ | -----------------------| ---------------------- | --------------------- | ---------------------------- |
| Whisper (tiny.en) | 18.5 tokens/s | 12.4 tokens/s | 12.4 tokens/s | 20.0 tokens/s |

#### Encoder
| Model | iPhone 16 Pro (XNNPack) | iPhone 13 Pro (XNNPack) | iPhone SE 3 (XNNPack) | Samsung Galaxy S24 (XNNPack) |
| ------ | -----------------------| ---------------------- | --------------------- | ---------------------------- |
| Whisper (tiny.en) | 0.71s | 1.06s | 1.18s | 1.00s |

#

