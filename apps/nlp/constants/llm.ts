import { models, type llm, type LLMModel, type LLMToolOpts } from 'react-native-executorch';
import { parse, tokenize } from '@huggingface/jinja';

export const TOOLS: llm.ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Returns the current device date and time in string format.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
    execute: () => {
      return `Current time: ${new Date().toLocaleString()}`;
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_location',
      description: 'Returns the user current location (city and country).',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
    execute: () => {
      return JSON.stringify({ city: 'San Francisco', state: 'California', country: 'USA' });
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Returns the current weather conditions for a given city.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'The city to get weather for' },
        },
        required: ['city'],
      },
    },
    execute: (args: Record<string, any>) => {
      const city = String(args.city);
      if (city.toLowerCase().includes('san francisco')) {
        return JSON.stringify({
          city: 'San Francisco',
          temperatureC: 13,
          condition: 'Foggy, chilly with light drizzle',
          humidity: '88%',
          windKmh: 24,
        });
      }
      return JSON.stringify({
        city,
        temperatureC: 22,
        condition: 'Partly sunny and pleasant',
        humidity: '50%',
        windKmh: 10,
      });
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_outfit_recommendation',
      description: 'Recommends appropriate clothing based on weather condition and temperature.',
      parameters: {
        type: 'object',
        properties: {
          condition: { type: 'string', description: 'The weather condition (e.g. rainy, sunny)' },
          temperatureC: { type: 'number', description: 'Temperature in degrees Celsius' },
        },
        required: ['condition', 'temperatureC'],
      },
    },
    execute: (args: Record<string, any>) => {
      const temp = Number(args.temperatureC);
      const condition = String(args.condition).toLowerCase();
      let advice = '';
      if (temp < 15) {
        advice += 'Wear a windbreaker or warm fleece jacket with long pants.';
      } else if (temp < 22) {
        advice += 'A light sweater or long-sleeve shirt is ideal.';
      } else {
        advice += 'T-shirt and shorts or light clothing are recommended.';
      }
      if (condition.includes('rain') || condition.includes('drizzle')) {
        advice += ' Bring a compact umbrella and waterproof shoes.';
      }
      return advice;
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate',
      description: 'Performs basic arithmetic operations.',
      parameters: {
        type: 'object',
        properties: {
          operation: { type: 'string', enum: ['add', 'subtract', 'multiply', 'divide'] },
          a: { type: 'number' },
          b: { type: 'number' },
        },
        required: ['operation', 'a', 'b'],
      },
    },
    execute: (args: Record<string, any>) => {
      const a = Number(args.a);
      const b = Number(args.b);
      switch (args.operation) {
        case 'add':
          return `Result: ${a + b}`;
        case 'subtract':
          return `Result: ${a - b}`;
        case 'multiply':
          return `Result: ${a * b}`;
        case 'divide':
          return b !== 0 ? `Result: ${a / b}` : 'Error: Division by zero';
        default:
          return 'Error: Unknown operation';
      }
    },
  },
];

// --- Tool Calling Parsers & Stop Regexes ---

export const GEMMA_TOOL_STOP_REGEX = /(?:<tool_call\|>|<turn\|>)/;

export function parseGemmaToolCalls(text: string): llm.ToolParserResult | undefined {
  const callRegex = /<\|tool_call>call:([a-zA-Z0-9_-]+)\{([\s\S]*?)\}(?:<tool_call\|>)?/g;

  const toolCalls: llm.ToolCall[] = [];
  for (const match of text.matchAll(callRegex)) {
    const name = match[1]!;
    const rawArgs = match[2]?.trim() ?? '';
    let args: Record<string, unknown> = {};

    if (rawArgs) {
      try {
        const normalized = rawArgs.replace(/<\|"\|>/g, '"').replace(/([a-zA-Z0-9_-]+):/g, '"$1":');
        args = JSON.parse(`{${normalized}}`);
      } catch {
        args = {};
      }
    }

    toolCalls.push({ type: 'function', function: { name, arguments: args } });
  }

  if (toolCalls.length === 0) return undefined;
  const textContent = text
    .replace(callRegex, '')
    .replace(/<\|channel>thought[\s\S]*?<channel\|>/g, '')
    .replace(/<\|?tool_call\|?>/g, '')
    .replace(/<turn\|>/g, '')
    .trim();

  return { toolCalls, textContent: textContent || undefined };
}

export const HAMMER_TOOL_STOP_REGEX = /(?:<\|im_end\|>)/;

export function parseHammerToolCalls(text: string): llm.ToolParserResult | undefined {
  const jsonMatch =
    text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ??
    text.match(/\[\s*\{[\s\S]*\}\s*\]/) ??
    text.match(/\[\s*\]/);
  const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : text.trim();

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length === 0) {
      const textContent = text.replace(jsonMatch ? jsonMatch[0] : jsonStr, '').trim();
      return { toolCalls: [], textContent: textContent || undefined };
    }
    if (!Array.isArray(parsed) || parsed.length === 0) return undefined;

    const toolCalls: llm.ToolCall[] = [];
    for (const item of parsed) {
      if (item && typeof item === 'object' && typeof item.name === 'string') {
        toolCalls.push({
          type: 'function',
          function: {
            name: item.name,
            arguments: item.arguments && typeof item.arguments === 'object' ? item.arguments : {},
          },
        });
      }
    }

    if (toolCalls.length === 0) return undefined;
    const textContent = text.replace(jsonMatch ? jsonMatch[0] : jsonStr, '').trim();
    return { toolCalls, textContent: textContent || undefined };
  } catch {
    return undefined;
  }
}

