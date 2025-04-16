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

// constructing module - callbacks can be passed as arguments of constructor
const llm = new LLMModule({
  responseCallback: (response) => {
    console.log(response);
  },
  modelDownloadProgressCallback: (progress) => {
    console.log(progress);
  },
});

// Loading the model
await llm.load(
  LLAMA3_2_1B_QLORA,
  LLAMA3_2_TOKENIZER,
  LLAMA3_2_TOKENIZER_CONFIG
);

// Running the model
await llm.sendMessage('Hello, World!');

// Interrupting the model
llm.interrupt();

// Deleting the model from memory
llm.delete();
```

### Constructor

| argument                        | Type                                      | Description                                                                                         | Optional                            |
| ------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `responseCallback`              | `(response: string) => void`              | Function that will be called on every generated token                                               | <center>:white_check_mark:</center> |
| `messageHistoryCallback`        | `(messageHistory: MessageType[]) => void` | Function that will be called on every finished message. Returns entire message history.             | <center>:white_check_mark:</center> |
| `isReadyCallback`               | `(isReady: boolean) => void`              | Function that will be called when readiness of model changes                                        | <center>:white_check_mark:</center> |
| `isGeneratingCallback`          | `(isGenerating: boolean) => void`         | Function that will be called when model starts or stops generating                                  | <center>:white_check_mark:</center> |
| `modelDownloadProgressCallback` | `(downloadProgress: number) => void`      | Function that will be called on download progess                                                    | <center>:white_check_mark:</center> |
| `errorCallback`                 | `(error: any) => void`                    | Function that will be called instead of throwing errors. If not passed, LLMModule will throw errors | <center>:white_check_mark:</center> |
| `chatConfig`                    | `ChatConfig`                              | Method to interrupt the current inference                                                           | <center>:white_check_mark:</center> |

### Methods

| Method         | Type                                                                                                                     | Description                                                                                                                                                                                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `load`         | `(modelSource: ResourceSource, tokenizerSource: ResourceSource, tokenizerConfigSource: ResourceSource) => Promise<void>` | Loads the model. Checkout the [loading the model](#loading-the-model) section for details.                                                                                                                                                                                                                                                                             |
| `sendMessage`  | `(message: string, tools?: LLMTool[]) => Promise<void>`                                                                  | Method to add user message to conversation. After model responds it will call `messageHistoryCallback()` containing both user message and model response.                                                                                                                                                                                                              |
| `runInference` | `(input: string) => Promise<void>`                                                                                       | Runs model inference with raw input string. You need to provide entire conversation and prompt (in correct format and with special tokens!) in input string to this method. It doesn't manage conversation context. It is intended for users that need access to the model itself without any wrapper. If you want simple chat with model consider using `sendMessage` |
| `interrupt`    | `() => void`                                                                                                             | Method to interrupt the current inference                                                                                                                                                                                                                                                                                                                              |
| `delete`       | `() => void`                                                                                                             | Method to delete the model from memory.                                                                                                                                                                                                                                                                                                                                |

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
```

</details>

## Loading the model

To create the model

To load the model, use the `load` method. It accepts:

- `modelSource` - A string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) page.
- `tokenizerSource` - URL to the JSON file which contains the tokenizer
- `tokenizerConfigSource` - URL to the JSON file which contains the tokenizer config

This method returns a promise, which can resolve to an error or void.

## Listening for download progress

To subscribe to the download progress event, you can pass the `modelDownloadProgressCallback` functions to constructor. This function will be called whenever the download progress changes.

## Running the model

To run the model, you can use the `sendMessage` method. It accepts two argument, which are the user message and, optionally tools for model to use. After model responds it will call `messageHistoryCallback()` containing both user message and model response.

Alternatively, you can use `runInference`. It provides direct access to the model, without any wrapper, so the input string is passed straight into the model. If you're not sure what are implications of that, you're better of with `sendMessage`

## Listening for token

To subscribe to the token event, you can pass `responseCallback` or `messageHistoryCallback` functions to constructor. `responseCallback` is called on every token and contains only the most recent model response and `messageHistoryCallback` is called whenever model finishes generation and contains all message history including user's and model's last masseges.

## Interrupting the model

In order to interrupt the model, you can use the `interrupt` method.

## Deleting the model from memory

To delete the model from memory, you can use the `delete` method.
