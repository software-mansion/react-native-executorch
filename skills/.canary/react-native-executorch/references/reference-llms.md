---
title: LLMs usage
description: Reference for using Large Language Models in React Native Executorch.
---

# useLLM

**Purpose:** Run Large Language Models (LLMs) on-device for text generation, chat, tool calling, and structured outputs.

**Use cases:** AI assistants, text generation, function calling, structured data extraction.

## Basic Usage

```typescript
import { useLLM, LLAMA3_2_1B } from 'react-native-executorch';

const llm = useLLM({ model: LLAMA3_2_1B });
```

## Functional Mode (Stateless)

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

## Managed Mode (Stateful)

```tsx
// Configure the model
useEffect(() => {
  llm.configure({
    chatConfig: {
      systemPrompt: 'You are a helpful assistant',
      contextWindowLength: 10,
    },
    generationConfig: {
      temperature: 0.7,
      topp: 0.9,
    },
  });
}, []);

// Send messages
llm.sendMessage('Hello!');

// Access conversation history
console.log(llm.messageHistory);
```

## Tool Calling

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

export const executeTool: (call: ToolCall) => Promise<string | null> = async (
  call
) => {
  switch (call.toolName) {
    case 'get_weather':
      return await get_weather(call);
    default:
      console.error(`Wrong function! We don't handle it!`);
      return null;
  }
};

const { configure } = llm;
useEffect(() => {
  configure({
    chatConfig: {
      systemPrompt: `${DEFAULT_SYSTEM_PROMPT} Current time and date: ${new Date().toString()}`,
    },
    toolsConfig: {
      tools: TOOL_DEFINITIONS,
      executeToolCallback: executeTool,
      displayToolCalls: true,
    },
  });
}, [configure]);

return (
  <View>
    <Button onPress={handleGenerate} title="Generate!" />
    <Text>{llm.response}</Text>
  </View>
);
```

## Structured Output

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

## Interrupting Generation

```tsx
// Stop generating
llm.interrupt();

// Check if generating
{
  llm.isGenerating && <Button onPress={llm.interrupt} title="Stop" />;
}
```

## Troubleshooting

**Memory issues:** Use quantized models on lower-end devices - suggest smaller models as lower-end devices might not be able to fit LLMs into memory.
**Crash on unmount:** Always call `llm.interrupt()` and wait for `isGenerating === false` before unmounting.
**Reasoning mode:** Model-specific feature (e.g., Qwen 3 uses `/no_think` suffix to disable) - search for a way to disable the reasoning.

## Additional references

- [useLLM docs](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useLLM)
- [HuggingFace repository with exported models](https://huggingface.co/collections/software-mansion/llm)
- [Available LLM model constants](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---lmm)
- [API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useLLM)
