import {
  models,
  type LLMModel,
  type LLMToolOpts,
  type LLMGenerationConfig,
  type ToolDefinition,
  type ToolParserResult,
  type ToolCall,
} from 'react-native-executorch';

export const TOOLS: ToolDefinition[] = [
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

export function parseGemmaToolCalls(text: string): ToolParserResult | undefined {
  const callRegex = /<\|tool_call>call:([a-zA-Z0-9_-]+)\{([\s\S]*?)\}(?:<tool_call\|>)?/g;

  const toolCalls: ToolCall[] = [];
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

export function parseHammerToolCalls(text: string): ToolParserResult | undefined {
  const jsonMatch =
    text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ?? text.match(/\[\s*\{[\s\S]*\}\s*\]/);
  const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : text.trim();

  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed) || parsed.length === 0) return undefined;

    const toolCalls: ToolCall[] = [];
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

export const QWEN_TOOL_STOP_REGEX = /(?:<\/tool_call>|<\|im_end\|>)/;

export function parseQwenToolCalls(text: string): ToolParserResult | undefined {
  const callRegex = /<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/g;
  const toolCalls: ToolCall[] = [];
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

export function parseLlamaToolCalls(text: string): ToolParserResult | undefined {
  const cleanText = text
    .replace(/<\|(?:eot_id|eom_id|start_header_id|end_header_id)\|>[\s\S]*?$/g, '')
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
      const toolCalls: ToolCall[] = [
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
        .replace(/<\|(?:eot_id|eom_id)\|>/g, '')
        .trim();
      return { toolCalls, textContent: textContent || undefined };
    }
  } catch {
    return undefined;
  }
  return undefined;
}

// --- Common Configurations ---

export const DEFAULT_GENERATION_CONFIG: LLMGenerationConfig = {
  temperature: 0.7,
  maxNewTokens: 512,
  echo: false,
};

export const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant. Your name is HAL-9000';

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

export interface LLMModelConfig {
  id: string;
  name: string;
  model: LLMModel;
  generationConfig: LLMGenerationConfig;
  systemPrompt?: string;
  stopRegex?: RegExp;
  toolOpts: LLMToolOpts | undefined;
  iosOnly?: boolean;
}

// --- Quantized LLM Models List ---

export const LLM_MODELS: LLMModelConfig[] = [
  // LFM 2.5 family
  {
    id: 'lfm-2.5-1.2b-xnnpack',
    name: 'LFM 2.5 1.2B (8da4w)',
    model: models.llm.LFM2_5_1_2B.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },
  {
    id: 'lfm-2.5-1.2b-mlx',
    name: 'LFM 2.5 1.2B (MLX Int4)',
    model: models.llm.LFM2_5_1_2B.MLX_INT4,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
    iosOnly: true,
  },
  {
    id: 'lfm-2.5-350m-xnnpack',
    name: 'LFM 2.5 350M (8da4w)',
    model: models.llm.LFM2_5_350M.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },
  {
    id: 'lfm-2.5-350m-mlx',
    name: 'LFM 2.5 350M (MLX Int4)',
    model: models.llm.LFM2_5_350M.MLX_INT4,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
    iosOnly: true,
  },
  {
    id: 'lfm-2.5-vl-450m-xnnpack',
    name: 'LFM 2.5 VL 450M (8da4w)',
    model: models.llm.LFM2_5_VL_450M.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },
  {
    id: 'lfm-2.5-vl-450m-mlx',
    name: 'LFM 2.5 VL 450M (MLX Int4)',
    model: models.llm.LFM2_5_VL_450M.MLX_INT4,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
    iosOnly: true,
  },
  {
    id: 'lfm-2.5-vl-1.6b-xnnpack',
    name: 'LFM 2.5 VL 1.6B (8da4w)',
    model: models.llm.LFM2_5_VL_1_6B.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },

  // Gemma 4 family
  {
    id: 'gemma-4-e2b-xnnpack',
    name: 'Gemma 4 E2B (8da4w)',
    model: models.llm.GEMMA4_E2B.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: GEMMA_TOOL_STOP_REGEX,
    toolOpts: GEMMA_TOOL_OPTS,
  },
  {
    id: 'gemma-4-e2b-mlx',
    name: 'Gemma 4 E2B (MLX Int4)',
    model: models.llm.GEMMA4_E2B.MLX_INT4,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: GEMMA_TOOL_STOP_REGEX,
    toolOpts: GEMMA_TOOL_OPTS,
    iosOnly: true,
  },

  // Hammer 2.1 family
  {
    id: 'hammer-2.1-0.5b-xnnpack',
    name: 'Hammer 2.1 0.5B (8da4w)',
    model: models.llm.HAMMER2_1_0_5B.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: undefined,
    stopRegex: HAMMER_TOOL_STOP_REGEX,
    toolOpts: HAMMER_TOOL_OPTS,
  },
  {
    id: 'hammer-2.1-1.5b-xnnpack',
    name: 'Hammer 2.1 1.5B (8da4w)',
    model: models.llm.HAMMER2_1_1_5B.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: undefined,
    stopRegex: HAMMER_TOOL_STOP_REGEX,
    toolOpts: HAMMER_TOOL_OPTS,
  },
  {
    id: 'hammer-2.1-3b-xnnpack',
    name: 'Hammer 2.1 3B (8da4w)',
    model: models.llm.HAMMER2_1_3B.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: undefined,
    stopRegex: HAMMER_TOOL_STOP_REGEX,
    toolOpts: HAMMER_TOOL_OPTS,
  },

  // Llama 3.2 family
  {
    id: 'llama-3.2-1b-spinquant',
    name: 'Llama 3.2 1B (SpinQuant)',
    model: models.llm.LLAMA3_2_1B.XNNPACK_SPINQUANT,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: LLAMA_TOOL_STOP_REGEX,
    toolOpts: LLAMA_TOOL_OPTS,
  },
  {
    id: 'llama-3.2-3b-spinquant',
    name: 'Llama 3.2 3B (SpinQuant)',
    model: models.llm.LLAMA3_2_3B.XNNPACK_SPINQUANT,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: LLAMA_TOOL_STOP_REGEX,
    toolOpts: LLAMA_TOOL_OPTS,
  },

  // SmolLM2 family
  {
    id: 'smollm2-135m-xnnpack',
    name: 'SmolLM2 135M (8da4w)',
    model: models.llm.SMOLLM2_135M.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },
  {
    id: 'smollm2-360m-xnnpack',
    name: 'SmolLM2 360M (8da4w)',
    model: models.llm.SMOLLM2_360M.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },
  {
    id: 'smollm2-1.7b-xnnpack',
    name: 'SmolLM2 1.7B (8da4w)',
    model: models.llm.SMOLLM2_1_7B.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },

  // Qwen 2.5 family
  {
    id: 'qwen-2.5-0.5b-xnnpack',
    name: 'Qwen 2.5 0.5B (8da4w)',
    model: models.llm.QWEN2_5_0_5B.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
  },
  {
    id: 'qwen-2.5-1.5b-xnnpack',
    name: 'Qwen 2.5 1.5B (8da4w)',
    model: models.llm.QWEN2_5_1_5B.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
  },
  {
    id: 'qwen-2.5-3b-xnnpack',
    name: 'Qwen 2.5 3B (8da4w)',
    model: models.llm.QWEN2_5_3B.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
  },

  // Qwen 3 family
  {
    id: 'qwen-3-0.6b-xnnpack',
    name: 'Qwen 3 0.6B (8da4w)',
    model: models.llm.QWEN3_0_6B.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
  },
  {
    id: 'qwen-3-1.7b-xnnpack',
    name: 'Qwen 3 1.7B (8da4w)',
    model: models.llm.QWEN3_1_7B.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
  },
  {
    id: 'qwen-3-4b-xnnpack',
    name: 'Qwen 3 4B (8da4w)',
    model: models.llm.QWEN3_4B.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: QWEN_TOOL_STOP_REGEX,
    toolOpts: QWEN_TOOL_OPTS,
  },

  // Phi-4 Mini
  {
    id: 'phi-4-mini-xnnpack',
    name: 'Phi-4 Mini 3.8B (8da4w)',
    model: models.llm.PHI4_MINI.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    stopRegex: undefined,
    toolOpts: undefined,
  },

  // Bielik v3
  {
    id: 'bielik-v3-1.5b-xnnpack',
    name: 'Bielik v3 1.5B (8da4w)',
    model: models.llm.BIELIK_V3_1_5B.XNNPACK_8DA4W,
    generationConfig: DEFAULT_GENERATION_CONFIG,
    // eslint-disable-next-line @cspell/spellchecker
    systemPrompt: 'Jesteś pomocnym asystentem AI mówiącym po polsku.',
    stopRegex: undefined,
    toolOpts: undefined,
  },
];
