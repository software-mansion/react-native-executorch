# LLMs

Run Large Language Models on-device for text generation, chat, tool / function calling, structured JSON output, and vision-language understanding.

Pick models via the typed `models` registry: `models.llm.<model>({ quant?, backend? })`. Calling with no args returns the platform default (quantized variant when one is published). Passing a backend a model doesn't ship is a compile-time error. For full API surface and config options, webfetch [useLLM API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useLLM).

---

## Functional mode (stateless)

```tsx
import { useLLM, models, Message } from 'react-native-executorch';

const llm = useLLM({ model: models.llm.lfm2_5_1_2b_instruct() });

const onGenerate = async () => {
  const chat: Message[] = [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'What is the meaning of life?' },
  ];
  const response = await llm.generate(chat);
  console.log(response);
};

return (
  <View>
    <Button onPress={onGenerate} title="Generate" disabled={!llm.isReady} />
    <Text>{llm.response}</Text>
  </View>
);
```

Each `generate()` call is independent — the hook does not keep history.

---

## Managed mode (stateful chat)

For multi-turn chats, configure once and let the hook manage `messageHistory`:

```tsx
import { useEffect } from 'react';
import { useLLM, models, MessageCountContextStrategy } from 'react-native-executorch';

const llm = useLLM({ model: models.llm.lfm2_5_1_2b_instruct() });

useEffect(() => {
  llm.configure({
    chatConfig: {
      systemPrompt: 'You are a helpful assistant',
      contextStrategy: new MessageCountContextStrategy(6), // keep last 6 messages
    },
    generationConfig: {
      temperature: 0.7,
      topp: 0.9,
      outputTokenBatchSize: 15,
      batchTimeInterval: 100,
    },
  });
}, []);

// Send messages — appended to llm.messageHistory automatically
llm.sendMessage('Hello!');
```

Render the chat from `llm.messageHistory`. `llm.response` streams the in-progress assistant message; `llm.isGenerating` is true during generation.

---

## Interrupting

Always interrupt before unmounting — an in-flight generation will crash the app on tear-down.

```tsx
{llm.isGenerating && <Button onPress={llm.interrupt} title="Stop" />}

useEffect(() => {
  return () => {
    if (llm.isGenerating) llm.interrupt();
  };
}, []);
```

If you're navigating away programmatically, await until `isGenerating` becomes `false` before unmounting.

---

## Tool / function calling

Define tools with a name, description, and JSON-schema-like parameter spec. Implement `executeToolCallback` to actually run the tool. Models with strong tool-calling support: `models.llm.hammer2_1_*`, `models.llm.qwen3_*`.

```tsx
import { useEffect } from 'react';
import {
  useLLM,
  models,
  DEFAULT_SYSTEM_PROMPT,
  LLMTool,
  ToolCall,
} from 'react-native-executorch';

const TOOLS: LLMTool[] = [
  {
    name: 'get_weather',
    description: 'Get current weather in a given location.',
    parameters: {
      type: 'dict',
      properties: {
        location: { type: 'string', description: 'Location to check weather for' },
      },
      required: ['location'],
    },
  },
];

const executeTool = async (call: ToolCall): Promise<string | null> => {
  switch (call.toolName) {
    case 'get_weather':
      return 'It is sunny and 21°C.';
    default:
      return null;
  }
};

const llm = useLLM({ model: models.llm.hammer2_1_1_5b() });

useEffect(() => {
  llm.configure({
    chatConfig: {
      systemPrompt: `${DEFAULT_SYSTEM_PROMPT} Current time: ${new Date().toString()}`,
    },
    toolsConfig: {
      tools: TOOLS,
      executeToolCallback: executeTool,
      displayToolCalls: true,
    },
  });
}, []);
```

In functional mode, pass tools as the second argument: `llm.generate(chat, TOOLS)`.

---

## Structured JSON output

Use `getStructuredOutputPrompt` to build a system prompt from a JSON Schema or Zod schema, then validate the response with `fixAndValidateStructuredOutput`.