type LfmLiteral = { type: string; value: unknown };

function parseLfmArgument(node: LfmLiteral): unknown {
  switch (node.type) {
    case 'StringLiteral':
    case 'IntegerLiteral':
    case 'FloatLiteral':
      return node.value;
    case 'ArrayLiteral':
      return (node.value as LfmLiteral[]).map(parseLfmArgument);
    case 'ObjectLiteral':
      return Object.fromEntries(
        [...(node.value as Map<LfmLiteral, LfmLiteral>)].map(([key, value]) => {
          const name = parseLfmArgument(key);
          if (typeof name !== 'string') throw new Error('Expected a string key');
          return [name, parseLfmArgument(value)];
        })
      );
    case 'Identifier': {
      const literals: Record<string, unknown> = {
        True: true,
        False: false,
        None: null,
        true: true,
        false: false,
        none: null,
        null: null,
      };
      if (Object.prototype.hasOwnProperty.call(literals, String(node.value))) {
        return literals[String(node.value)];
      }
    }
  }
  throw new Error('Expected a literal tool argument');
}

export function parseLfmToolCalls(text: string): llm.ToolParserResult | undefined {
  // The generation prompt already opens <think>; only parse the final answer.
  const thinkingEnd = text.lastIndexOf('</think>');
  if (thinkingEnd === -1) return undefined;
  const answer = text.slice(thinkingEnd + '</think>'.length);
  const callRegex = /<\|tool_call_start\|>([\s\S]*?)<\|tool_call_end\|>/g;
  const toolCalls: llm.ToolCall[] = [];

  for (const match of answer.matchAll(callRegex)) {
    try {
      // Parse Python-style calls without evaluating generated expressions.
      const program = parse(tokenize(`{{ ${match[1]} }}`));
      const list = program.body[0] as LfmLiteral;
      if (program.body.length !== 1 || list.type !== 'ArrayLiteral') return undefined;
      const calls = list.value as {
        type: string;
        callee: { type: string; value: string };
        args: { type: string; key: { value: string }; value: LfmLiteral }[];
      }[];
      for (const call of calls) {
        if (call.type !== 'CallExpression' || call.callee.type !== 'Identifier') return undefined;
        const args = Object.fromEntries(
          call.args.map((arg) => {
            if (arg.type !== 'KeywordArgumentExpression')
              throw new Error('Expected named arguments');
            return [arg.key.value, parseLfmArgument(arg.value)];
          })
        );
        toolCalls.push({
          type: 'function',
          function: { name: call.callee.value, arguments: args },
        });
      }
    } catch {
      return undefined;
    }
  }

  if (toolCalls.length === 0) return undefined;
  const textContent = answer
    .replace(callRegex, '')
    .replace(/<\|im_end\|>/g, '')
    .trim();
  return { toolCalls, textContent: textContent || undefined };
}

export const QWEN_TOOL_STOP_REGEX = /(?:<\/tool_call>|<\|im_end\|>)/;

export function parseQwenToolCalls(text: string): llm.ToolParserResult | undefined {
  const callRegex = /<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/g;
  const toolCalls: llm.ToolCall[] = [];
  let match;

  while ((match = callRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]!);
      if (parsed && typeof parsed.name === 'string') {
        let args = parsed.arguments ?? {};
        if (typeof args === 'string') {
          try {
            args = JSON.parse(args);
          } catch {
            args = {};
          }
        }
        toolCalls.push({
          type: 'function',
          function: {
            name: parsed.name,
            arguments: typeof args === 'object' && args !== null ? args : {},
          },
        });
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  if (toolCalls.length === 0) return undefined;
  const textContent = text
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '')
    .replace(/<\|im_end\|>/g, '')
    .trim();
  return { toolCalls, textContent: textContent || undefined };
}

