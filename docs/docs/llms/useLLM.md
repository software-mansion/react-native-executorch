---
title: useLLM
sidebar_position: 1
keywords:
  [
    llm,
    large language model,
    llama,
    llama 3,
    react native,
    executorch,
    ai,
    machine learning,
    on-device,
    mobile ai,
    inference,
    text generation,
  ]
description: "Learn how to use Llama models in your React Native applications with React Native ExecuTorch's useLLM hook."
---

React Native ExecuTorch supports Llama 3.2 models, including quantized versions. Before getting started, you’ll need to obtain the .pte binary—a serialized model—and the tokenizer. There are various ways to accomplish this:

- For your convienience, it's best if you use models exported by us, you can get them from our [HuggingFace repository](https://huggingface.co/software-mansion/react-native-executorch-llama-3.2). You can also use [constants](https://github.com/software-mansion/react-native-executorch/tree/main/src/constants/modelUrls.ts) shipped with our library.
- If you want to export model by yourself, you can use a Docker image that we've prepared. To see how it works, check out [exporting Llama](./exporting-llama)
- Follow the official [tutorial](https://github.com/pytorch/executorch/blob/fe20be98c/examples/demo-apps/android/LlamaDemo/docs/delegates/xnnpack_README.md) made by ExecuTorch team to build the model and tokenizer yourself

## Initializing

In order to load a model into the app, you need to run the following code:

```typescript
import { useLLM, LLAMA3_2_1B } from 'react-native-executorch';

const messageHistory = [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi, how can I help you?' },
];

const llama = useLLM({
  modelSource: LLAMA3_2_1B,
  tokenizerSource: require('../assets/tokenizer.bin'),
  systemPrompt: 'Be a helpful assistant',
  messageHistory: messageHistory,
  contextWindowLength: 3,
});
```

<details>
<summary>Type definitions</summary>

```typescript
const useLLM: ({
  modelSource,
  tokenizerSource,
  systemPrompt,
  messageHistory,
  contextWindowLength,
}: {
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
  systemPrompt?: string;
  messageHistory?: MessageType[];
  contextWindowLength?: number;
}) => Model;

interface Model {
  generate: (input: string) => Promise<void>;
  response: string;
  downloadProgress: number;
  error: string | null;
  isModelGenerating: boolean;
  isGenerating: boolean;
  isModelReady: boolean;
  isReady: boolean;
  interrupt: () => void;
}

type ResourceSource = string | number;

interface MessageType {
  role: 'user' | 'assistant';
  content: string;
}
```

</details>

<br/>

The code snippet above fetches the model from the specified URL, loads it into memory, and returns an object with various methods and properties for controlling the model. You can monitor the loading progress by checking the `llama.downloadProgress` and `llama.isReady` property, and if anything goes wrong, the `llama.error` property will contain the error message.

:::danger
Lower-end devices might not be able to fit LLMs into memory. We recommend using quantized models to reduce the memory footprint.
:::

:::caution
Given computational constraints, our architecture is designed to support only one instance of the model runner at the time. Consequently, this means you can have only one active component leveraging `useLLM` concurrently.
:::

### Arguments

**`modelSource`** - A string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) section.

**`tokenizerSource`** - URL to the binary file which contains the tokenizer

**`systemPrompt`** - Often used to tell the model what is its purpose, for example - "Be a helpful translator"

**`messageHistory`** - An array of `MessageType` objects that represent the conversation history. This can be used to provide context to the model.

**`contextWindowLength`** - The number of messages from the current conversation that the model will use to generate a response. The higher the number, the more context the model will have. Keep in mind that using larger context windows will result in longer inference time and higher memory usage.

:::note
Make sure that the reference to the `messageHistory` array is stable. Depending on your use case, you might use `useState` or `useRef` to store the message history.
:::

### Returns

