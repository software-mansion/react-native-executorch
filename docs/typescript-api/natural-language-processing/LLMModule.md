# LLMModule

TypeScript API implementation of the [useLLM](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useLLM.md) hook.

## API Reference[​](#api-reference "Direct link to API Reference")

* For detailed API Reference for `LLMModule` see: [`LLMModule` API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule).
* For all LLM models available out-of-the-box in React Native ExecuTorch see: [LLM Models](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---llm).
* For useful LLM utility functionalities please refer to the following link: [LLM Utility Functionalities](https://docs.swmansion.com/react-native-executorch/docs/api-reference#utilities---llm).

## High Level Overview[​](#high-level-overview "Direct link to High Level Overview")

```typescript
import { LLMModule, LLAMA3_2_1B_QLORA } from 'react-native-executorch';

// Creating an instance and loading the model
const llm = await LLMModule.fromModelName(
  LLAMA3_2_1B_QLORA,
  (progress) => console.log(progress),
  (token) => console.log(token),
  (messages) => console.log(messages)
);

// Running the model - returns the generated response
const response = await llm.sendMessage('Hello, World!');
console.log('Response:', response);

// Interrupting the model (to actually interrupt the generation it has to be called when sendMessage or generate is running)
llm.interrupt();

// Deleting the model from memory
llm.delete();

```

### Methods[​](#methods "Direct link to Methods")

All methods of `LLMModule` are explained in details here: [LLMModule API Reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule).

## Loading the model[​](#loading-the-model "Direct link to Loading the model")

Use the static [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#frommodelname) factory method:

```typescript
const llm = await LLMModule.fromModelName(
  LLAMA3_2_3B, // model config constant
  onDownloadProgress, // optional, progress 0–1
  tokenCallback, // optional, called on every token
  messageHistoryCallback // optional, called when generation finishes
);

```

The model config object contains `modelSource`, `tokenizerSource`, `tokenizerConfigSource`, and optional `capabilities`. Pass one of the built-in constants (e.g. `LLAMA3_2_3B`) or construct it manually.

This method returns a promise resolving to an `LLMModule` instance.

For more information on loading resources, take a look at [loading models](https://docs.swmansion.com/react-native-executorch/docs/fundamentals/loading-models.md) page.

## Listening for download progress[​](#listening-for-download-progress "Direct link to Listening for download progress")

To subscribe to the download progress event, you can pass the `onDownloadProgress` callback as the second argument to [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#frommodelname). This function is called whenever the download progress changes.

## Running the model[​](#running-the-model "Direct link to Running the model")

To run the model, you can use [`generate`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#generate) method. It allows you to pass chat messages and receive completion from the model. It doesn't provide any message history management.

Alternatively in managed chat (see: [Functional vs managed](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useLLM.md#functional-vs-managed)), you can use the [`sendMessage`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#sendmessage) method. It accepts the user message and returns a promise that resolves to the generated response. Additionally, it will call [`messageHistoryCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#messagehistorycallback) with the updated message history containing both user message and model response.

If you need raw model access without any wrappers, you can use [`forward`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#forward). It provides direct access to the model, so the input string is passed straight into the model and returns the generated response. It may be useful to work with models that aren't finetuned for chat completions. If you're not sure what are implications of that (e.g. that you have to include special model tokens), you're better off with [`sendMessage`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#sendmessage).

## Listening for generated tokens[​](#listening-for-generated-tokens "Direct link to Listening for generated tokens")

To subscribe to the token generation event, you can pass [`tokenCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#tokencallback) or [`messageHistoryCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#messagehistorycallback) functions to the constructor. [`tokenCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#tokencallback) is called on every token and contains only the most recent token. [`messageHistoryCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#messagehistorycallback) is called whenever model finishes generation and contains all message history including user's and model's last messages.

## Interrupting the model[​](#interrupting-the-model "Direct link to Interrupting the model")

In order to interrupt the model, you can use the [`interrupt`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#interrupt) method.

## Token Batching[​](#token-batching "Direct link to Token Batching")

Depending on selected model and the user's device generation speed can be above 60 tokens per second. If the [`tokenCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#tokencallback) triggers rerenders and is invoked on every single token it can significantly decrease the app's performance. To alleviate this and help improve performance we've implemented token batching. To configure this you need to call [`configure`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#configure) method and pass [`generationConfig`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/LLMConfig#generationconfig). In the next section, there are listed what you can tweak with this config.

## Configuring the model[​](#configuring-the-model "Direct link to Configuring the model")

To configure model (i.e. change system prompt, load initial conversation history or manage tool calling, set generation settings) you can use [`configure`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#configure) method. [**`chatConfig`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/LLMConfig#chatconfig) and [**`toolsConfig`**](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/LLMConfig#toolsconfig) is only applied to managed chats i.e. when using [`sendMessage`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#sendmessage) (see: [Functional vs managed](https://docs.swmansion.com/react-native-executorch/docs/hooks/natural-language-processing/useLLM.md#functional-vs-managed)) It accepts object with following fields:

* [`chatConfig`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/LLMConfig#chatconfig) - Object configuring chat management that contains:

  * [`systemPrompt`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ChatConfig#systemprompt) - Often used to tell the model what is its purpose, for example - "Be a helpful translator".

  * [`initialMessageHistory`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ChatConfig#initialmessagehistory) - Object that represent the conversation history. This can be used to provide initial context to the model.

  * [`contextStrategy`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ChatConfig#contextstrategy) - Object implementing [`ContextStrategy`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ContextStrategy) interface used to manage conversation context, including trimming history if necessary. Custom strategies can be implemented or one of the built-in options can be used (e.g. [`NoopContextStrategy`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/NoopContextStrategy), [`MessageCountContextStrategy`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/MessageCountContextStrategy) or the default [`SlidingWindowContextStrategy`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/SlidingWindowContextStrategy)).

* [`toolsConfig`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ToolsConfig) - Object configuring options for enabling and managing tool use. **It will only have effect if your model's chat template support it**. Contains following properties:

  * [`tools`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ToolsConfig#tools) - List of objects defining tools.

  * [`executeToolCallback`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ToolsConfig#executetoolcallback) - Function that accepts [`ToolCall`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ToolCall), executes tool and returns the string to model.

  * [`displayToolCalls`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/ToolsConfig#displaytoolcalls) - If set to `true`, JSON tool calls will be displayed in chat. If `false`, only answers will be displayed.

* [`generationConfig`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/LLMConfig#generationconfig) - Object configuring generation settings with following properties:

  * [`outputTokenBatchSize`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/GenerationConfig#batchtimeinterval) - Soft upper limit on the number of tokens in each token batch (in certain cases there can be more tokens in given batch, i.e. when the batch would end with special emoji join character).

  * [`batchTimeInterval`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/GenerationConfig#batchtimeinterval) - Upper limit on the time interval between consecutive token batches.

  * [`temperature`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/GenerationConfig#temperature) - Scales output logits by the inverse of temperature. Controls the randomness / creativity of text generation.

  * [`topp`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/interfaces/GenerationConfig#topp) - Only samples from the smallest set of tokens whose cumulative probability exceeds topp.

## Vision-Language Models (VLM)[​](#vision-language-models-vlm "Direct link to Vision-Language Models (VLM)")

Some models support multimodal input — text and images together. To use them, pass `capabilities` in the model object when calling [`fromModelName`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#frommodelname):

```typescript
import { LLMModule, LFM2_VL_1_6B_QUANTIZED } from 'react-native-executorch';

const llm = await LLMModule.fromModelName(
  LFM2_VL_1_6B_QUANTIZED,
  undefined,
  (token) => console.log(token)
);

```

The `capabilities` field is already set on the model constant. You can also construct the model object explicitly:

```typescript
const llm = await LLMModule.fromModelName({
  modelName: 'lfm2.5-vl-1.6b-quantized',
  modelSource: require('./path/to/model.pte'),
  tokenizerSource: require('./path/to/tokenizer.json'),
  tokenizerConfigSource: require('./path/to/tokenizer_config.json'),
  capabilities: ['vision'],
});

```

Once loaded, pass `imagePath` to [`sendMessage`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#sendmessage):

```typescript
const response = await llm.sendMessage('What is in this image?', {
  imagePath: '/path/to/image.jpg',
});

```

Or use [`generate`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#generate) with `mediaPath` on the message:

```typescript
const chat: Message[] = [
  {
    role: 'user',
    content: 'Describe this image.',
    mediaPath: '/path/to/image.jpg',
  },
];

const response = await llm.generate(chat);

```

## Using a custom model[​](#using-a-custom-model "Direct link to Using a custom model")

Use [`fromCustomModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#fromcustommodel) to load your own exported LLM instead of a built-in preset:

```typescript
import { LLMModule } from 'react-native-executorch';

const llm = await LLMModule.fromCustomModel(
  'https://example.com/model.pte',
  'https://example.com/tokenizer.json',
  'https://example.com/tokenizer_config.json',
  (progress) => console.log(progress),
  (token) => console.log(token),
  (messages) => console.log(messages)
);

```

### Required model contract[​](#required-model-contract "Direct link to Required model contract")

The `.pte` model binary must be exported following the [ExecuTorch LLM export process](https://docs.pytorch.org/executorch/1.1/llm/export-llm.html). The native runner expects the standard ExecuTorch text-generation interface — KV-cache management, prefill/decode phases, and logit sampling are all handled by the runtime.

## Deleting the model from memory[​](#deleting-the-model-from-memory "Direct link to Deleting the model from memory")

To delete the model from memory, you can use the [`delete`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/classes/LLMModule#delete) method.