export const LLAMA_TOOL_STOP_REGEX = /(?:<\|eot_id\|>|<\|eom_id\|>)/;

export function parseLlamaToolCalls(text: string): llm.ToolParserResult | undefined {
  const cleanText = text
    .replace(/<\|(?:eot_id|eom_id|start_header_id|end_header_id|python_tag)\|>[\s\S]*?$/g, '')
    .replace(/<\|python_tag\|>/g, '')
    .trim();

  const jsonMatch =
    cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ??
    cleanText.match(
      /\{[\s\S]*?"name"\s*:\s*"[^"]+"[\s\S]*?"parameters"\s*:\s*\{[\s\S]*?\}[\s\S]*?\}/
    );

  const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : cleanText;

  try {
    const parsed = JSON.parse(jsonStr);
    const item = Array.isArray(parsed) ? parsed[0] : parsed;
    if (item && typeof item.name === 'string' && item.parameters) {
      let args = item.parameters ?? {};
      if (typeof args === 'string') {
        try {
          args = JSON.parse(args);
        } catch {
          args = {};
        }
      }
      const toolCalls: llm.ToolCall[] = [
        {
          type: 'function',
          function: {
            name: item.name,
            arguments: typeof args === 'object' && args !== null ? args : {},
          },
        },
      ];
      const textContent = cleanText
        .replace(jsonMatch ? jsonMatch[0] : jsonStr, '')
        .replace(/<\|(?:eot_id|eom_id|python_tag)\|>/g, '')
        .trim();
      return { toolCalls, textContent: textContent || undefined };
    }
  } catch {
    return undefined;
  }
  return undefined;
}

// --- Model Family Generation Configurations ---

/** Sampling defaults recommended by the MiniCPM5-2B model card. */
export const MINICPM5_GENERATION_CONFIG: llm.LLMGenerationConfig = {
  temperature: 1.0,
  topP: 0.95,
  minP: 0.0,
  maxNewTokens: 512,
};

/**
 * Liquid AI LFM 2.5 recommended generation parameters.
 * Sampling parameters are specified in the official Liquid AI GGUF model cards
 * (under the llama-cli Quickstart: `--temp 0.1 --top-k 50 --repeat-penalty 1.05`).
 * @see https://huggingface.co/LiquidAI/LFM2.5-1.2B-Instruct-GGUF
 * @see https://huggingface.co/LiquidAI/LFM2.5-350M-GGUF
 */
export const LFM2_5_GENERATION_CONFIG: llm.LLMGenerationConfig = {
  temperature: 0.1,
  topP: 0.1,
  topK: 50,
  repetitionPenalty: 1.05,
  maxNewTokens: 512,
};

/**
 * LFM2.5 2.6B sampling defaults from the upstream generation_config.json.
 * @see https://huggingface.co/LiquidAI/LFM2.5-2.6B/raw/main/generation_config.json
 */
export const LFM2_5_2_6B_GENERATION_CONFIG: llm.LLMGenerationConfig = {
  temperature: 0.1,
  topP: 1,
  topK: 50,
  repetitionPenalty: 1.1,
  maxNewTokens: 512,
};

/**
 * Google Gemma 4 E2B generation configuration.
 * Published directly in the upstream `generation_config.json`.
 * @see https://huggingface.co/google/gemma-4-e2b
 * @see https://huggingface.co/google/gemma-4-e2b/raw/main/generation_config.json
 */
export const GEMMA4_GENERATION_CONFIG: llm.LLMGenerationConfig = {
  temperature: 1.0,
  topP: 0.95,
  topK: 64,
  maxNewTokens: 512,
};

/**
 * MadeAgents Hammer 2.1 tool-calling model generation configuration.
 * Published in upstream `generation_config.json`.
 * @see https://huggingface.co/MadeAgents/Hammer2.1-0.5b
 * @see https://huggingface.co/MadeAgents/Hammer2.1-0.5b/raw/main/generation_config.json
 * @see https://huggingface.co/MadeAgents/Hammer2.1-3b/raw/main/generation_config.json
 */
export const HAMMER2_1_GENERATION_CONFIG: llm.LLMGenerationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 20,
  repetitionPenalty: 1.05,
  maxNewTokens: 512,
};

