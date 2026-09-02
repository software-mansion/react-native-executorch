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

The LLM extension lets you run generative Large Language Models (LLMs) and Vision-Language Models (VLMs) directly on user devices with real-time token streaming, complete privacy, and full offline support. Depending on what you are building, you can choose between two levels of control:

- **Chat Sessions ([`useLLMChatSession`](#quick-start) / [`createLLMChatSession`](#imperative-session-api))**: The recommended API for conversational apps and AI assistants. It manages multi-turn conversation history, applies [Jinja2 chat templates](#chat-templates--incremental-kv-cache-diffing), supports [multimodal image inputs](#multimodal-inputs), and handles [automated tool calling](#automated-tool-calling).
- **Low-Level Runner ([`LLMRunner`](#low-level-runner))**: A direct execution engine that operates on worklet threads. It processes raw text strings or media tensors without chat formatting, giving you manual control over KV cache prefilling, synchronous generation loops, and context rewinding.

<table className="showcase-table">
  <thead>
    <tr>
      <th>iOS</th>
      <th>Android</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <div className="device-phone iphone-chassis">
          <div className="device-screen iphone-screen">
            <video
              className="device-video"
              src="/react-native-executorch/media/llm-chat-ios.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>
      </td>
      <td>
        <div className="device-phone s24-chassis">
          <div className="s24-camera-hole"></div>
          <div className="device-screen s24-screen">
            <video
              className="device-video"
              src="/react-native-executorch/media/llm-chat-android.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>
      </td>
    </tr>
  </tbody>
</table>

## Quick Start

The [`useLLMChatSession`](../../06-api-reference/functions/useLLMChatSession.md) hook handles remote model downloading, caching, tokenizer setup, and conversational state in a single React hook:

```tsx
import { useState } from 'react';
import { models, useLLMChatSession } from 'react-native-executorch';

function MyChatComponent() {
  const [streamingText, setStreamingText] = useState('');

  const session = useLLMChatSession(models.llm.LFM2_5_1_2B.DEFAULT, {
    initialMessages: [{ role: 'system', content: 'You are a helpful on-device assistant.' }],
    generationConfig: {
      temperature: 0.2,
      maxNewTokens: 512,
    },
  });

  // Hook state:
  // session.isReady          — true once model weights and tokenizer are loaded in memory
  // session.downloadProgress — 0.0 to 1.0 download progress
  // session.error            — Error instance if download or load failed

  const handleSend = async (userPrompt: string) => {
    if (!session.isReady || !session.sendMessage) return;

    setStreamingText('');

    // Stream tokens as they are decoded
    const turn = await session.sendMessage(userPrompt, (token) => {
      setStreamingText((prev) => prev + token);
    });

    console.log('New messages added this turn:', turn.messages);
    console.log('Turn generation statistics:', turn.stats);
  };

  // Trigger handleSend on submit from a prompt input or chat screen
}
```

:::tip Full Interactive Example in Gallery App
See [`src/app/(screens)/llm-chat.tsx`](<https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/main/src/app/(screens)/llm-chat.tsx>) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable chat UI with token streaming, token/sec benchmarking, and message history.
:::

## Understanding the Output & Turn Result

When you call [`sendMessage()`](../../06-api-reference/type-aliases/LLMChatSession.md#sendmessage), the promise resolves to an [`LLMChatTurnResult`](../../06-api-reference/type-aliases/LLMChatTurnResult.md) describing what happened during that turn:

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

[`stats`](../../06-api-reference/type-aliases/LLMChatTurnResult.md#stats) is an array of [`LLMGenerationStats`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMGenerationStats.md) because tool calling can trigger multiple consecutive generation steps in a single turn (e.g. `stats[0]` for the model generating the tool call, and `stats[1]` for generating the final answer after tool execution). Each entry provides [`numPromptTokens`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMGenerationStats.md#numprompttokens), [`numGeneratedTokens`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMGenerationStats.md#numgeneratedtokens), [`prefillDurationMs`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMGenerationStats.md#prefilldurationms), and start/end timestamps ([`inferenceStartMs`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMGenerationStats.md#inferencestartms) / [`inferenceEndMs`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMGenerationStats.md#inferenceendms)) to compute tokens per second (`tok/s`).

## Chat Templates & Incremental KV Cache Diffing

Under the hood, [`createChatPreprocessor`](../../06-api-reference/react-native-executorch/namespaces/llm/functions/createChatPreprocessor.md) renders [`ChatMessage[]`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/ChatMessage.md) arrays using the model's official Jinja2 template from `tokenizer_config.json` (formatting special tokens, roles, and generation headers).

To keep multi-turn chat responsive without re-encoding past history on every message, the preprocessor uses incremental prompt diffing:

1. It verifies that the rendered prefix of previously committed turns is an exact substring match of the newly updated conversation.
2. It slices out only the newly appended tokens and passes them to [`runner.prefill()`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner.md#prefill).
3. The existing Key-Value (KV) cache in native memory is preserved, so generation starts immediately without recalculating prior turns.

:::note Custom Model Compatibility
If you use a custom model whose Jinja template dynamically rewires earlier turns when new messages arrive (breaking monotonicity), pass [`resetOnTurn: true`](../../06-api-reference/type-aliases/LLMChatSessionOptions.md#resetonturn) in your session options to force full re-encoding each turn.
:::

## Multimodal Inputs

Vision-Language Models (such as Liquid AI's [`LFM2_5_VL_450M`](../../06-api-reference/variables/models.md#llmlfm2_5_vl_450m) and [`LFM2_5_VL_1_6B`](../../06-api-reference/variables/models.md#llmlfm2_5_vl_1_6b)) process interleaved text and visual payloads:

```typescript
import { models, useLLMChatSession } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';

function VisionChat() {
  const session = useLLMChatSession(models.llm.LFM2_5_VL_450M.DEFAULT);

  const handleAnalyzePhoto = async (image: ImageBuffer) => {
    if (!session.isReady || !session.sendMessage) return;

    // Send array of interleaved media and text
    const turn = await session.sendMessage(
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

The session automatically embeds the model's sentinel vision tokens, resizes and normalizes the image buffer to the vision encoder's target shape, and feeds the resulting image tensors into the multimodal execution runner alongside text tokens.

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
const session = useLLMChatSession(models.llm.LFM2_5_1_2B.DEFAULT, {
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
import { createLLMChatSession, download, models } from 'react-native-executorch';

// Download and cache LLM weights and tokenizer files
const model = await download(models.llm.LFM2_5_1_2B.DEFAULT);
const session = await createLLMChatSession(model, {
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

## Low-Level Runner

While [`useLLMChatSession`](../../06-api-reference/functions/useLLMChatSession.md) and [`createLLMChatSession`](../../06-api-reference/functions/createLLMChatSession.md) handle chat formatting, message histories, and automated tool calling loops, you can drop down directly to the native [`LLMRunner`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner.md) via [`llm.createLLMRunner()`](../../06-api-reference/react-native-executorch/namespaces/llm/functions/createLLMRunner.md).

[`LLMRunner`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner.md) operates synchronously on a worklet runtime thread and provides low-level control:

- **Raw Prompt Ingestion**: Pass raw prompt strings or preprocessed image tensors directly to the runner without role formatting or Jinja chat template rendering.
- **Manual Prefill**: Execute [`runner.prefill(prompt)`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner.md#prefill) to populate the Key-Value (KV) cache with large background contexts, system prompts, or document chunks before starting interactive generation.
- **Direct Synchronous Generation**: Call [`runner.generate(prompt, config, onToken)`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner.md#generate) to generate text continuations with zero Promise scheduling overhead, executing the `onToken` callback directly on each generated token.
- **KV Cache Inspection & Slicing**: Query [`runner.getKVCacheState()`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner.md#getkvcachestate) to check occupied tokens ([`pos`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMKVCacheState.md#pos)), max context length ([`maxSeqLen`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMKVCacheState.md#maxseqlen)), and context capacity ratio ([`usageRatio`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMKVCacheState.md#usageratio)).
- **KV Cache Rewind & Branching**: Call [`runner.reset(targetPos)`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner.md#reset) to rewind the KV cache back to an exact token position. This enables speculative branching, sampling multiple divergent continuations from a shared prompt prefix without re-encoding, or manual conversation tree management.
- **Cancellation**: Call [`runner.stop()`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner.md#stop) from any thread to abort active autoregressive generation immediately.

## Available Models

The library provides ready-to-use models from the [Software Mansion HuggingFace LLM Collection](https://huggingface.co/collections/software-mansion/llm-multimodal), pre-packaged with their tokenizers and Jinja chat templates in [`models.llm`](../../06-api-reference/variables/models.md#llm):

| Model Family             | Variants                                                                                                                                                                                                                                                                                       | Size Range        | Supported Backends                           | Notes                                                                       |
| :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------- | :------------------------------------------- | :-------------------------------------------------------------------------- |
| **Liquid LFM 2.5**       | [`350M`](../../06-api-reference/variables/models.md#llmlfm2_5_350m), [`1.2B`](../../06-api-reference/variables/models.md#llmlfm2_5_1_2b), [`VL 450M`](../../06-api-reference/variables/models.md#llmlfm2_5_vl_450m), [`VL 1.6B`](../../06-api-reference/variables/models.md#llmlfm2_5_vl_1_6b) | 265 MB – 2.43 GB  | XNNPACK (CPU), MLX (Apple), Vulkan (Android) | Fast hybrid RNN/Transformer for low-latency chat & visual reasoning.        |
| **Meta Llama 3.2**       | [`1B`](../../06-api-reference/variables/models.md#llmllama3_2_1b), [`3B`](../../06-api-reference/variables/models.md#llmllama3_2_3b)                                                                                                                                                           | 1.06 GB – 5.99 GB | XNNPACK (CPU)                                | High-quality reasoning, summarization, and instruction following.           |
| **Google Gemma 4**       | [`E2B`](../../06-api-reference/variables/models.md#llmgemma4_e2b)                                                                                                                                                                                                                              | 2.45 GB – 2.70 GB | XNNPACK (CPU), MLX (Apple), Vulkan (Android) | High-fidelity instruction following from Google DeepMind research.          |
| **Alibaba Qwen 3**       | [`0.6B`](../../06-api-reference/variables/models.md#llmqwen3_0_6b), [`1.7B`](../../06-api-reference/variables/models.md#llmqwen3_1_7b), [`4B`](../../06-api-reference/variables/models.md#llmqwen3_4b)                                                                                         | 482 MB – 7.49 GB  | XNNPACK (CPU)                                | Next-gen compact multilingual models supporting 29+ languages.              |
| **Alibaba Qwen 2.5**     | [`0.5B`](../../06-api-reference/variables/models.md#llmqwen2_5_0_5b), [`1.5B`](../../06-api-reference/variables/models.md#llmqwen2_5_1_5b), [`3B`](../../06-api-reference/variables/models.md#llmqwen2_5_3b)                                                                                   | 417 MB – 5.75 GB  | XNNPACK (CPU)                                | Proven multilingual instruction models across code, math, and chat.         |
| **Hammer 2.1**           | [`0.5B`](../../06-api-reference/variables/models.md#llmhammer2_1_0_5b), [`1.5B`](../../06-api-reference/variables/models.md#llmhammer2_1_1_5b), [`3B`](../../06-api-reference/variables/models.md#llmhammer2_1_3b)                                                                             | 398 MB – 5.75 GB  | XNNPACK (CPU)                                | Fine-tuned function calling for automated tool execution & structured JSON. |
| **Microsoft Phi-4 Mini** | [`3.8B`](../../06-api-reference/variables/models.md#llmphi4_mini)                                                                                                                                                                                                                              | 2.62 GB – 7.15 GB | XNNPACK (CPU)                                | High-density reasoning model for STEM problem solving & coding.             |
| **SpeakLeash Bielik v3** | [`1.5B`](../../06-api-reference/variables/models.md#llmbielik_v3_1_5b)                                                                                                                                                                                                                         | 923 MB – 2.97 GB  | XNNPACK (CPU)                                | Bilingual Polish & English instruction model.                               |

:::tip Using Custom Models
To use your own fine-tuned LLM `.pte` model, pass an [`LLMModel`](../../06-api-reference/type-aliases/LLMModel.md) configuration object to [`useLLMChatSession`](../../06-api-reference/functions/useLLMChatSession.md) or [`createLLMChatSession`](../../06-api-reference/functions/createLLMChatSession.md):

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
- [`LLMGenerationConfig`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMGenerationConfig.md) — Sampling and decoding parameters (`temperature`, `topP`, `maxNewTokens`).
- [`ChatMessage`](../../06-api-reference/react-native-executorch/namespaces/llm/type-aliases/ChatMessage.md) — Standard chat message structure (`role`, `content`).

### Model Presets

- [`models.llm`](../../06-api-reference/variables/models.md#llm) — Pre-configured LLM models registry.
