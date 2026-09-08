# LLM Chat & Text Generation

The LLM extension lets you run generative Large Language Models (LLMs) and Vision-Language Models (VLMs) directly on user devices with real-time token streaming, complete privacy, and full offline support. Depending on what you are building, you can choose between two levels of control:

* **Chat Sessions ([`useLLMChatSession`](#quick-start) / [`createLLMChatSession`](#imperative-session-api))**: The recommended API for conversational apps and AI assistants. It manages multi-turn conversation history, applies [Jinja2 chat templates](#chat-templates--incremental-kv-cache-diffing), supports [multimodal image inputs](#multimodal-inputs), and handles [automated tool calling](#automated-tool-calling).
* **Low-Level Runner ([`LLMRunner`](#low-level-runner))**: A direct execution engine that operates on worklet threads. It processes raw text strings or media tensors without chat formatting, giving you manual control over KV cache prefilling, synchronous generation loops, and context rewinding.

| iOS                                                 | Android                                                 |
| --------------------------------------------------- | ------------------------------------------------------- |
| [](/react-native-executorch/media/llm-chat-ios.mp4) | [](/react-native-executorch/media/llm-chat-android.mp4) |

## Quick Start[​](#quick-start "Direct link to Quick Start")

The [`useLLMChatSession`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useLLMChatSession) hook handles remote model downloading, caching, tokenizer setup, and conversational state in a single React hook:

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
  // session.downloadProgress — 0 to 100 download progress
  // session.error            — Error instance if download or load failed
  // session.resource         — resolved config with all URLs replaced by local file paths

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

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Full Interactive Example in Gallery App

See [`src/app/(screens)/llm-chat.tsx`](https://github.com/software-mansion-labs/react-native-executorch-gallery/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/src/app/\(screens\)/llm-chat.tsx) in the [React Native ExecuTorch Gallery](https://github.com/software-mansion-labs/react-native-executorch-gallery) for a complete, runnable chat UI with token streaming, token/sec benchmarking, and message history.

## Understanding the Output & Turn Result[​](#understanding-the-output--turn-result "Direct link to Understanding the Output & Turn Result")

When you call [`sendMessage()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/LLMChatSession#sendmessage), the promise resolves to an [`LLMChatTurnResult`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/LLMChatTurnResult) describing what happened during that turn:

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

[`stats`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/LLMChatTurnResult#stats) is an array of [`LLMGenerationStats`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMGenerationStats) because tool calling can trigger multiple consecutive generation steps in a single turn (e.g. `stats[0]` for the model generating the tool call, and `stats[1]` for generating the final answer after tool execution). Each entry provides [`numPromptTokens`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMGenerationStats#numprompttokens), [`numGeneratedTokens`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMGenerationStats#numgeneratedtokens), [`prefillDurationMs`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMGenerationStats#prefilldurationms), and start/end timestamps ([`inferenceStartMs`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMGenerationStats#inferencestartms) / [`inferenceEndMs`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMGenerationStats#inferenceendms)) to compute tokens per second (`tok/s`).

## Chat Templates & Incremental KV Cache Diffing[​](#chat-templates--incremental-kv-cache-diffing "Direct link to Chat Templates & Incremental KV Cache Diffing")

Under the hood, [`createChatPreprocessor`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/functions/createChatPreprocessor) renders [`ChatMessage[]`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/ChatMessage) arrays using the model's official Jinja2 template from `tokenizer_config.json` (formatting special tokens, roles, and generation headers).

To keep multi-turn chat responsive without re-encoding past history on every message, the preprocessor uses incremental prompt diffing:

1. It verifies that the rendered prefix of previously committed turns is an exact substring match of the newly updated conversation.
2. It slices out only the newly appended tokens and passes them to [`runner.prefill()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner#prefill).
3. The existing Key-Value (KV) cache in native memory is preserved, so generation starts immediately without recalculating prior turns.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Custom Model Compatibility

If you use a custom model whose Jinja template dynamically rewires earlier turns when new messages arrive (breaking monotonicity), pass [`resetOnTurn: true`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/LLMChatSessionOptions#resetonturn) in your session options to force full re-encoding each turn.

## Multimodal Inputs[​](#multimodal-inputs "Direct link to Multimodal Inputs")

Vision-Language Models (such as Liquid AI's [`LFM2_5_VL_450M`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmlfm2_5_vl_450m) and [`LFM2_5_VL_1_6B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmlfm2_5_vl_1_6b)) process interleaved text and visual payloads:

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

## Automated Tool Calling[​](#automated-tool-calling "Direct link to Automated Tool Calling")

The LLM chat session supports automated, multi-turn tool calling (function calling). When tool definitions and a parser are supplied, the session automatically invokes tool callbacks, feeds their results back into the conversation, and returns the final assistant answer.

### 1. Define Tools with `execute`[​](#1-define-tools-with-execute "Direct link to 1-define-tools-with-execute")

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

### 2. Supply a Tool Parser (`parseToolCalls`)[​](#2-supply-a-tool-parser-parsetoolcalls "Direct link to 2-supply-a-tool-parser-parsetoolcalls")

Because different open-source model families emit tool calls in varying syntax (e.g. XML `<tool_call>` tags, JSON markdown blocks, or special tokens), supply a parser function conforming to [`ToolParser`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/ToolParser):

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

### 3. Attach to Session[​](#3-attach-to-session "Direct link to 3. Attach to Session")

```typescript
const session = useLLMChatSession(models.llm.LFM2_5_1_2B.DEFAULT, {
  toolOpts: {
    tools: [weatherTool],
    parseToolCalls: xmlToolParser,
    maxToolTurns: 5, // Maximum consecutive tool execution turns before halting
  },
});

```

## Imperative Session API[​](#imperative-session-api "Direct link to Imperative Session API")

For headless background services or non-React architectures, create a full chat session imperatively using [`createLLMChatSession`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createLLMChatSession):

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

## Low-Level Runner[​](#low-level-runner "Direct link to Low-Level Runner")

While [`useLLMChatSession`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useLLMChatSession) and [`createLLMChatSession`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createLLMChatSession) handle chat formatting, message histories, and automated tool calling loops, you can drop down directly to the native [`LLMRunner`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner) via [`llm.createLLMRunner()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/functions/createLLMRunner).

[`LLMRunner`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner) operates synchronously on a worklet runtime thread and provides low-level control:

* **Raw Prompt Ingestion**: Pass raw prompt strings or preprocessed image tensors directly to the runner without role formatting or Jinja chat template rendering.
* **Manual Prefill**: Execute [`runner.prefill(prompt)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner#prefill) to populate the Key-Value (KV) cache with large background contexts, system prompts, or document chunks before starting interactive generation.
* **Direct Synchronous Generation**: Call [`runner.generate(prompt, config, onToken)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner#generate) to generate text continuations with zero Promise scheduling overhead, executing the `onToken` callback directly on each generated token.
* **KV Cache Inspection & Slicing**: Query [`runner.getKVCacheState()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner#getkvcachestate) to check occupied tokens ([`pos`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMKVCacheState#pos)), max context length ([`maxSeqLen`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMKVCacheState#maxseqlen)), and context capacity ratio ([`usageRatio`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMKVCacheState#usageratio)).
* **KV Cache Rewind & Branching**: Call [`runner.reset(targetPos)`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner#reset) to rewind the KV cache back to an exact token position. This enables speculative branching, sampling multiple divergent continuations from a shared prompt prefix without re-encoding, or manual conversation tree management.
* **Cancellation**: Call [`runner.stop()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner#stop) from any thread to abort active autoregressive generation immediately.

## Available Models[​](#available-models "Direct link to Available Models")

The library provides ready-to-use models from the [Software Mansion HuggingFace LLM Collection](https://huggingface.co/collections/software-mansion/llm-multimodal), pre-packaged with their tokenizers and Jinja chat templates in [`models.llm`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llm):

| Model Family             | Variants                                                                                                                                                                                                                                                                                                                                               | Size Range        | Supported Backends                           | Notes                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| **Liquid LFM 2.5**       | [`350M`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmlfm2_5_350m), [`1.2B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmlfm2_5_1_2b)                                                                                                                       | 265 MB – 2.43 GB  | XNNPACK (CPU), MLX (Apple)                   | Fast hybrid RNN/Transformer for low-latency chat.                           |
| **Liquid LFM 2.5 VL**    | [`VL 450M`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmlfm2_5_vl_450m), [`VL 1.6B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmlfm2_5_vl_1_6b)                                                                                                           | 376 MB – 2.36 GB  | XNNPACK (CPU), MLX (Apple), Vulkan (Android) | Vision-language variants for image understanding and visual reasoning.      |
| **Meta Llama 3.2**       | [`1B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmllama3_2_1b), [`3B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmllama3_2_3b)                                                                                                                           | 1.06 GB – 5.99 GB | XNNPACK (CPU), MLX (Apple)                   | High-quality reasoning, summarization, and instruction following.           |
| **Google Gemma 4**       | [`E2B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmgemma4_e2b)                                                                                                                                                                                                                                          | 2.45 GB – 2.70 GB | XNNPACK (CPU), MLX (Apple), Vulkan (Android) | High-fidelity instruction following from Google DeepMind research.          |
| **Alibaba Qwen 3**       | [`0.6B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmqwen3_0_6b), [`1.7B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmqwen3_1_7b), [`4B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmqwen3_4b)             | 482 MB – 7.49 GB  | XNNPACK (CPU), MLX (Apple)                   | Next-gen compact multilingual models supporting 29+ languages.              |
| **Alibaba Qwen 2.5**     | [`0.5B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmqwen2_5_0_5b), [`1.5B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmqwen2_5_1_5b), [`3B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmqwen2_5_3b)       | 417 MB – 5.75 GB  | XNNPACK (CPU), MLX (Apple)                   | Proven multilingual instruction models across code, math, and chat.         |
| **Hammer 2.1**           | [`0.5B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmhammer2_1_0_5b), [`1.5B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmhammer2_1_1_5b), [`3B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmhammer2_1_3b) | 398 MB – 5.75 GB  | XNNPACK (CPU), MLX (Apple)                   | Fine-tuned function calling for automated tool execution & structured JSON. |
| **Microsoft Phi-4 Mini** | [`3.8B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmphi4_mini)                                                                                                                                                                                                                                          | 2.62 GB – 7.15 GB | XNNPACK (CPU), MLX (Apple)                   | High-density reasoning model for STEM problem solving & coding.             |
| **HuggingFace SmolLM2**  | [`135M`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmsmollm2_135m), [`360M`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmsmollm2_360m), [`1.7B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmsmollm2_1_7b)   | 158 MB – 1.83 GB  | XNNPACK (CPU), MLX (Apple)                   | Smallest footprint family, for constrained devices and fast drafting.       |
| **SpeakLeash Bielik v3** | [`1.5B`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llmbielik_v3_1_5b)                                                                                                                                                                                                                                     | 923 MB – 2.97 GB  | XNNPACK (CPU)                                | Bilingual Polish & English instruction model.                               |

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Using Custom Models

To use your own fine-tuned LLM `.pte` model, pass an [`LLMModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/LLMModel) configuration object to [`useLLMChatSession`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useLLMChatSession) or [`createLLMChatSession`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createLLMChatSession):

```typescript
const customSession = await createLLMChatSession({
  modelPath: 'https://example.com/my-llm.pte',
  tokenizerPath: 'https://example.com/tokenizer.json',
  tokenizerConfigPath: 'https://example.com/tokenizer_config.json',
});

```

The pipeline automatically verifies that the model's exported methods and KV cache tensors match its requirements. To prepare and export your own `.pte` model to match this pipeline, see [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md#using-a-built-in-pipeline).

## API Reference[​](#api-reference "Direct link to API Reference")

### Hooks & Pipelines[​](#hooks--pipelines "Direct link to Hooks & Pipelines")

* [`useLLMChatSession()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useLLMChatSession) — React hook for managing LLM model downloading, KV cache, and conversational sessions.
* [`createLLMChatSession()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/createLLMChatSession) — Imperative factory for multi-turn LLM chat sessions.
* [`llm.createLLMRunner()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/functions/createLLMRunner) — Low-level factory for direct prompt execution and KV cache manipulation.
* [`llm.createChatPreprocessor()`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/functions/createChatPreprocessor) — Jinja2 template renderer, media processor, and prompt diffing engine.

### Types & Options[​](#types--options "Direct link to Types & Options")

* [`LLMChatSession`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/LLMChatSession) — Active chat session interface (`sendMessage`, `stop`, `getHistory`, `getKVCacheState`, `dispose`).
* [`LLMRunner`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMRunner) — Low-level runner interface (`prefill`, `generate`, `reset`, `getKVCacheState`).
* [`ChatPreprocessor`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/ChatPreprocessor) — Chat formatting and diffing preprocessor interface.
* [`ToolDefinition`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/ToolDefinition) — Tool declaration with JSON Schema parameters and `execute` callback.
* [`ToolParser`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/ToolParser) — Parser function type for extracting tool calls from model output.
* [`LLMChatTurnResult`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/LLMChatTurnResult) — Result of a chat turn with updated messages, finish reason, and performance statistics.
* [`LLMKVCacheState`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMKVCacheState) — KV cache metrics (`pos`, `maxSeqLen`, `usageRatio`).
* [`LLMChatSessionOptions`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/LLMChatSessionOptions) — Session configuration options (`generationConfig`, `initialMessages`, `toolOpts`).
* [`LLMModel`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/type-aliases/LLMModel) — Model configuration spec with model, tokenizer, and tokenizer config paths.
* [`LLMGenerationConfig`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/LLMGenerationConfig) — Sampling and decoding parameters (`temperature`, `topP`, `maxNewTokens`).
* [`ChatMessage`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/react-native-executorch/namespaces/llm/type-aliases/ChatMessage) — Standard chat message structure (`role`, `content`).

### Model Presets[​](#model-presets "Direct link to Model Presets")

* [`models.llm`](https://docs.swmansion.com/react-native-executorch/docs/api-reference/variables/models#llm) — Pre-configured LLM models registry.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Source Code

View the implementation on GitHub:

* [`src/extensions/llm/tasks/llmChatSession.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/tasks/llmChatSession.ts)
* [`src/extensions/llm/llmRunner.ts` ↗](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/llm/llmRunner.ts)