/**
 * Meta Llama 3.2 1B & 3B generation configuration.
 * Published in `generation_config.json` (mirrored from gated meta-llama upstream).
 * @see https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct
 * @see https://huggingface.co/unsloth/Llama-3.2-1B-Instruct/raw/main/generation_config.json
 * @see https://huggingface.co/unsloth/Llama-3.2-3B-Instruct/raw/main/generation_config.json
 */
export const LLAMA3_2_GENERATION_CONFIG: llm.LLMGenerationConfig = {
  temperature: 0.6,
  topP: 0.9,
  maxNewTokens: 512,
};

/**
 * Hugging Face SmolLM2 135M, 360M & 1.7B generation configuration.
 * Documented in the official Hugging Face model cards generation snippet
 * (`model.generate(..., temperature=0.2, top_p=0.9, do_sample=True)`).
 * @see https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct
 * @see https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct
 * @see https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct
 */
export const SMOLLM2_GENERATION_CONFIG: llm.LLMGenerationConfig = {
  temperature: 0.2,
  topP: 0.9,
  maxNewTokens: 512,
};

/**
 * Alibaba Qwen 2.5 0.5B & 1.5B generation configuration.
 * Published in upstream `generation_config.json`.
 * @see https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct/raw/main/generation_config.json
 * @see https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct/raw/main/generation_config.json
 */
export const QWEN2_5_0_5B_1_5B_GENERATION_CONFIG: llm.LLMGenerationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 20,
  repetitionPenalty: 1.1,
  maxNewTokens: 512,
};

/**
 * Alibaba Qwen 2.5 3B generation configuration.
 * Published in upstream `generation_config.json`.
 * @see https://huggingface.co/Qwen/Qwen2.5-3B-Instruct
 * @see https://huggingface.co/Qwen/Qwen2.5-3B-Instruct/raw/main/generation_config.json
 */
export const QWEN2_5_3B_GENERATION_CONFIG: llm.LLMGenerationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 20,
  repetitionPenalty: 1.05,
  maxNewTokens: 512,
};

/**
 * Alibaba Qwen 3 (0.6B, 1.7B, 4B) generation configuration.
 * Published in upstream `generation_config.json`.
 * @see https://huggingface.co/Qwen/Qwen3-0.6B/raw/main/generation_config.json
 * @see https://huggingface.co/Qwen/Qwen3-1.7B/raw/main/generation_config.json
 * @see https://huggingface.co/Qwen/Qwen3-4B/raw/main/generation_config.json
 */
export const QWEN3_GENERATION_CONFIG: llm.LLMGenerationConfig = {
  temperature: 0.6,
  topP: 0.95,
  topK: 20,
  maxNewTokens: 512,
};

/**
 * Microsoft Phi-4 Mini 3.8B generation configuration.
 * Microsoft specifies greedy generation (`temperature: 0.0, do_sample: False`)
 * in the official model card Python and vLLM inference snippets.
 * @see https://huggingface.co/microsoft/Phi-4-mini-instruct
 * @see https://huggingface.co/microsoft/Phi-4-mini-instruct/raw/main/README.md
 */
export const PHI4_MINI_GENERATION_CONFIG: llm.LLMGenerationConfig = {
  temperature: 0.0,
  maxNewTokens: 512,
};

/**
 * SpeakLeash Bielik v3 1.5B generation configuration.
 * Bielik 1.5B is fine-tuned from Qwen2.5-1.5B; SpeakLeash recommends a lower temperature
 * (0.1–0.2 with top_p 0.95) to prevent hallucinations and maintain coherence in Polish.
 * @see https://huggingface.co/speakleash/Bielik-1.5B-v3.0-Instruct
 * @see https://huggingface.co/speakleash/Bielik-1.5B-v3.0-Instruct-GGUF
 */
export const BIELIK_V3_GENERATION_CONFIG: llm.LLMGenerationConfig = {
  temperature: 0.2,
  topP: 0.95,
  maxNewTokens: 512,
  repetitionPenalty: 1.1,
};

export const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant. Your name is HAL-9000';

export const LFM_TOOL_OPTS: LLMToolOpts = {
  tools: TOOLS,
  parseToolCalls: parseLfmToolCalls,
};

export const GEMMA_TOOL_OPTS: LLMToolOpts = {
  tools: TOOLS,
  parseToolCalls: parseGemmaToolCalls,
};

export const HAMMER_TOOL_OPTS: LLMToolOpts = {
  tools: TOOLS,
  parseToolCalls: parseHammerToolCalls,
};

export const QWEN_TOOL_OPTS: LLMToolOpts = {
  tools: TOOLS,
  parseToolCalls: parseQwenToolCalls,
};

