---
title: LLMModule
---

TypeScript API implementation of the [useLLM](../../03-hooks/01-natural-language-processing/useLLM.md) hook.

## API Reference

* For detailed API Reference for `LLMModule` see: [`LLMModule` API Reference](../../06-api-reference/classes/LLMModule.md).
* For all LLM models available out-of-the-box in React Native ExecuTorch see: [LLM Models](../../06-api-reference/index.md#models---lmm).
* For useful LLM utility functionalities please refere to the following link: [LLM Utility Functionalities](../../06-api-reference/index.md#utilities---llm).

## Reference

```typescript
import { LLMModule, LLAMA3_2_1B_QLORA } from 'react-native-executorch';

// Creating an instance
const llm = new LLMModule({
  tokenCallback: (token) => console.log(token),
  messageHistoryCallback: (messages) => console.log(messages),
});

// Loading the model
await llm.load(LLAMA3_2_1B_QLORA, (progress) => console.log(progress));

// Running the model
await llm.sendMessage('Hello, World!');

// Interrupting the model (to actually interrupt the generation it has to be called when sendMessage or generate is running)
llm.interrupt();

// Deleting the model from memory
llm.delete();
```

### Methods

All methods of `LLMModule` are explained in details here: [`LLMModule API Reference`](../../06-api-reference/classes/LLMModule.md)

## Loading the model

To create a new instance of `LLMModule`, use the [constructor](../../06-api-reference/classes/LLMModule.md#constructor) with optional callbacks:

* [`tokenCallback`](../../06-api-reference/classes/LLMModule.md#tokencallback) - Function called on every generated token.

* [`responseCallback`](../../06-api-reference/classes/LLMModule.md#responsecallback) - Deprecated, please use `tokenCallback`.

* [`messageHistoryCallback`](../../06-api-reference/classes/LLMModule.md#messagehistorycallback) - Funtion called on every finshed message.

Then, to load the model, use the [`load`](../../06-api-reference/classes/LLMModule.md#load) method. It accepts an object with the following fields:

* [`model`](../../06-api-reference/classes/LLMModule.md#model) - Object containing:

    * [`modelSource`](../../06-api-reference/classes/LLMModule.md#modelsource) - The location of the used model.

    * [`tokenizerSource`](../../06-api-reference/classes/LLMModule.md#tokenizersource) - The location of the used tokenizer.

    * [`tokenizerConfigSource`](../../06-api-reference/classes/LLMModule.md#tokenizerconfigsource) - The location of the used tokenizer config.

* [`onDownloadProgressCallback`](../../06-api-reference/classes/LLMModule.md#ondownloadprogresscallback) - Callback to track download progress.

This method returns a promise, which can resolve to an error or void.

For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.

## Listening for download progress

To subscribe to the download progress event, you can pass the [`onDownloadProgressCallback`](../../06-api-reference/classes/LLMModule.md#ondownloadprogresscallback) function to the [`load`](../../06-api-reference/classes/LLMModule.md#load) method. This function is called whenever the download progress changes.

## Running the model

To run the model, you can use [`generate`](../../06-api-reference/classes/LLMModule.md#generate) method. It allows you to pass chat messages and receive completion from the model. It doesn't provide any message history management.

Alternatively in managed chat (see: [Functional vs managed](../../03-hooks/01-natural-language-processing/useLLM.md#functional-vs-managed)), you can use the [`sendMessage`](../../06-api-reference/classes/LLMModule.md#sendmessage) method. It accepts the user message. After model responds it will return new message history containing both user message and model response. Additionally, it will call [`messageHistoryCallback`](../../06-api-reference/classes/LLMModule.md#messagehistorycallback).

If you need raw model, without any wrappers, you can use [`forward`](../../06-api-reference/classes/LLMModule.md#forward). It provides direct access to the model, so the input string is passed straight into the model. It may be useful to work with models that aren't finetuned for chat completions. If you're not sure what are implications of that (e.g. that you have to include special model tokens), you're better off with [`sendMessage`](../../06-api-reference/classes/LLMModule.md#sendmessage).

## Listening for generated tokens

To subscribe to the token generation event, you can pass [`tokenCallback`](../../06-api-reference/classes/LLMModule.md#tokencallback) or [`messageHistoryCallback`](../../06-api-reference/classes/LLMModule.md#messagehistorycallback) functions to the constructor. [`tokenCallback`](../../06-api-reference/classes/LLMModule.md#tokencallback) is called on every token and contains only the most recent token. [`messageHistoryCallback`](../../06-api-reference/classes/LLMModule.md#messagehistorycallback) is called whenever model finishes generation and contains all message history including user's and model's last messages.

## Interrupting the model

In order to interrupt the model, you can use the [`interrupt`](../../06-api-reference/classes/LLMModule.md#interrupt) method.

## Token Batching

Depending on selected model and the user's device generation speed can be above 60 tokens per second. If the [`tokenCallback`](../../06-api-reference/classes/LLMModule.md#tokencallback) triggers rerenders and is invoked on every single token it can significantly decrease the app's performance. To alleviate this and help improve performance we've implemented token batching. To configure this you need to call [`configure`](../../06-api-reference/classes/LLMModule.md#configure) method and pass [`generationConfig`](../../06-api-reference/interfaces/LLMConfig.md#generationconfig). In the next section, there are listed what you can tweak with this config.

## Configuring the model

To configure model (i.e. change system prompt, load initial conversation history or manage tool calling, set generation settings) you can use
[`configure`](../../06-api-reference/classes/LLMModule.md#configure) method. [**`chatConfig`**](../../06-api-reference/interfaces/LLMConfig.md#chatconfig) and [**`toolsConfig`**](../../06-api-reference/interfaces/LLMConfig.md#toolsconfig) is only applied to managed chats i.e. when using [`sendMessage`](../../06-api-reference/classes/LLMModule.md#sendmessage) (see: [Functional vs managed](../../03-hooks/01-natural-language-processing/useLLM.md#functional-vs-managed)) It accepts object with following fields:

* [`chatConfig`](../../06-api-reference/interfaces/LLMConfig.md#chatconfig) - Object configuring chat management that contains:

    * [`systemPrompt`](../../06-api-reference/interfaces/ChatConfig.md#systemprompt) - Often used to tell the model what is its purpose, for example - "Be a helpful translator".

    * [`initialMessageHistory`](../../06-api-reference/interfaces/ChatConfig.md#initialmessagehistory) - Object that represent the conversation history. This can be used to provide initial context to the model.

    * [`contextWindowLength`](../../06-api-reference/interfaces/ChatConfig.md#contextwindowlength) - The number of messages from the current conversation that the model will use to generate a response. Keep in mind that using larger context windows will result in longer inference time and higher memory usage.

* [`toolsConfig`](../../06-api-reference/interfaces/ToolsConfig.md) - Object configuring options for enabling and managing tool use. **It will only have effect if your model's chat template support it**. Contains following properties:

  * [`tools`](../../06-api-reference/interfaces/ToolsConfig.md#tools) - List of objects defining tools.

  * [`executeToolCallback`](../../06-api-reference/interfaces/ToolsConfig.md#executetoolcallback) - Function that accepts [`ToolCall`](../../06-api-reference/interfaces/ToolCall.md), executes tool and returns the string to model.

  * [`displayToolCalls`](../../06-api-reference/interfaces/ToolsConfig.md#displaytoolcalls) - If set to `true`, JSON tool calls will be displayed in chat. If `false`, only answers will be displayed.

* [`generationConfig`](../../06-api-reference/interfaces/LLMConfig.md#generationconfig) - Object configuring generation settings with following properties:

    * [`outputTokenBatchSize`](../../06-api-reference/interfaces/GenerationConfig.md#batchtimeinterval) - Soft upper limit on the number of tokens in each token batch (in certain cases there can be more tokens in given batch, i.e. when the batch would end with special emoji join character).

    * [`batchTimeInterval`](../../06-api-reference/interfaces/GenerationConfig.md#batchtimeinterval) - Upper limit on the time interval between consecutive token batches.

    * [`temperature`](../../06-api-reference/interfaces/GenerationConfig.md#temperature) - Scales output logits by the inverse of temperature. Controls the randomness / creativity of text generation.

    * [`topp`](../../06-api-reference/interfaces/GenerationConfig.md#topp) - Only samples from the smallest set of tokens whose cumulative probability exceeds topp.

## Deleting the model from memory

To delete the model from memory, you can use the [`delete`](../../06-api-reference/classes/LLMModule.md#delete) method.
