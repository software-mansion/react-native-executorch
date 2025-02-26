---
title: LLMModule
sidebar_position: 3
---

Hookless implementation of the [useLLM](../llms/running-llms.md) hook.

## Reference

```typescript
import {
  LLMModule,
  LLAMA3_2_1B_QLORA,
  LLAMA3_2_1B_TOKENIZER,
} from 'react-native-executorch';

// Listening for download progress
LLMModule.onDownloadProgress((progress) => {
  console.log(progress);
});

// Loading the model
await LLMModule.load(LLAMA3_2_1B_QLORA, LLAMA3_2_1B_TOKENIZER);

// Listening for token
LLMModule.onToken((token) => {
  console.log(token);
});

// Running the model
LLMModule.generate('Hello, World!');

// Interrupting the model
LLMModule.interrupt();

// Deleting the model from memory
LLMModule.delete();
```

### Methods

| Method               | Type                                                                                                                                                                               | Description                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `load`               | `LLMModule.load(modelSource: ResourceSource, tokenizerSource: ResourceSource, systemPrompt?: string, messageHistory?: MessageType[], contextWindowLength?: number): Promise<void>` | Loads the model. Checkout the [loading the model](#loading-the-model) section for details. |
| `onDownloadProgress` | `(callback: (downloadProgress: number) => void): any`                                                                                                                              | Subscribe to the download progress event.                                                  |
| `generate`           | `(input: string): Promise<void>`                                                                                                                                                   | Method to start generating a response with the given input string.                         |
| `onToken`            | <code>(callback: (data: string &#124; undefined) => void): any</code>                                                                                                              | Subscribe to the token generation event.                                                   |
| `interrupt`          | `(): void`                                                                                                                                                                         | Method to interrupt the current inference                                                  |
| `delete`             | `(): void`                                                                                                                                                                         | Method to delete the model from memory.                                                    |

<details>
<summary>Type definitions</summary>

```typescript
type ResourceSource = string | number;

interface MessageType {
  role: 'user' | 'assistant';
  content: string;
}
```

</details>

## Loading the model

To load the model, use the `load` method. It accepts:

- `modelSource` - A string that specifies the location of the model binary. For more information, take a look at [loading models](../fundamentals/loading-models.md) page.
- `tokenizerSource` - URL to the binary file which contains the tokenizer
- `systemPrompt` - Often used to tell the model what is its purpose, for example - "Be a helpful translator"
- `messageHistory` - An array of `MessageType` objects that represent the conversation history. This can be used to provide context to the model.
- `contextWindowLength` - The number of messages from the current conversation that the model will use to generate a response. The higher the number, the more context the model will have. Keep in mind that using larger context windows will result in longer inference time and higher memory usage.

This method returns a promise, which can resolve to an error or void.

## Listening for download progress

To subscribe to the download progress event, you can use the `onDownloadProgress` method. It accepts a callback function that will be called whenever the download progress changes.

## Running the model

To run the model, you can use the `generate` method. It accepts one argument, which is the input string. The method returns a promise, which can resolve to an error or void.

## Listening for token

To subscribe to the token event, you can use the `onToken` method. It accepts a callback function that will be called whenever a token is generated.

## Interrupting the model

In order to interrupt the model, you can use the `interrupt` method.

## Deleting the model from memory

To delete the model from memory, you can use the `delete` method.
