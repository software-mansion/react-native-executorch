---
title: LLM Chat & Text Generation
slug: /extensions/llm-chat-and-generation
description: 'Run generative Large Language Models on-device with token streaming, multi-turn KV cache memory, tool calling, Jinja2 chat templates, multimodal vision inputs, and raw runner control.'
keywords:
  [
    react native,
    llm,
    chat,
    text generation,
    large language model,
    lfm,
    llama,
    smollm,
    bielik,
    streaming,
    tool calling,
    kv cache,
    mobile ml,
    on-device ai,
  ]
---

# LLM Chat & Text Generation

The LLM extension provides high-performance, on-device execution of generative Large Language Models (LLMs) and Vision-Language Models (VLMs). It is designed to handle the nuances of modern autoregressive models:

- **Token Streaming**: Real-time per-token callbacks scheduled directly onto the React Native thread.
- **Incremental KV Cache Management**: Retains previous conversation state in memory and prefills only newly appended tokens to avoid re-evaluating prompt history.
- **Jinja2 Chat Templates**: Dynamically renders Hugging Face `tokenizer_config.json` templates with support for roles, special tokens, and generation headers.
- **Multi-Turn Tool Calling (Function Calling)**: Automated execution loop where the model calls client-side TypeScript functions, processes their outputs, and generates follow-up responses.
- **Multimodal (Vision-Language) Payloads**: Interleaved text and image inputs with automatic tensor preprocessing.
- **Dual Architecture (High-Level Session vs Low-Level Runner)**: Use declarative chat sessions with conversational memory or drop down to raw prompt execution and manual KV cache slicing.

<!-- GIF DEMO PLACEHOLDER: Place LLM chat demo gif here, e.g. ![LLM Chat Demo](./media/llm-chat.gif) -->

## Quick Start

The [`useLLMChatSession`](../../06-api-reference/functions/useLLMChatSession.md) hook manages the full lifecycle: downloading the `.pte` model and tokenizer files, prefilling initial system prompts, tracking message history, and disposing native memory on unmount:

```tsx
import { useState } from 'react';
import { models, useLLMChatSession } from 'react-native-executorch';

function MyChatComponent() {
  const [streamingText, setStreamingText] = useState('');

  const llm = useLLMChatSession(models.llm.LFM2_5_1_2B.DEFAULT, {
    initialMessages: [{ role: 'system', content: 'You are a helpful on-device assistant.' }],
    generationConfig: {
      temperature: 0.2,
      maxNewTokens: 512,
    },
  });

  // Hook state:
  // llm.isReady          — true once model weights and tokenizer are loaded in memory
  // llm.downloadProgress — 0.0 to 1.0 download progress
  // llm.error            — Error instance if download or load failed

  const handleSend = async (userPrompt: string) => {
    if (!llm.isReady || !llm.sendMessage) return;

    setStreamingText('');

    // Stream tokens as they are decoded
    const turn = await llm.sendMessage(userPrompt, (token) => {
      setStreamingText((prev) => prev + token);
    });

    console.log('New messages added this turn:', turn.messages);
    console.log('Turn generation statistics:', turn.stats);
  };

  // Trigger handleSend on submit from a prompt input or chat screen
}
```

<!-- TODO: Update gallery URL once repo is moved to software-mansion organization -->

