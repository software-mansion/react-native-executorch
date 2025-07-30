---
title: LLMModule
---

TypeScript API implementation of the [useLLM](../../02-hooks/01-natural-language-processing/useLLM.md) hook.

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

// Creating an instance
const llm = new LLMModule({
  tokenCallback: (token) => console.log(token),
  messageHistoryCallback: (messages) => console.log(messages),
});

// Loading the model
await llm.load({
  modelSource: LLAMA3_2_1B_QLORA,
  tokenizerSource: LLAMA3_2_TOKENIZER,
  tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
  onDownloadProgressCallback: printDownloadProgress,
});

// Running the model
await llm.sendMessage('Hello, World!');

// Interrupting the model (to actually interrupt the generation it has to be called when sendMessage or forward is running)
llm.interrupt();

// Deleting the model from memory
llm.delete();
```

### Methods

| Method             | Type                                                                                                                                                                                        | Description                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `constructor`      | `({tokenCallback?: (token: string) => void, responseCallback?: (response: string) => void, messageHistoryCallback?: (messageHistory: Message[]) => void})`                                  | Creates a new instance of LLMModule with optional callbacks.                                                                                                                                                                                                                                                                                                                |
| `load`             | `({modelSource: ResourceSource, tokenizerSource: ResourceSource, tokenizerConfigSource: ResourceSource, onDownloadProgressCallback?: (downloadProgress: number) => void}) => Promise<void>` | Loads the model. Checkout the [loading the model](#loading-the-model) section for details.                                                                                                                                                                                                                                                                                  |
| `setTokenCallback` | `{tokenCallback: (token: string) => void}) => void`                                                                                                                                         | Sets new token callback.                                                                                                                                                                                                                                                                                                                                                    |
| `generate`         | `(messages: Message[], tools?: LLMTool[]) => Promise<string>`                                                                                                                               | Runs model to complete chat passed in `messages` argument. It doesn't manage conversation context.                                                                                                                                                                                                                                                                          |
| `forward`          | `(input: string) => Promise<string>`                                                                                                                                                        | Runs model inference with raw input string. You need to provide entire conversation and prompt (in correct format and with special tokens!) in input string to this method. It doesn't manage conversation context. It is intended for users that need access to the model itself without any wrapper. If you want a simple chat with model the consider using`sendMessage` |
| `configure`        | `({chatConfig?: Partial<ChatConfig>, toolsConfig?: ToolsConfig}) => void`                                                                                                                   | Configures chat and tool calling. See more details in [configuring the model](#configuring-the-model).                                                                                                                                                                                                                                                                      |
| `sendMessage`      | `(message: string) => Promise<Message[]>`                                                                                                                                                   | Method to add user message to conversation. After model responds it will call `messageHistoryCallback()`containing both user message and model response. It also returns them.                                                                                                                                                                                              |
| `deleteMessage`    | `(index: number) => void`                                                                                                                                                                   | Deletes all messages starting with message on `index` position. After deletion it will call `messageHistoryCallback()` containing new history. It also returns it.                                                                                                                                                                                                          |
| `delete`           | `() => void`                                                                                                                                                                                | Method to delete the model from memory. Note you cannot delete model while it's generating. You need to interrupt it first and make sure model stopped generation.                                                                                                                                                                                                          |
| `interrupt`        | `() => void`                                                                                                                                                                                | Interrupts model generation. It may return one more token after interrupt.                                                                                                                                                                                                                                                                                                  |

<details>
<summary>Type definitions</summary>

```typescript
type ResourceSource = string | number | object;

type MessageRole = 'user' | 'assistant' | 'system';

interface Message {
  role: MessageRole;
  content: string;
}
interface ChatConfig {
  initialMessageHistory: Message[];
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

To create a new instance of LLMModule, use the constructor with optional callbacks:

**`tokenCallback`** - (Optional) Function that will be called on every generated token and will receive this token.

**`responseCallback`** - (Optional) Function that will be called on every generated token and will receive entire response, including this token. [**DEPRECATED** - consider using `tokenCallback`]

**`messageHistoryCallback`** - (Optional) Function that will be called on every finished message. Returns the entire message history.

Then, to load the model, use the `load` method. It accepts an object with the following fields:

**`modelSource`** - A string that specifies the location of the model binary.

**`tokenizerSource`** - URL to the JSON file which contains the tokenizer.

**`tokenizerConfigSource`** - URL to the JSON file which contains the tokenizer config.

**`onDownloadProgressCallback`** - (Optional) Function called on download progress.

This method returns a promise, which can resolve to an error or void. It only works in managed chat (i.e. when you use `sendMessage`)

## Listening for download progress

To subscribe to the download progress event, you can pass the `onDownloadProgressCallback` function to the `load` method. This function will be called whenever the download progress changes.

## Running the model

To run the model, you can use `generate` method. It allows you to pass chat messages and receive completion from the model. It doesn't provide any message history management.

Alternatively in managed chat (see: [Functional vs managed](../../02-hooks/01-natural-language-processing/useLLM.md#functional-vs-managed)), you can use the `sendMessage` method. It accepts the user message. After model responds it will return new message history containing both user message and model response.. Additionally, it will call `messageHistoryCallback`.

If you need raw model, without any wrappers, you can use `forward`. It provides direct access to the model, so the input string is passed straight into the model. It may be useful to work with models that aren't finetuned for chat completions. If you're not sure what are implications of that (e.g. that you have to include special model tokens), you're better off with `sendMessage`.

## Listening for generated tokens

To subscribe to the token generation event, you can pass `tokenCallback` or `messageHistoryCallback` functions to the constructor. `tokenCallback` is called on every token and contains only the most recent token. `messageHistoryCallback` is called whenever model finishes generation and contains all message history including user's and model's last messages.

## Interrupting the model

In order to interrupt the model, you can use the `interrupt` method.

## Configuring the model

To configure model (i.e. change system prompt, load initial conversation history or manage tool calling) you can use
`configure` method. It is only applied to managed chats i.e. when using `sendMessage` (see: [Functional vs managed](../../02-hooks/01-natural-language-processing/useLLM.md#functional-vs-managed)) It accepts object with following fields:

**`chatConfig`** - Object configuring chat management:

- **`systemPrompt`** - Often used to tell the model what is its purpose, for example - "Be a helpful translator".

- **`initialMessageHistory`** - An array of `Message` objects that represent the conversation history. This can be used to provide initial context to the model.

- **`contextWindowLength`** - The number of messages from the current conversation that the model will use to generate a response. The higher the number, the more context the model will have. Keep in mind that using larger context windows will result in longer inference time and higher memory usage.

**`toolsConfig`** - Object configuring options for enabling and managing tool use. **It will only have effect if your model's chat template support it**. Contains following properties:

- **`tools`** - List of objects defining tools.

- **`executeToolCallback`** - Function that accepts `ToolCall`, executes tool and returns the string to model.

- **`displayToolCalls`** - If set to true, JSON tool calls will be displayed in chat. If false, only answers will be displayed.

## Deleting the model from memory

To delete the model from memory, you can use the `delete` method.