export const LLAMA_TOOL_OPTS: LLMToolOpts = {
  tools: TOOLS,
  parseToolCalls: parseLlamaToolCalls,
};

// --- Model Config Type ---

export type LLMBackend = 'xnnpack' | 'mlx' | 'vulkan';

export interface LLMModelConfig {
  id: string;
  name: string;
  backend: LLMBackend;
  model: LLMModel;
  generationConfig: llm.LLMGenerationConfig;
  systemPrompt?: string;
  stopRegex?: RegExp;
  toolOpts: LLMToolOpts | undefined;
  iosOnly?: boolean;
}

// --- Quantized LLM Models List ---

export const LLM_MODELS: LLMModelConfig[] = [
  // MiniCPM5
  {
    id: 'minicpm-5-2b-xnnpack',
    name: 'MiniCPM5 2B',
    backend: 'xnnpack',
    model: models.llm.MINICPM5_2B.XNNPACK_8DA4W,
    generationConfig: MINICPM5_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    toolOpts: undefined,
  },
  {
    id: 'minicpm-5-2b-mlx',
    name: 'MiniCPM5 2B',
    backend: 'mlx',
    model: models.llm.MINICPM5_2B.MLX_INT4,
    generationConfig: MINICPM5_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    toolOpts: undefined,
    iosOnly: true,
  },

  // LFM 2.5 family
  {
    id: 'lfm-2.5-2.6b-xnnpack',
    name: 'LFM 2.5 2.6B',
    backend: 'xnnpack',
    model: models.llm.LFM2_5_2_6B.XNNPACK_8DA4W,
    generationConfig: LFM2_5_2_6B_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: LFM_TOOL_OPTS,
  },
  {
    id: 'lfm-2.5-2.6b-mlx',
    name: 'LFM 2.5 2.6B',
    backend: 'mlx',
    model: models.llm.LFM2_5_2_6B.MLX_INT4,
    generationConfig: LFM2_5_2_6B_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: LFM_TOOL_OPTS,
    iosOnly: true,
  },
  {
    id: 'lfm-2.5-1.2b-xnnpack',
    name: 'LFM 2.5 1.2B',
    backend: 'xnnpack',
    model: models.llm.LFM2_5_1_2B.XNNPACK_8DA4W,
    generationConfig: LFM2_5_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },
  {
    id: 'lfm-2.5-1.2b-mlx',
    name: 'LFM 2.5 1.2B',
    backend: 'mlx',
    model: models.llm.LFM2_5_1_2B.MLX_INT4,
    generationConfig: LFM2_5_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
    iosOnly: true,
  },
  {
    id: 'lfm-2.5-350m-xnnpack',
    name: 'LFM 2.5 350M',
    backend: 'xnnpack',
    model: models.llm.LFM2_5_350M.XNNPACK_8DA4W,
    generationConfig: LFM2_5_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },
  {
    id: 'lfm-2.5-350m-mlx',
    name: 'LFM 2.5 350M',
    backend: 'mlx',
    model: models.llm.LFM2_5_350M.MLX_INT4,
    generationConfig: LFM2_5_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
    iosOnly: true,
  },
  {
    id: 'lfm-2.5-vl-450m-xnnpack',
    name: 'LFM 2.5 VL 450M',
    backend: 'xnnpack',
    model: models.llm.LFM2_5_VL_450M.XNNPACK_8DA4W,
    generationConfig: LFM2_5_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },
  {
    id: 'lfm-2.5-vl-450m-mlx',
    name: 'LFM 2.5 VL 450M',
    backend: 'mlx',
    model: models.llm.LFM2_5_VL_450M.MLX_INT4,
    generationConfig: LFM2_5_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
    iosOnly: true,
  },
  {
    id: 'lfm-2.5-vl-1.6b-xnnpack',
    name: 'LFM 2.5 VL 1.6B',
    backend: 'xnnpack',
    model: models.llm.LFM2_5_VL_1_6B.XNNPACK_8DA4W,
    generationConfig: LFM2_5_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },
  {
    id: 'lfm-2.5-vl-1.6b-mlx',
    name: 'LFM 2.5 VL 1.6B',
    backend: 'mlx',
    model: models.llm.LFM2_5_VL_1_6B.MLX_INT4,
    generationConfig: LFM2_5_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
    iosOnly: true,
  },
  {
    id: 'lfm-2.5-vl-1.6b-mlx-int8',
    name: 'LFM 2.5 VL 1.6B (int8)',
    backend: 'mlx',
    model: models.llm.LFM2_5_VL_1_6B.MLX_INT8,
    generationConfig: LFM2_5_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
    iosOnly: true,
  },
  {
    id: 'lfm-2.5-vl-450m-vulkan',
    name: 'LFM 2.5 VL 450M',
    backend: 'vulkan',
    model: models.llm.LFM2_5_VL_450M.VULKAN_8DA4W,
    generationConfig: LFM2_5_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },
  {
    id: 'lfm-2.5-vl-1.6b-vulkan',
    name: 'LFM 2.5 VL 1.6B',
    backend: 'vulkan',
    model: models.llm.LFM2_5_VL_1_6B.VULKAN_8DA4W,
    generationConfig: LFM2_5_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },

  // Gemma 4 family
  {
    id: 'gemma-4-omni-e2b-xnnpack',
    name: 'Gemma 4 Omni E2B',
    backend: 'xnnpack',
    model: models.llm.GEMMA4_OMNI_E2B.XNNPACK_8DA4W,
    generationConfig: GEMMA4_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: GEMMA_TOOL_STOP_REGEX,
    toolOpts: GEMMA_TOOL_OPTS,
  },
  {
    id: 'gemma-4-omni-e2b-vulkan',
    name: 'Gemma 4 Omni E2B',
    backend: 'vulkan',
    model: models.llm.GEMMA4_OMNI_E2B.VULKAN_8DA4W,
    generationConfig: GEMMA4_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: GEMMA_TOOL_STOP_REGEX,
    toolOpts: GEMMA_TOOL_OPTS,
  },
  {
    id: 'gemma-4-omni-e2b-mlx',
    name: 'Gemma 4 Omni E2B',
    backend: 'mlx',
    model: models.llm.GEMMA4_OMNI_E2B.MLX_INT4,
    generationConfig: GEMMA4_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: GEMMA_TOOL_STOP_REGEX,
    toolOpts: GEMMA_TOOL_OPTS,
    iosOnly: true,
  },
  {
    id: 'gemma-4-e2b-xnnpack',
    name: 'Gemma 4 E2B',
    backend: 'xnnpack',
    model: models.llm.GEMMA4_E2B.XNNPACK_8DA4W,
    generationConfig: GEMMA4_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: GEMMA_TOOL_STOP_REGEX,
    toolOpts: GEMMA_TOOL_OPTS,
  },
  {
    id: 'gemma-4-e2b-mlx',
    name: 'Gemma 4 E2B',
    backend: 'mlx',
    model: models.llm.GEMMA4_E2B.MLX_INT4,
    generationConfig: GEMMA4_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: GEMMA_TOOL_STOP_REGEX,
    toolOpts: GEMMA_TOOL_OPTS,
    iosOnly: true,
  },
  {
    id: 'gemma-4-e2b-vulkan',
    name: 'Gemma 4 E2B',
    backend: 'vulkan',
    model: models.llm.GEMMA4_E2B.VULKAN_8DA4W,
    generationConfig: GEMMA4_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: GEMMA_TOOL_STOP_REGEX,
    toolOpts: GEMMA_TOOL_OPTS,
  },

  // Hammer 2.1 family
  {
    id: 'hammer-2.1-0.5b-xnnpack',
    name: 'Hammer 2.1 0.5B',
    backend: 'xnnpack',
    model: models.llm.HAMMER2_1_0_5B.XNNPACK_8DA4W,
    generationConfig: HAMMER2_1_GENERATION_CONFIG,
    systemPrompt: undefined,
    stopRegex: HAMMER_TOOL_STOP_REGEX,
    toolOpts: HAMMER_TOOL_OPTS,
  },
  {
    id: 'hammer-2.1-0.5b-mlx',
    name: 'Hammer 2.1 0.5B',
    backend: 'mlx',
    model: models.llm.HAMMER2_1_0_5B.MLX_INT4,
    generationConfig: HAMMER2_1_GENERATION_CONFIG,
    systemPrompt: undefined,
    stopRegex: HAMMER_TOOL_STOP_REGEX,
    toolOpts: HAMMER_TOOL_OPTS,
    iosOnly: true,
  },
  {
    id: 'hammer-2.1-1.5b-xnnpack',
    name: 'Hammer 2.1 1.5B',
    backend: 'xnnpack',
    model: models.llm.HAMMER2_1_1_5B.XNNPACK_8DA4W,
    generationConfig: HAMMER2_1_GENERATION_CONFIG,
    systemPrompt: undefined,
    stopRegex: HAMMER_TOOL_STOP_REGEX,
    toolOpts: HAMMER_TOOL_OPTS,
  },
  {
    id: 'hammer-2.1-1.5b-mlx',
    name: 'Hammer 2.1 1.5B',
    backend: 'mlx',
    model: models.llm.HAMMER2_1_1_5B.MLX_INT4,
    generationConfig: HAMMER2_1_GENERATION_CONFIG,
    systemPrompt: undefined,
    stopRegex: HAMMER_TOOL_STOP_REGEX,
    toolOpts: HAMMER_TOOL_OPTS,
    iosOnly: true,
  },
  {
    id: 'hammer-2.1-3b-xnnpack',
    name: 'Hammer 2.1 3B',
    backend: 'xnnpack',
    model: models.llm.HAMMER2_1_3B.XNNPACK_8DA4W,
    generationConfig: HAMMER2_1_GENERATION_CONFIG,
    systemPrompt: undefined,
    stopRegex: HAMMER_TOOL_STOP_REGEX,
    toolOpts: HAMMER_TOOL_OPTS,
  },
  {
    id: 'hammer-2.1-3b-mlx',
    name: 'Hammer 2.1 3B',
    backend: 'mlx',
    model: models.llm.HAMMER2_1_3B.MLX_INT4,
    generationConfig: HAMMER2_1_GENERATION_CONFIG,
    systemPrompt: undefined,
    stopRegex: HAMMER_TOOL_STOP_REGEX,
    toolOpts: HAMMER_TOOL_OPTS,
    iosOnly: true,
  },

  // Llama 3.2 family
  {
    id: 'llama-3.2-1b-spinquant',
    name: 'Llama 3.2 1B',
    backend: 'xnnpack',
    model: models.llm.LLAMA3_2_1B.XNNPACK_SPINQUANT,
    generationConfig: LLAMA3_2_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: LLAMA_TOOL_STOP_REGEX,
    toolOpts: LLAMA_TOOL_OPTS,
  },
  {
    id: 'llama-3.2-1b-mlx',
    name: 'Llama 3.2 1B',
    backend: 'mlx',
    model: models.llm.LLAMA3_2_1B.MLX_INT4,
    generationConfig: LLAMA3_2_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: LLAMA_TOOL_STOP_REGEX,
    toolOpts: LLAMA_TOOL_OPTS,
    iosOnly: true,
  },
  {
    id: 'llama-3.2-3b-spinquant',
    name: 'Llama 3.2 3B',
    backend: 'xnnpack',
    model: models.llm.LLAMA3_2_3B.XNNPACK_SPINQUANT,
    generationConfig: LLAMA3_2_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: LLAMA_TOOL_STOP_REGEX,
    toolOpts: LLAMA_TOOL_OPTS,
  },
  {
    id: 'llama-3.2-3b-mlx',
    name: 'Llama 3.2 3B',
    backend: 'mlx',
    model: models.llm.LLAMA3_2_3B.MLX_INT4,
    generationConfig: LLAMA3_2_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: LLAMA_TOOL_STOP_REGEX,
    toolOpts: LLAMA_TOOL_OPTS,
    iosOnly: true,
  },

  // SmolLM2 family
  {
    id: 'smollm2-135m-xnnpack',
    name: 'SmolLM2 135M',
    backend: 'xnnpack',
    model: models.llm.SMOLLM2_135M.XNNPACK_8DA8W,
    generationConfig: SMOLLM2_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },
  {
    id: 'smollm2-135m-mlx',
    name: 'SmolLM2 135M',
    backend: 'mlx',
    model: models.llm.SMOLLM2_135M.MLX_INT8,
    generationConfig: SMOLLM2_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
    iosOnly: true,
  },
  {
    id: 'smollm2-360m-xnnpack',
    name: 'SmolLM2 360M',
    backend: 'xnnpack',
    model: models.llm.SMOLLM2_360M.XNNPACK_8DA8W,
    generationConfig: SMOLLM2_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },
  {
    id: 'smollm2-360m-mlx',
    name: 'SmolLM2 360M',
    backend: 'mlx',
    model: models.llm.SMOLLM2_360M.MLX_INT8,
    generationConfig: SMOLLM2_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
    iosOnly: true,
  },
  {
    id: 'smollm2-1.7b-xnnpack',
    name: 'SmolLM2 1.7B',
    backend: 'xnnpack',
    model: models.llm.SMOLLM2_1_7B.XNNPACK_8DA8W,
    generationConfig: SMOLLM2_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },
  {
    id: 'smollm2-1.7b-mlx',
    name: 'SmolLM2 1.7B',
    backend: 'mlx',
    model: models.llm.SMOLLM2_1_7B.MLX_INT8,
    generationConfig: SMOLLM2_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
    iosOnly: true,
  },

  // Qwen 2.5 family
  {
    id: 'qwen-2.5-0.5b-xnnpack',
    name: 'Qwen 2.5 0.5B',
    backend: 'xnnpack',
    model: models.llm.QWEN2_5_0_5B.XNNPACK_8DA4W,
    generationConfig: QWEN2_5_0_5B_1_5B_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
  },
  {
    id: 'qwen-2.5-0.5b-mlx',
    name: 'Qwen 2.5 0.5B',
    backend: 'mlx',
    model: models.llm.QWEN2_5_0_5B.MLX_INT4,
    generationConfig: QWEN2_5_0_5B_1_5B_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
    iosOnly: true,
  },
  {
    id: 'qwen-2.5-1.5b-xnnpack',
    name: 'Qwen 2.5 1.5B',
    backend: 'xnnpack',
    model: models.llm.QWEN2_5_1_5B.XNNPACK_8DA4W,
    generationConfig: QWEN2_5_0_5B_1_5B_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
  },
  {
    id: 'qwen-2.5-1.5b-mlx',
    name: 'Qwen 2.5 1.5B',
    backend: 'mlx',
    model: models.llm.QWEN2_5_1_5B.MLX_INT4,
    generationConfig: QWEN2_5_0_5B_1_5B_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
    iosOnly: true,
  },
  {
    id: 'qwen-2.5-3b-xnnpack',
    name: 'Qwen 2.5 3B',
    backend: 'xnnpack',
    model: models.llm.QWEN2_5_3B.XNNPACK_8DA4W,
    generationConfig: QWEN2_5_3B_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
  },
  {
    id: 'qwen-2.5-3b-mlx',
    name: 'Qwen 2.5 3B',
    backend: 'mlx',
    model: models.llm.QWEN2_5_3B.MLX_INT4,
    generationConfig: QWEN2_5_3B_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
    iosOnly: true,
  },

  // Qwen 3 family
  {
    id: 'qwen-3-0.6b-xnnpack',
    name: 'Qwen 3 0.6B',
    backend: 'xnnpack',
    model: models.llm.QWEN3_0_6B.XNNPACK_8DA4W,
    generationConfig: QWEN3_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
  },
  {
    id: 'qwen-3-0.6b-mlx',
    name: 'Qwen 3 0.6B',
    backend: 'mlx',
    model: models.llm.QWEN3_0_6B.MLX_INT8,
    generationConfig: QWEN3_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
    iosOnly: true,
  },
  {
    id: 'qwen-3-1.7b-xnnpack',
    name: 'Qwen 3 1.7B',
    backend: 'xnnpack',
    model: models.llm.QWEN3_1_7B.XNNPACK_8DA4W,
    generationConfig: QWEN3_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
  },
  {
    id: 'qwen-3-1.7b-mlx',
    name: 'Qwen 3 1.7B',
    backend: 'mlx',
    model: models.llm.QWEN3_1_7B.MLX_INT4,
    generationConfig: QWEN3_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
    iosOnly: true,
  },
  {
    id: 'qwen-3-4b-xnnpack',
    name: 'Qwen 3 4B',
    backend: 'xnnpack',
    model: models.llm.QWEN3_4B.XNNPACK_8DA4W,
    generationConfig: QWEN3_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
  },
  {
    id: 'qwen-3-4b-mlx',
    name: 'Qwen 3 4B',
    backend: 'mlx',
    model: models.llm.QWEN3_4B.MLX_INT4,
    generationConfig: QWEN3_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
    iosOnly: true,
  },

  // Phi-4 Mini
  {
    id: 'phi-4-mini-xnnpack',
    name: 'Phi-4 Mini 3.8B',
    backend: 'xnnpack',
    model: models.llm.PHI4_MINI.XNNPACK_8DA4W,
    generationConfig: PHI4_MINI_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },
  {
    id: 'phi-4-mini-mlx',
    name: 'Phi-4 Mini 3.8B',
    backend: 'mlx',
    model: models.llm.PHI4_MINI.MLX_INT4,
    generationConfig: PHI4_MINI_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
    iosOnly: true,
  },

  // Bielik v3
  {
    id: 'bielik-v3-1.5b-xnnpack',
    name: 'Bielik v3 1.5B',
    backend: 'xnnpack',
    model: models.llm.BIELIK_V3_1_5B.XNNPACK_8DA4W,
    generationConfig: BIELIK_V3_GENERATION_CONFIG,
    // eslint-disable-next-line @cspell/spellchecker
    systemPrompt: 'Jesteś pomocnym asystentem AI mówiącym po polsku.',
    stopRegex: undefined,
    toolOpts: undefined,
  },
];
