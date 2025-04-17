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
    tool calling,
    function calling,
  ]
description: "Learn how to use LLMs in your React Native applications with React Native ExecuTorch's useLLM hook."
---

React Native ExecuTorch supports Llama 3.2 models, including quantized versions (and few other LLMs as well, checkout our [HuggingFace repository](https://huggingface.co/software-mansion)). Before getting started, you’ll need to obtain the .pte binary—a serialized model and the tokenizer and tokenizer config JSON files. There are various ways to accomplish this:

- For your convienience, it's best if you use models exported by us, you can get them from our HuggingFace repository e.g. [LLama-3.2 model](https://huggingface.co/software-mansion/react-native-executorch-llama-3.2). You can also use [constants](https://github.com/software-mansion/react-native-executorch/tree/main/src/constants/modelUrls.ts) shipped with our library.
- Follow the official [tutorial](https://github.com/pytorch/executorch/blob/fe20be98c/examples/demo-apps/android/LlamaDemo/docs/delegates/xnnpack_README.md) made by ExecuTorch team to build the model yourself and aquire matching tokenizer and tokenizer config from model creators HuggingFace

## Initializing

In order to load a model into the app, you need to run the following code:

```typescript
import { useLLM, LLAMA3_2_1B } from 'react-native-executorch';

const messageHistory = [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi, how can I help you?' },
];

const llm = useLLM({
  modelSource: LLAMA3_2_1B,
  tokenizerSource: LLAMA3_2_TOKENIZER,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
  chatConfig: {
    systemPrompt: 'Be a helpful assistant',
    initialMessageHistory: messageHistory,
    contextWindowLength: 5,
  },
});
```

<details>
<summary>Type definitions</summary>

```typescript
const useLLM: ({
  modelSource,
  tokenizerSource,
  tokenizerConfigSource,
  chatConfig,
}: {
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
  tokenizerConfigSource: ResourceSource;
  chatConfig?: ChatConfig;
}) => LLMType;

interface LLMType {
  messageHistory: MessageType[];
  response: string;
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  error: string | null;
  runInference: (input: string) => Promise<void>;
  sendMessage: (message: string, tools?: LLMTool[]) => Promise<void>;
  interrupt: () => void;
}

type ResourceSource = string | number;

type MessageRole = 'user' | 'assistant' | 'system';

interface MessageType {
  role: MessageRole;
  content: string;
}
interface ChatConfig {
  initialMessageHistory: MessageType[];
  contextWindowLength: number;
  systemPrompt: string;
}
```

</details>

<br/>

The code snippet above fetches the model from the specified URL, loads it into memory, and returns an object with various methods and properties for controlling the model. You can monitor the loading progress by checking the `llm.downloadProgress` and `llm.isReady` property, and if anything goes wrong, the `llm.error` property will contain the error message.

:::danger
Lower-end devices might not be able to fit LLMs into memory. We recommend using quantized models to reduce the memory footprint.
:::

:::caution
Given computational constraints, our architecture is designed to support only one instance of the model runner at the time. Consequently, this means you can have only one active component leveraging `useLLM` concurrently.
:::

### Arguments

**`modelSource`** - A string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) section.

**`tokenizerSource`** - URL to the JSON file which contains the tokenizer

**`tokenizerConfigSource`** - URL to the JSON file which contains the tokenizer config

**`chatConfig`** - Object configuring chat managment:

- **`systemPrompt`** - Often used to tell the model what is its purpose, for example - "Be a helpful translator"

- **`initialMessageHistory`** - An array of `MessageType` objects that represent the conversation history. This can be used to provide initial context to the model.

- **`contextWindowLength`** - The number of messages from the current conversation that the model will use to generate a response. The higher the number, the more context the model will have. Keep in mind that using larger context windows will result in longer inference time and higher memory usage.

### Returns

| Field              | Type                                                    | Description                                                                                                                                                                                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `messageHistory`   | `MessageType[]`                                         | State of the generated response. This field is updated with each token generated by the model                                                                                                                                                                                                                                                                          |
| `response`         | `string`                                                | State of the generated response. This field is updated with each token generated by the model                                                                                                                                                                                                                                                                          |
| `isReady`          | `boolean`                                               | Indicates whether the model is ready                                                                                                                                                                                                                                                                                                                                   |
| `isGenerating`     | `boolean`                                               | Indicates whether the model is currently generating a response                                                                                                                                                                                                                                                                                                         |
| `downloadProgress` | `number`                                                | Represents the download progress as a value between 0 and 1, indicating the extent of the model file retrieval.                                                                                                                                                                                                                                                        |
| `error`            | <code>string &#124; null</code>                         | Contains the error message if the model failed to load                                                                                                                                                                                                                                                                                                                 |
| `sendMessage`      | `(message: string, tools?: LLMTool[]) => Promise<void>` | Method to add user message to conversation. After model responds, `messageHistory` will be updated with both user message and model response.                                                                                                                                                                                                                          |
| `runInference`     | `(input: string) => Promise<void>`                      | Runs model inference with raw input string. You need to provide entire conversation and prompt (in correct format and with special tokens!) in input string to this method. It doesn't manage conversation context. It is intended for users that need access to the model itself without any wrapper. If you want simple chat with model consider using `sendMessage` |
| `interrupt`        | `() => void`                                            | Function to interrupt the current inference                                                                                                                                                                                                                                                                                                                            |

## Sending a message

In order to send a message to the model, one can use the following code:

```typescript
const llm = useLLM({
  modelSource: LLAMA3_2_1B,
  tokenizerSource: LLAMA3_2_TOKENIZER,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
});

...
const message = 'Hi, who are you?';
await llm.generate(message);
...
```

## Listening for the response

As you might've noticed, there is no return value from the `runInference` function. Instead, the `response` field of the model is updated with each token.
This is how you can render the response of the model:

```typescript
...
return (
    <Text>{llm.response}</Text>
)
```

Behind the scenes, tokens are generated one by one, and the response property is updated with each token as it’s created. This means that the text component will re-render whenever llm.response gets updated.

If you want to render entire conversation you can use `messageHistory` field:

```typescript
return (
  <View>
    {llm.chatHistory.map((message) => (
      <Text>{message.content}</Text>
    ))}
  </View>
)
```

Sometimes, you might want to stop the model while it’s generating. To do this, you can use `interrupt()`, which will halt the model and append the current response to the conversation history.

There are also cases when you need to check if tokens are being generated, such as to conditionally render a stop button. We’ve made this easy with the `isGenerating` property.

## Benchmarks

### Model size

| Model                 | XNNPACK [GB] |
| --------------------- | :----------: |
| LLAMA3_2_1B           |     2.47     |
| LLAMA3_2_1B_SPINQUANT |     1.14     |
| LLAMA3_2_1B_QLORA     |     1.18     |
| LLAMA3_2_3B           |     6.43     |
| LLAMA3_2_3B_SPINQUANT |     2.55     |
| LLAMA3_2_3B_QLORA     |     2.65     |

### Memory usage

| Model                 | Android (XNNPACK) [GB] | iOS (XNNPACK) [GB] |
| --------------------- | :--------------------: | :----------------: |
| LLAMA3_2_1B           |          3.2           |        3.1         |
| LLAMA3_2_1B_SPINQUANT |          1.9           |         2          |
| LLAMA3_2_1B_QLORA     |          2.2           |        2.5         |
| LLAMA3_2_3B           |          7.1           |        7.3         |
| LLAMA3_2_3B_SPINQUANT |          3.7           |        3.8         |
| LLAMA3_2_3B_QLORA     |           4            |        4.1         |

### Inference time

| Model                 | iPhone 16 Pro (XNNPACK) [tokens/s] | iPhone 13 Pro (XNNPACK) [tokens/s] | iPhone SE 3 (XNNPACK) [tokens/s] | Samsung Galaxy S24 (XNNPACK) [tokens/s] | OnePlus 12 (XNNPACK) [tokens/s] |
| --------------------- | :--------------------------------: | :--------------------------------: | :------------------------------: | :-------------------------------------: | :-----------------------------: |
| LLAMA3_2_1B           |                16.1                |                11.4                |                ❌                |                  15.6                   |              19.3               |
| LLAMA3_2_1B_SPINQUANT |                40.6                |                16.7                |               16.5               |                  40.3                   |              48.2               |
| LLAMA3_2_1B_QLORA     |                31.8                |                11.4                |               11.2               |                  37.3                   |              44.4               |
| LLAMA3_2_3B           |                 ❌                 |                 ❌                 |                ❌                |                   ❌                    |               7.1               |
| LLAMA3_2_3B_SPINQUANT |                17.2                |                8.2                 |                ❌                |                  16.2                   |              19.4               |
| LLAMA3_2_3B_QLORA     |                14.5                |                 ❌                 |                ❌                |                  14.8                   |              18.1               |

❌ - Insufficient RAM.