| Field              | Type                               | Description                                                                                                     |
| ------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `generate`         | `(input: string) => Promise<void>` | Function to start generating a response with the given input string.                                            |
| `response`         | `string`                           | State of the generated response. This field is updated with each token generated by the model                   |
| `error`            | <code>string &#124; null</code>    | Contains the error message if the model failed to load                                                          |
| `isGenerating`     | `boolean`                          | Indicates whether the model is currently generating a response                                                  |
| `interrupt`        | `() => void`                       | Function to interrupt the current inference                                                                     |
| `isReady`          | `boolean`                          | Indicates whether the model is ready                                                                            |
| `downloadProgress` | `number`                           | Represents the download progress as a value between 0 and 1, indicating the extent of the model file retrieval. |

## Sending a message

In order to send a message to the model, one can use the following code:

```typescript
const llama = useLLM({
    modelSource: LLAMA3_2_1B,
    tokenizerSource: require('../assets/tokenizer.bin'),
});

...
const message = 'Hi, who are you?';
await llama.generate(message);
...
```

## Listening for the response

As you might've noticed, there is no return value from the `runInference` function. Instead, the `.response` field of the model is updated with each token.
This is how you can render the response of the model:

```typescript
...
return (
    <Text>{llama.response}</Text>
)
```

Behind the scenes, tokens are generated one by one, and the response property is updated with each token as it’s created. This means that the text component will re-render whenever llama.response gets updated.

Sometimes, you might want to stop the model while it’s generating. To do this, you can use `interrupt()`, which will halt the model and append the current response to its internal conversation state.

There are also cases when you need to check if tokens are being generated, such as to conditionally render a stop button. We’ve made this easy with the `isTokenBeingGenerated` property.

## Benchmarks

### Model size

| Model                 | XNNPACK [GB] |
| --------------------- | ------------ |
| LLAMA3_2_1B           | 2.47         |
| LLAMA3_2_1B_SPINQUANT | 1.14         |
| LLAMA3_2_1B_QLORA     | 1.18         |
| LLAMA3_2_3B           | 6.43         |
| LLAMA3_2_3B_SPINQUANT | 2.55         |
| LLAMA3_2_3B_QLORA     | 2.65         |

### Memory usage

| Model                 | Android (XNNPACK) [GB] | iOS (XNNPACK) [GB] |
| --------------------- | ---------------------- | ------------------ |
| LLAMA3_2_1B           | 3.2                    | 3.1                |
| LLAMA3_2_1B_SPINQUANT | 1.9                    | 2                  |
| LLAMA3_2_1B_QLORA     | 2.2                    | 2.5                |
| LLAMA3_2_3B           | 7.1                    | 7.3                |
| LLAMA3_2_3B_SPINQUANT | 3.7                    | 3.8                |
| LLAMA3_2_3B_QLORA     | 4                      | 4.1                |

### Inference time

| Model                 | iPhone 16 Pro (XNNPACK) [tokens/s] | iPhone 13 Pro (XNNPACK) [tokens/s] | iPhone SE 3 (XNNPACK) [tokens/s] | Samsung Galaxy S24 (XNNPACK) [tokens/s] | OnePlus 12 (XNNPACK) [tokens/s] |
| --------------------- | ---------------------------------- | ---------------------------------- | -------------------------------- | --------------------------------------- | ------------------------------- |
| LLAMA3_2_1B           | 16.1                               | 11.4                               | ❌                               | 15.6                                    | 19.3                            |
| LLAMA3_2_1B_SPINQUANT | 40.6                               | 16.7                               | 16.5                             | 40.3                                    | 48.2                            |
| LLAMA3_2_1B_QLORA     | 31.8                               | 11.4                               | 11.2                             | 37.3                                    | 44.4                            |
| LLAMA3_2_3B           | ❌                                 | ❌                                 | ❌                               | ❌                                      | 7.1                             |
| LLAMA3_2_3B_SPINQUANT | 17.2                               | 8.2                                | ❌                               | 16.2                                    | 19.4                            |
| LLAMA3_2_3B_QLORA     | 14.5                               | ❌                                 | ❌                               | 14.8                                    | 18.1                            |

❌ - Insufficient RAM.
