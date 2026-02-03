---
title: useLLM
keywords:
  [
    react native,
    react native ai,
    react native llm,
    react native qwen,
    react native llama,
    react native executorch,
    executorch,
    pytorch,
    on-device ai,
    mobile ai,
    llama 3,
    qwen,
    text generation,
    tool calling,
    function calling,
  ]
description: "Learn how to use LLMs in your React Native applications with React Native ExecuTorch's useLLM hook."
---

React Native ExecuTorch supports a variety of LLMs (checkout our [HuggingFace repository](https://huggingface.co/software-mansion) for model already converted to ExecuTorch format) including Llama 3.2. Before getting started, you’ll need to obtain the .pte binary—a serialized model, the tokenizer and tokenizer config JSON files. There are various ways to accomplish this:

- For your convenience, it's best if you use models exported by us, you can get them from our [HuggingFace repository](https://huggingface.co/collections/software-mansion/llm). You can also use [constants](../../06-api-reference/index.md#models---lmm) shipped with our library.
- Follow the official [tutorial](https://docs.pytorch.org/executorch/stable/llm/export-llm.html) made by ExecuTorch team to export arbitrary chosen LLM model.

:::danger
Lower-end devices might not be able to fit LLMs into memory. We recommend using quantized models to reduce the memory footprint.
:::

## API Reference

- For detailed API Reference for `useLLM` see: [`useLLM` API Reference](../../06-api-reference/functions/useLLM.md).
- For all LLM models available out-of-the-box in React Native ExecuTorch see: [LLM Models](../../06-api-reference/index.md#models---lmm).
- For useful LLM utility functionalities please refer to the following link: [LLM Utility Functionalities](../../06-api-reference/index.md#utilities---llm).

## Initializing

In order to load a model into the app, you need to run the following code:

```typescript
import { useLLM, LLAMA3_2_1B } from 'react-native-executorch';

const llm = useLLM({ model: LLAMA3_2_1B });
```

<br/>

The code snippet above fetches the model from the specified URL, loads it into memory, and returns an object with various functions and properties for controlling the model. You can monitor the loading progress by checking the [`llm.downloadProgress`](../../06-api-reference/interfaces/LLMType.md#downloadprogress) and [`llm.isReady`](../../06-api-reference/interfaces/LLMType.md#isready) property, and if anything goes wrong, the [`llm.error`](../../06-api-reference/interfaces/LLMType.md#error) property will contain the error message.

### Arguments

`useLLM` takes [`LLMProps`](../../06-api-reference/interfaces/LLMProps.md) that consists of:

- [model source](../../06-api-reference/interfaces/LLMProps.md#modelsource), [tokenizer source](../../06-api-reference/interfaces/LLMProps.md#tokenizersource), and [tokenizer config source](../../06-api-reference/interfaces/LLMProps.md#tokenizerconfigsource).
- An optional flag [`preventLoad`](../../06-api-reference/interfaces/SpeechToTextProps.md#preventload) which prevents auto-loading of the model.

You need more details? Check the following resources:

- For detailed information about `useLLM` arguments check this section: [`useLLM` arguments](../../06-api-reference/functions/useLLM.md#parameters).
- For more information on loading resources, take a look at [loading models](../../01-fundamentals/02-loading-models.md) page.
- For available LLM models please check out the following list: [LLM Models](../../06-api-reference/index.md#models---lmm).

### Returns

`useLLM` returns [`LLMType`](../../06-api-reference/interfaces/LLMType.md) which includes methods like [`generate`](../../06-api-reference/interfaces/LLMType.md#generate), [`sendMessage`](../../06-api-reference/interfaces/LLMType.md#sendmessage), [`getGeneratedTokenCount`](../../06-api-reference/interfaces/LLMType.md#getgeneratedtokencount), [`getPromptTokenCount`](../../06-api-reference/interfaces/LLMType.md#getprompttokencount), [`getTotalTokenCount`](../../06-api-reference/interfaces/LLMType.md#gettotaltokencount) and more. For complete details, see the [LLMType API Reference](../../06-api-reference/interfaces/LLMType.md).
## Functional vs managed

You can use functions returned from this hooks in two manners:

1. Functional/pure - we will not keep any state for you. You'll need to keep conversation history and handle function calling yourself. Use [`generate`](../../06-api-reference/interfaces/LLMType.md#generate) and [`response`](../../06-api-reference/interfaces/LLMType.md#response). Note that you don't need to run [`configure`](../../06-api-reference/interfaces/LLMType.md#configure) to use those. Furthermore, [`chatConfig`](../../06-api-reference/interfaces/LLMConfig.md#chatconfig) and [`toolsConfig`](../../06-api-reference/interfaces/LLMConfig.md#toolsconfig) will not have any effect on those functions.

2. Managed/stateful - we will manage conversation state. Tool calls will be parsed and called automatically after passing appropriate callbacks. See more at [managed LLM chat](#managed-llm-chat).

## Functional way

### Simple generation

To perform chat completion you can use the [`generate`](../../06-api-reference/interfaces/LLMType.md#generate) function. The [`response`](../../06-api-reference/interfaces/LLMType.md#response) value is updated with each token as it's generated, and the function returns a promise that resolves to the complete response when generation finishes.

```tsx
const llm = useLLM({ model: LLAMA3_2_1B });

const handleGenerate = async () => {
  const chat: Message[] = [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'Hi!' },
    { role: 'assistant', content: 'Hi!, how can I help you?' },
    { role: 'user', content: 'What is the meaning of life?' },
  ];

  // Chat completion - returns the generated response
  const response = await llm.generate(chat);
  console.log('Complete response:', response);
};

return (
  <View>
    <Button onPress={handleGenerate} title="Generate!" />
    <Text>{llm.response}</Text>
  </View>
);
```

### Interrupting the model

Sometimes, you might want to stop the model while it’s generating. To do this, you can use [`interrupt`](../../06-api-reference/interfaces/LLMType.md#interrupt), which will halt the model and update the response one last time.

There are also cases when you need to check if tokens are being generated, such as to conditionally render a stop button. We’ve made this easy with the [`isGenerating`](../../06-api-reference/interfaces/LLMType.md#isgenerating) property.

:::warning
If you try to dismount the component using this hook while generation is still going on, it will result in crash.
You'll need to interrupt the model first and wait until [`isGenerating`](../../06-api-reference/interfaces/LLMType.md#isgenerating) is set to false.
:::

### Reasoning

Some models ship with a built-in "reasoning" or "thinking" mode, but this is model-specific, not a feature of our library. If the model you're using supports disabling reasoning, follow the instructions provided by the model authors. For example, Qwen 3 lets you disable reasoning by adding the `/no_think` suffix to your prompts - [source](https://qwenlm.github.io/blog/qwen3/#advanced-usages).

### Tool calling

Sometimes text processing capabilities of LLMs are not enough. That's when you may want to introduce tool calling (also called function calling). It allows model to use external tools to perform its tasks. The tools may be any arbitrary function that you want your model to run. It may retrieve some data from 3rd party API. It may do an action inside an app like pressing buttons or filling forms, or it may use system APIs to interact with your phone (turning on flashlight, adding events to your calendar, changing volume etc.).

```tsx
const TOOL_DEFINITIONS: LLMTool[] = [
  {
    name: 'get_weather',
    description: 'Get/check weather in given location.',
    parameters: {
      type: 'dict',
      properties: {
        location: {
          type: 'string',
          description: 'Location where user wants to check weather',
        },
      },
      required: ['location'],
    },
  },
];

const llm = useLLM({ model: HAMMER2_1_1_5B });

const handleGenerate = () => {
  const chat: Message[] = [
    {
      role: 'system',
      content: `You are a helpful assistant. Current time and date: ${new Date().toString()}`,
    },
    {
      role: 'user',
      content: `Hi, what's the weather like in Cracow right now?`,
    },
  ];

  // Chat completion
  llm.generate(chat, TOOL_DEFINITIONS);
};

useEffect(() => {
  // Parse response and call tools accordingly
  // ...
}, [llm.response]);

return (
  <View>
    <Button onPress={handleGenerate} title="Generate!" />
    <Text>{llm.response}</Text>
  </View>
);
```

## Managed LLM Chat

### Configuring the model

To configure model (i.e. change system prompt, load initial conversation history or manage tool calling, set generation settings) you can use
[`configure`](../../06-api-reference/classes/LLMModule.md#configure) method. [**`chatConfig`**](../../06-api-reference/interfaces/LLMConfig.md#chatconfig) and [**`toolsConfig`**](../../06-api-reference/interfaces/LLMConfig.md#toolsconfig) is only applied to managed chats i.e. when using [`sendMessage`](../../06-api-reference/classes/LLMModule.md#sendmessage) (see: [Functional vs managed](../../03-hooks/01-natural-language-processing/useLLM.md#functional-vs-managed)) It accepts object with following fields:

- [`chatConfig`](../../06-api-reference/interfaces/LLMConfig.md#chatconfig) - Object configuring chat management that contains:
  - [`systemPrompt`](../../06-api-reference/interfaces/ChatConfig.md#systemprompt) - Often used to tell the model what is its purpose, for example - "Be a helpful translator".

  - [`initialMessageHistory`](../../06-api-reference/interfaces/ChatConfig.md#initialmessagehistory) - Object that represent the conversation history. This can be used to provide initial context to the model.

  - [`contextWindowLength`](../../06-api-reference/interfaces/ChatConfig.md#contextwindowlength) - The number of messages from the current conversation that the model will use to generate a response. Keep in mind that using larger context windows will result in longer inference time and higher memory usage.

- [`toolsConfig`](../../06-api-reference/interfaces/LLMConfig.md#toolsconfig) - Object configuring options for enabling and managing tool use. **It will only have effect if your model's chat template support it**. Contains following properties:
  - [`tools`](../../06-api-reference/interfaces/ToolsConfig.md#tools) - List of objects defining tools.

  - [`executeToolCallback`](../../06-api-reference/interfaces/ToolsConfig.md#executetoolcallback) - Function that accepts [`ToolCall`](../../06-api-reference/interfaces/ToolCall.md), executes tool and returns the string to model.

  - [`displayToolCalls`](../../06-api-reference/interfaces/ToolsConfig.md#displaytoolcalls) - If set to `true`, JSON tool calls will be displayed in chat. If `false`, only answers will be displayed.

- [`generationConfig`](../../06-api-reference/interfaces/LLMConfig.md#generationconfig) - Object configuring generation settings with following properties:
  - [`outputTokenBatchSize`](../../06-api-reference/interfaces/GenerationConfig.md#batchtimeinterval) - Soft upper limit on the number of tokens in each token batch (in certain cases there can be more tokens in given batch, i.e. when the batch would end with special emoji join character).

  - [`batchTimeInterval`](../../06-api-reference/interfaces/GenerationConfig.md#batchtimeinterval) - Upper limit on the time interval between consecutive token batches.

  - [`temperature`](../../06-api-reference/interfaces/GenerationConfig.md#temperature) - Scales output logits by the inverse of temperature. Controls the randomness / creativity of text generation.

  - [`topp`](../../06-api-reference/interfaces/GenerationConfig.md#topp) - Only samples from the smallest set of tokens whose cumulative probability exceeds topp.

### Sending a message

In order to send a message to the model, one can use the following code:

```tsx
const llm = useLLM({ model: LLAMA3_2_1B });

const send = () => {
  const message = 'Hi, who are you?';
  llm.sendMessage(message);
};

return <Button onPress={send} title="Generate!" />;
```

### Accessing conversation history

Behind the scenes, tokens are generated one by one, and the [`response`](../../06-api-reference/interfaces/LLMType.md#response) property is updated with each token as it’s created.
If you want to get entire conversation you can use [`messageHistory`](../../06-api-reference/interfaces/LLMType.md#messagehistory) field:

```tsx
return (
  <View>
    {llm.messageHistory.map((message) => (
      <Text>{message.content}</Text>
    ))}
  </View>
);
```

### Tool calling example

```tsx
const TOOL_DEFINITIONS: LLMTool[] = [
  {
    name: 'get_weather',
    description: 'Get/check weather in given location.',
    parameters: {
      type: 'dict',
      properties: {
        location: {
          type: 'string',
          description: 'Location where user wants to check weather',
        },
      },
      required: ['location'],
    },
  },
];

const llm = useLLM({ model: HAMMER2_1_1_5B });

useEffect(() => {
  llm.configure({
    chatConfig: {
      systemPrompt: `You are helpful assistant. Current time and date: ${new Date().toString()}`,
    },
    toolsConfig: {
      tools: TOOL_DEFINITIONS,
      executeToolCallback: async (call) => {
        if (call.toolName === 'get_weather') {
          console.log('Checking weather!');
          // perform call to weather API
          // ...
          const mockResults = 'Weather is great!';
          return mockResults;
        }
        return null;
      },
      displayToolCalls: true,
    },
  });
}, []);

const send = () => {
  const message = `Hi, what's the weather like in Cracow right now?`;
  llm.sendMessage(message);
};

return (
  <View>
    <Button onPress={send} title="Generate!" />
    <Text>{llm.response}</Text>
  </View>
);
```

### Structured output example

```tsx
import { Schema } from 'jsonschema';

const responseSchema: Schema = {
  properties: {
    username: {
      type: 'string',
      description: 'Name of user, that is asking a question.',
    },
    question: {
      type: 'string',
      description: 'Question that user asks.',
    },
    bid: {
      type: 'number',
      description: 'Amount of money, that user offers.',
    },
    currency: {
      type: 'string',
      description: 'Currency of offer.',
    },
  },
  required: ['username', 'bid'],
  type: 'object',
};

// alternatively use Zod
import * as z from 'zod/v4';
const responseSchemaWithZod = z.object({
  username: z
    .string()
    .meta({ description: 'Name of user, that is asking a question.' }),
  question: z.optional(
    z.string().meta({ description: 'Question that user asks.' })
  ),
  bid: z.number().meta({ description: 'Amount of money, that user offers.' }),
  currency: z.optional(z.string().meta({ description: 'Currency of offer.' })),
});

const llm = useLLM({ model: QWEN3_4B_QUANTIZED });

useEffect(() => {
  const formattingInstructions = getStructuredOutputPrompt(responseSchema);
  // alternatively pass schema defined with Zod
  //  const formattingInstructions = getStructuredOutputPrompt(responseSchemaWithZod);

  // Some extra prompting to improve quality of response.
  const prompt = `Your goal is to parse user's messages and return them in JSON format. Don't respond to user. Simply return JSON with user's question parsed. \n${formattingInstructions}\n /no_think`;

  llm.configure({
    chatConfig: {
      systemPrompt: prompt,
    },
  });
}, []);

useEffect(() => {
  const lastMessage = llm.messageHistory.at(-1);
  if (!llm.isGenerating && lastMessage?.role === 'assistant') {
    try {
      const formattedOutput = fixAndValidateStructuredOutput(
        lastMessage.content,
        responseSchemaWithZod
      );
      // Zod will allow you to correctly type output
      const formattedOutputWithZod = fixAndValidateStructuredOutput(
        lastMessage.content,
        responseSchema
      );
      console.log('Formatted output:', formattedOutput, formattedOutputWithZod);
    } catch (e) {
      console.log(
        "Error parsing output and/or output doesn't match required schema!",
        e
      );
    }
  }
}, [llm.messageHistory, llm.isGenerating]);

const send = () => {
  const message = `I'm John. Is this product damaged? I can give you $100 for this.`;
  llm.sendMessage(message);
};

return (
  <View>
    <Button onPress={send} title="Generate!" />
    <Text>{llm.response}</Text>
  </View>
);
```

The response should include JSON:

```json
{
  "username": "John",
  "question": "Is this product damaged?",
  "bid": 100,
  "currency": "USD"
}
```

## Token Batching

Depending on selected model and the user's device generation speed can be above 60 tokens per second. If the [`tokenCallback`](../../06-api-reference/classes/LLMModule.md#tokencallback) from [`LLMModule`](../../06-api-reference/classes/LLMModule.md), which is used under the hood, triggers rerenders and is invoked on every single token it can significantly decrease the app's performance. To alleviate this and help improve performance we've implemented token batching. To configure this you need to call [`configure`](../../06-api-reference/interfaces/LLMType.md#configure) method and pass [`generationConfig`](../../06-api-reference/interfaces/LLMConfig.md#generationconfig). You can check what you can configure [Configuring the Model](../../03-hooks/01-natural-language-processing/useLLM.md#configuring-the-model). They set the size of the batch before tokens are emitted and the maximum time interval between consecutive batches respectively. Each batch is emitted if either `timeInterval` elapses since last batch or `countInterval` number of tokens are generated. This allows for smooth generation even if model lags during generation. Default parameters are set to 10 tokens and 80ms for time interval (~12 batches per second).

## Available models

| Model Family                                                                             |      Sizes       | Quantized |
| ---------------------------------------------------------------------------------------- | :--------------: | :-------: |
| [Hammer 2.1](https://huggingface.co/software-mansion/react-native-executorch-hammer-2.1) |  0.5B, 1.5B, 3B  |    ✅     |
| [Qwen 2.5](https://huggingface.co/software-mansion/react-native-executorch-qwen-2.5)     |  0.5B, 1.5B, 3B  |    ✅     |
| [Qwen 3](https://huggingface.co/software-mansion/react-native-executorch-qwen-3)         |  0.6B, 1.7B, 4B  |    ✅     |
| [Phi 4 Mini](https://huggingface.co/software-mansion/react-native-executorch-phi-4-mini) |        4B        |    ✅     |
| [SmolLM 2](https://huggingface.co/software-mansion/react-native-executorch-smolLm-2)     | 135M, 360M, 1.7B |    ✅     |
| [LLaMA 3.2](https://huggingface.co/software-mansion/react-native-executorch-llama-3.2)   |      1B, 3B      |    ✅     |
