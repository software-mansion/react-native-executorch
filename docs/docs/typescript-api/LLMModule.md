---
title: LLMModule
sidebar_position: 3
---

TypeScript API implementation of the [useLLM](../natural-language-processing/useLLM.md) hook.

## Reference

```typescript
import {
  LLAMA3_2_1B_QLORA,
  LLAMA3_2_TOKENIZER,
  LLAMA3_2_TOKENIZER_CONFIG,
  LLMModule,
} from 'react-native-executorch';

const printDownloadProgress = (progress: number) => {
  console.log(progress);
};

// Loading the model
await LLMModule.load(
  {
    modelSource:,
    tokenizerSource: LLAMA3_2_TOKENIZER,
    tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
    onDownloadProgressCallback: printDownloadProgress,
  }
);

// Running the model
await LLMModule.sendMessage('Hello, World!');

// Interrupting the model (to actually interrupt the generation it would have to be called when sendMessage or runInference is running)
LLMModule.interrupt();

// Deleting the model from memory
LLMModule.delete();
```

### Methods

| Method         | Type                                                                                                                                                                                                                                                                                                                                             | Description                                                                                                                                                                                                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `load`         | `({  modelSource: ResourceSource, tokenizerSource: ResourceSource, tokenizerConfigSource: ResourceSource, chatConfig?: Partial<ChatConfig>, onDownloadProgressCallback?: (downloadProgress: number) => void, responseCallback?: (response: string) => void, messageHistoryCallback?: (messageHistory: MessageType[]) => void}) => Promise<void>` | Loads the model. Checkout the [loading the model](#loading-the-model) section for details.                                                                                                                                                                                                                                                                            |
| `sendMessage`  | `(message: string, tools?: LLMTool[]) => Promise<MessageType[]>`                                                                                                                                                                                                                                                                                 | Method to add user message to conversation. After model responds it will call`messageHistoryCallback()`containing both user message and model response. It also returns them.                                                                                                                                                                                         |
| `runInference` | `(input: string) => Promise<string>`                                                                                                                                                                                                                                                                                                             | Runs model inference with raw input string. You need to provide entire conversation and prompt (in correct format and with special tokens!) in input string to this method. It doesn't manage conversation context. It is intended for users that need access to the model itself without any wrapper. If you want simple chat with model consider using`sendMessage` |
| `delete`       | `() => void`                                                                                                                                                                                                                                                                                                                                     | Method to delete the model from memory.                                                                                                                                                                                                                                                                                                                               |
| `interrupt`    | `() => void`                                                                                                                                                                                                                                                                                                                                     | Interrupts model generation.                                                                                                                                                                                                                                                                                                                                          |

<details>
<summary>Type definitions</summary>

```typescript
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

// tool calling
interface ToolsConfig {
  tools: LLMTool[];
  executeToolCallback: (call: ToolCall) => Promise<string | null>;
  displayToolCalls?: boolean;
}

interface ToolCall {
  toolName: string;
  arguments: Object;
}

type LLMTool = Object;
```

</details>

## Loading the model

To load the model, use the `load` method. It accepts object with following fields:

**`modelSource`** - A string that specifies the location of the model binary.

**`tokenizerSource`** - URL to the JSON file which contains the tokenizer.

**`tokenizerConfigSource`** - URL to the JSON file which contains the tokenizer config.

**`chatConfig`** - Object configuring chat management:

- **`systemPrompt`** - Often used to tell the model what is its purpose, for example - "Be a helpful translator".

- **`initialMessageHistory`** - An array of `MessageType` objects that represent the conversation history. This can be used to provide initial context to the model.

- **`contextWindowLength`** - The number of messages from the current conversation that the model will use to generate a response. The higher the number, the more context the model will have. Keep in mind that using larger context windows will result in longer inference time and higher memory usage.

**`toolsConfig`** - Object configuring options for enabling and managing tool use. **It will only have effect if your model's chat template support it**. Contains following properties:

- **`tools`** - List of objects defining tools.

- **`executeToolCallback`** - Function that accepts `ToolCall`, executes tool and returns the string to model.

- **`displayToolCalls`** - If set to true, JSON tool calls will be displayed in chat. If false, only answers will be displayed.

**`onDownloadProgressCallback`** - Function that will be called on download progress.

**`responseCallback`** - Function that will be called on every generated token.

**`messageHistoryCallback`** - Function that will be called on every finished message. Returns entire message history.

This method returns a promise, which can resolve to an error or void.

## Listening for download progress

To subscribe to the download progress event, you can pass the `modelDownloadProgressCallback` functions to constructor. This function will be called whenever the download progress changes.

## Running the model

To run the model, you can use the `sendMessage` method. It accepts the user message. After model responds it will return new message history containing both user message and model response.. Additionally, it will call `messageHistoryCallback`.

Alternatively, you can use `runInference`. It provides direct access to the model, without any wrapper, so the input string is passed straight into the model. If you're not sure what are implications of that, you're better off with `sendMessage`

## Listening for token

To subscribe to the token generation event, you can pass `responseCallback` or `messageHistoryCallback` functions to constructor. `responseCallback` is called on every token and contains only the most recent model response and `messageHistoryCallback` is called whenever model finishes generation and contains all message history including user's and model's last messages.

## Deleting the model from memory

To delete the model from memory, you can use the `delete` method.