```tsx
import * as z from 'zod/v4';
import {
  useLLM,
  models,
  getStructuredOutputPrompt,
  fixAndValidateStructuredOutput,
} from 'react-native-executorch';

const schema = z.object({
  username: z.string().meta({ description: 'User asking the question' }),
  bid: z.number().meta({ description: 'Offer in the user message' }),
  currency: z.optional(z.string()),
});

const llm = useLLM({ model: models.llm.qwen3_4b() });

useEffect(() => {
  const instructions = getStructuredOutputPrompt(schema);
  llm.configure({
    chatConfig: {
      systemPrompt:
        `Parse the user's message and return JSON. Don't reply to the user. ${instructions} /no_think`,
    },
  });
}, []);

useEffect(() => {
  const last = llm.messageHistory.at(-1);
  if (!llm.isGenerating && last?.role === 'assistant') {
    try {
      const parsed = fixAndValidateStructuredOutput(last.content, schema);
      console.log(parsed); // typed by Zod
    } catch (e) {
      console.warn('Output did not match schema', e);
    }
  }
}, [llm.messageHistory, llm.isGenerating]);
```

`getStructuredOutputPrompt` accepts both JSON Schema (`jsonschema`) and Zod schemas.

---

## Vision-Language Models (VLM)

Some LLMs accept image + text input. They live under `models.llm` too — pick them by capability. Pass an image alongside text via `imagePath` (managed) or `mediaPath` on a `Message` (functional).

```tsx
import { useLLM, models, Message } from 'react-native-executorch';

const llm = useLLM({ model: models.llm.lfm2_5_vl_1_6b() });

// Managed
llm.sendMessage('What is in this image?', { imagePath: '/path/to/image.jpg' });

// Functional
const chat: Message[] = [
  { role: 'user', content: 'Describe this image.', mediaPath: '/path/to/image.jpg' },
];
await llm.generate(chat);
```

`imagePath` / `mediaPath` must be a local filesystem path. To use a remote image, download it first (e.g. via the resource-fetcher adapter — see [setup.md](./setup.md)).

---

## Choosing options on the accessor

```ts
// Platform default (quantized when published).
models.llm.llama3_2_3b();

// Non-quantized variant.
models.llm.llama3_2_3b({ quant: false });

// Explicit backend — only the backends the model actually ships are accepted.
models.llm.qwen3_4b({ backend: 'xnnpack' });
```

---

## Model selection

| Device tier | Parameter range | Recommended accessors |
|---|---|---|
| Low-end | 135M–500M | `models.llm.smollm2_1_135m`, `models.llm.smollm2_1_360m`, `models.llm.lfm2_5_350m` |
| Mid-range | 0.5B–1.7B | `models.llm.llama3_2_1b`, `models.llm.qwen3_0_6b`, `models.llm.smollm2_1_1_7b`, `models.llm.lfm2_5_1_2b_instruct`, `models.llm.hammer2_1_1_5b`, `models.llm.bielik_v3_0_1_5b` |
| High-end | 1.7B–4B | `models.llm.llama3_2_3b`, `models.llm.qwen3_4b`, `models.llm.qwen3_5_2b`, `models.llm.phi_4_mini_4b`, `models.llm.hammer2_1_3b` |
| VLM | 450M / 1.6B | `models.llm.lfm2_5_vl_450m`, `models.llm.lfm2_5_vl_1_6b` |

Full per-device benchmarks: webfetch [Inference time benchmarks](https://docs.swmansion.com/react-native-executorch/docs/benchmarks/inference-time).

---

## Troubleshooting

- **Crash on unmount.** Active generation was not interrupted — call `llm.interrupt()` and wait for `isGenerating === false`.
- **Out-of-memory at load.** Pick a smaller accessor or stay on the default (quantized) variant.
- **Poor output quality.** Try a larger model, raise `temperature` / `topp`, or improve the system prompt. For Qwen 3 reasoning models, pass `/no_think` in the prompt to skip the thinking phase.
- **Tool calls never fire.** Use a tool-tuned model (`models.llm.hammer2_1_*`) and ensure `executeToolCallback` is set.

---

## See also

- [useLLM API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useLLM)
- [LLMModule (non-hook) API](https://docs.swmansion.com/react-native-executorch/docs/typescript-api/natural-language-processing/LLMModule)
- [LLM HuggingFace collection](https://huggingface.co/collections/software-mansion/llm)