:::tip Full Interactive Example in Gallery App
See [`src/app/llm-chat.tsx`](https://github.com/barhanc/react-native-executorch-gallery/blob/main/src/app/llm-chat.tsx) in the [React Native ExecuTorch Gallery](https://github.com/barhanc/react-native-executorch-gallery) for a complete, runnable chat UI with token streaming, token/sec benchmarking, and message history.
:::

## Understanding the Output & Turn Result

When you call `sendMessage()`, the promise resolves to an [`LLMChatTurnResult`](../../06-api-reference/type-aliases/LLMChatTurnResult.md) describing what happened during that turn:

```typescript
type LLMChatTurnResult = {
  /**
   * The new messages added to conversation history during this turn.
   * Includes the user prompt, any assistant tool calls, tool responses,
   * and the final assistant message.
   */
  readonly messages: readonly ChatMessage[];

  /**
   * Performance statistics for each generation step in this turn.
   * If the model executed tools, this array contains one entry per generation step.
   */
  readonly stats: readonly LLMGenerationStats[];

  /**
   * The termination reason:
   * - 'stop': The model generated an End-Of-Sequence (EOS) token or hit maxNewTokens.
   * - 'maxToolTurns': The turn was terminated because tool execution reached maxToolTurns.
   */
  readonly finishReason: 'stop' | 'maxToolTurns';
};
```

`stats` is an array because tool calling can trigger multiple consecutive generation steps in a single turn (e.g. `stats[0]` for the model generating the tool call, and `stats[1]` for generating the final answer after tool execution). Each entry provides `numPromptTokens`, `numGeneratedTokens`, `prefillDurationMs`, and start/end timestamps to compute tokens per second (`tok/s`).

## Chat Templates & Incremental KV Cache Diffing

Autoregressive transformer inference spends significant compute processing the input prompt (prefill phase) to generate the Key-Value (KV) cache. Re-encoding the entire conversation history on every turn would result in quadratic latency growth as the dialogue lengthens.

### How Incremental Diffing Works

The library's [`ChatPreprocessor`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/ChatPreprocessor.md) implements an incremental monotonic prompt diffing algorithm:

1. **Prefix Monotonicity**: When a turn begins, the preprocessor renders the conversation prefix `history[0 .. committed]` and the full updated conversation `history[0 .. current]`.
2. It verifies that the rendered prefix is an exact substring match of the beginning of the full prompt string.
3. **Diff Slicing**: Only the new slice `fullPrompt.slice(prefix.length)` is passed to `runner.prefill()`.
4. **Cache Preservation**: The existing KV cache in native memory remains intact, and generation starts immediately after prefilling only the newly added tokens.

:::note Custom Model Compatibility
If you use a custom model whose Jinja template dynamically modifies past turns based on subsequent messages (breaking monotonicity), set `resetOnTurn: true` in your session options. This forces the runner to reset and re-prefill the entire dialogue from token 0 on each turn.
:::

## Multimodal Inputs (Vision-Language Models)

Vision-Language Models (such as Liquid AI's `LFM2_5_VL_450M` and `LFM2_5_VL_1_6B`) process interleaved text and visual payloads:

```typescript
import { models, useLLMChatSession } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function VisionChat() {
  const vlm = useLLMChatSession(models.llm.LFM2_5_VL_450M.DEFAULT);

  const handleAnalyzePhoto = async (image: ImageBuffer) => {
    if (!vlm.isReady || !vlm.sendMessage) return;

    // Send array of interleaved media and text
    const turn = await vlm.sendMessage(
      [
        { kind: 'image', image },
        'What type of flower is this, and what care instructions should I follow?',
      ],
      (token) => {
        process.stdout.write(token);
      }
    );

    console.log('Result:', turn.messages);
  };
}
```

### Multimodal Preprocessor Mechanics

When images are passed into `sendMessage`:

1. The [`ChatPreprocessor`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/ChatPreprocessor.md) embeds sentinel vision tokens (e.g. `<vision>`, `</vision>`) into the rendered Jinja template.
2. It resizes and normalizes the image to the exact tensor shape expected by the model's visual encoder (e.g. `[1, 3, 384, 384]`).
3. The resulting visual embeddings are passed directly to the native multimodal execution runner alongside text token IDs.

## Automated Tool Calling

The LLM chat session supports automated, multi-turn tool calling (function calling). When tool definitions and a parser are supplied, the session automatically invokes tool callbacks, feeds their results back into the conversation, and returns the final assistant answer.

### 1. Define Tools with `execute`

Declare tools matching standard JSON Schema specifications along with an asynchronous `execute` handler:

```typescript
import { type ToolDefinition } from 'react-native-executorch/llm';

export const weatherTool: ToolDefinition<{ location: string; unit?: 'celsius' | 'fahrenheit' }> = {
  type: 'function',
  function: {
    name: 'get_current_weather',
    description: 'Get the current weather conditions for a given city.',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' },
        unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
      },
      required: ['location'],
    },
  },
  execute: async ({ location, unit = 'celsius' }) => {
    // Query local device sensors or web API
    return JSON.stringify({ location, temperature: 22, unit, condition: 'Sunny' });
  },
};
```

### 2. Supply a Tool Parser (`parseToolCalls`)

Because different open-source model families emit tool calls in varying syntax (e.g. XML `<tool_call>` tags, JSON markdown blocks, or special tokens), supply a parser function conforming to [`ToolParser`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/ToolParser.md):

```typescript
import type { ToolParser, ToolParserResult } from 'react-native-executorch/llm';

// Example parser for XML tag syntax:
// <tool_call>{"name": "get_current_weather", "arguments": {"location": "San Francisco"}}</tool_call>
export const xmlToolParser: ToolParser = (text: string): ToolParserResult | undefined => {
  const match = text.match(/<tool_call>([\s\S]*?)<\/tool_call>/);
  if (!match) return undefined;

  try {
    const json = JSON.parse(match[1].trim());
    return {
      toolCalls: [
        {
          function: {
            name: json.name,
            arguments: json.arguments,
          },
        },
      ],
      // Residual text outside the tool call tags
      textContent: text.replace(match[0], '').trim(),
    };
  } catch {
    return undefined;
  }
};
```

### 3. Attach to Session

```typescript
const llm = useLLMChatSession(models.llm.LFM2_5_1_2B.DEFAULT, {
  toolOpts: {
    tools: [weatherTool],
    parseToolCalls: xmlToolParser,
    maxToolTurns: 5, // Maximum consecutive tool execution turns before halting
  },
});
```

## Imperative Session API

For headless background services or non-React architectures, create a full chat session imperatively using [`createLLMChatSession`](../../06-api-reference/functions/createLLMChatSession.md):

```typescript
import { createLLMChatSession, models } from 'react-native-executorch';

const session = await createLLMChatSession(models.llm.LFM2_5_1_2B.DEFAULT, {
  initialMessages: [{ role: 'system', content: 'You are an offline assistant.' }],
  generationConfig: { temperature: 0.3, maxNewTokens: 256 },
});

try {
  const result = await session.sendMessage("Summarize today's logs.");
  console.log('Answer:', result.messages[result.messages.length - 1].content);
} finally {
  session.dispose();
}
```

## Low-Level Runner (`LLMRunner`)

While `useLLMChatSession` and `createLLMChatSession` handle chat formatting, message histories, and automated tool calling loops, you can drop down directly to the native [`LLMRunner`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner.md) via [`llm.createLLMRunner()`](../../06-api-reference/react-native-executorch/namespaces/llm/functions/createLLMRunner.md).

`LLMRunner` operates synchronously on a worklet runtime thread and provides low-level control:

- **Raw Prompt Ingestion**: Pass raw prompt strings or pre-tokenized media payloads without role wrapping or Jinja chat template rendering.
- **Manual Prefill**: Execute `runner.prefill(prompt)` to populate the Key-Value (KV) cache with large background contexts, system prompts, or document chunks before starting interactive generation.
- **Direct Synchronous Generation**: Call `runner.generate(prompt, config, onToken)` to generate text continuations with zero Promise scheduling overhead, executing the `onToken` callback directly on each generated token.
- **KV Cache Inspection & Slicing**: Query `runner.getKVCacheState()` to check occupied tokens (`pos`), max context length (`maxSeqLen`), and context capacity ratio (`usageRatio`).
- **KV Cache Rewind & Branching**: Call `runner.reset(targetPos)` to rewind the KV cache back to an exact token position. This enables speculative branching, sampling multiple divergent continuations from a shared prompt prefix without re-encoding, or manual conversation tree management.
- **Cancellation**: Call `runner.stop()` from any thread to abort active autoregressive generation immediately.

## Available Models

The library provides ready-to-use models from the [Software Mansion HuggingFace LLM & Multimodal Collection](https://huggingface.co/collections/software-mansion/llm-multimodal), pre-packaged with their tokenizers and Jinja chat templates in [`models.llm`](../../06-api-reference/variables/models.md#llm):

| Model                          | Variant                                       | Size       | Platform / Acceleration | Notes                                                                                                |
| :----------------------------- | :-------------------------------------------- | :--------- | :---------------------- | :--------------------------------------------------------------------------------------------------- |
| **Liquid LFM 2.5 1.2B**        | `XNNPACK_8DA4W` (default)                     | 1.14 GB    | Universal (CPU)         | High-performance general-purpose hybrid language model with 8-bit dynamic activation, 4-bit weights. |
| **Liquid LFM 2.5 350M**        | `XNNPACK_8DA4W` (default)                     | 453.9 MB   | Universal (CPU)         | Ultra-compact hybrid model with sub-second response times for light chat and text parsing.           |
| **LFM 2.5 VL 450M**            | `XNNPACK_8DA4W` / `MLX_INT4` / `VULKAN_8DA4W` | ~550 MB    | Multi-backend           | Multimodal vision-language model for image description and visual Q&A.                               |
| **Llama 3.2 1B**               | `XNNPACK_SPINQUANT` (default)                 | ~800 MB    | Universal (CPU)         | Meta instruction-tuned model with SpinQuant quantization.                                            |
| **Llama 3.2 3B**               | `XNNPACK_SPINQUANT` (default)                 | ~1.9 GB    | Universal (CPU)         | High-capacity Meta instruction model for complex reasoning.                                          |
| **SmolLM2 135M / 360M / 1.7B** | `XNNPACK_8DA4W` (default)                     | Multi-size | Universal (CPU)         | Hugging Face compact instruction models for edge efficiency.                                         |
| **Bielik v3 1.5B**             | `XNNPACK_8DA4W` (default)                     | ~1.2 GB    | Universal (CPU)         | SpeakLeash bilingual Polish & English language model.                                                |

:::tip Using Custom Models
To use your own fine-tuned LLM `.pte` model, pass an [`LLMModel`](../../06-api-reference/type-aliases/LLMModel.md) configuration object to `useLLMChatSession` or `createLLMChatSession`:

```typescript
const customSession = await createLLMChatSession({
  modelPath: 'https://example.com/my-llm.pte',
  tokenizerPath: 'https://example.com/tokenizer.json',
  tokenizerConfigPath: 'https://example.com/tokenizer_config.json',
});
```

The pipeline automatically verifies that the model's exported methods and KV cache tensors match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](../../03-core-and-advanced/07-exporting-custom-models.md#using-a-built-in-pipeline).
:::

## API Reference

### Hooks & Pipelines

- [`useLLMChatSession()`](../../06-api-reference/functions/useLLMChatSession.md) — React hook for managing LLM model downloading, KV cache, and conversational sessions.
- [`createLLMChatSession()`](../../06-api-reference/functions/createLLMChatSession.md) — Imperative factory for multi-turn LLM chat sessions.
- [`llm.createLLMRunner()`](../../06-api-reference/react-native-executorch/namespaces/llm/functions/createLLMRunner.md) — Low-level factory for direct prompt execution and KV cache manipulation.
- [`llm.createChatPreprocessor()`](../../06-api-reference/react-native-executorch/namespaces/llm/functions/createChatPreprocessor.md) — Jinja2 template renderer, media processor, and prompt diffing engine.

### Types & Options

- [`LLMChatSession`](../../06-api-reference/type-aliases/LLMChatSession.md) — Active chat session interface (`sendMessage`, `stop`, `getHistory`, `getKVCacheState`, `dispose`).
- [`LLMRunner`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner.md) — Low-level runner interface (`prefill`, `generate`, `reset`, `getKVCacheState`).
- [`ChatPreprocessor`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/ChatPreprocessor.md) — Chat formatting and diffing preprocessor interface.
- [`ToolDefinition`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/ToolDefinition.md) — Tool declaration with JSON Schema parameters and `execute` callback.
- [`ToolParser`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/ToolParser.md) — Parser function type for extracting tool calls from model output.
- [`LLMChatTurnResult`](../../06-api-reference/type-aliases/LLMChatTurnResult.md) — Result of a chat turn with updated messages, finish reason, and performance statistics.
- [`LLMKVCacheState`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMKVCacheState.md) — KV cache metrics (`pos`, `maxSeqLen`, `usageRatio`).
- [`LLMChatSessionOptions`](../../06-api-reference/type-aliases/LLMChatSessionOptions.md) — Session configuration options (`generationConfig`, `initialMessages`, `toolOpts`).
- [`LLMModel`](../../06-api-reference/type-aliases/LLMModel.md) — Model configuration spec with model, tokenizer, and tokenizer config paths.
- [`LLMGenerationConfig`](../../06-api-reference/type-aliases/LLMGenerationConfig.md) — Sampling and decoding parameters (`temperature`, `topP`, `maxNewTokens`).
- [`ChatMessage`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/ChatMessage.md) — Standard chat message structure (`role`, `content`).

### Model Presets

- [`models.llm`](../../06-api-reference/variables/models.md#llm) — Pre-configured LLM models registry.
