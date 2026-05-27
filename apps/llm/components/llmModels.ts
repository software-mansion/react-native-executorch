import {
  models,
  LLAMA3_2_1B_QLORA,
  LLAMA3_2_3B_QLORA,
  LLMProps,
} from 'react-native-executorch';
import { ModelOption } from './ModelPicker';
const llm = models.llm;

export type LLMModelSources = LLMProps['model'];

export const LLM_MODELS: ModelOption<LLMModelSources>[] = [
  // Llama 3.2
  {
    label: 'Llama 3.2 1B',
    value: llm.llama3_2_1b({ quant: false }),
  },
  { label: 'Llama 3.2 1B QLoRA', value: LLAMA3_2_1B_QLORA },
  { label: 'Llama 3.2 1B SpinQuant', value: llm.llama3_2_1b() },
  {
    label: 'Llama 3.2 3B',
    value: llm.llama3_2_3b({ quant: false }),
  },
  { label: 'Llama 3.2 3B QLoRA', value: LLAMA3_2_3B_QLORA },
  { label: 'Llama 3.2 3B SpinQuant', value: llm.llama3_2_3b() },
  // Qwen3
  {
    label: 'Qwen3 0.6B',
    value: llm.qwen3_0_6b({ quant: false }),
  },
  { label: 'Qwen3 0.6B Quantized', value: llm.qwen3_0_6b() },
  {
    label: 'Qwen3 1.7B',
    value: llm.qwen3_1_7b({ quant: false }),
  },
  { label: 'Qwen3 1.7B Quantized', value: llm.qwen3_1_7b() },
  { label: 'Qwen3 4B', value: llm.qwen3_4b({ quant: false }) },
  { label: 'Qwen3 4B Quantized', value: llm.qwen3_4b() },
  // Hammer 2.1
  {
    label: 'Hammer 2.1 0.5B',
    value: llm.hammer2_1_0_5b({ quant: false }),
  },
  {
    label: 'Hammer 2.1 0.5B Quantized',
    value: llm.hammer2_1_0_5b(),
  },
  {
    label: 'Hammer 2.1 1.5B',
    value: llm.hammer2_1_1_5b({ quant: false }),
  },
  {
    label: 'Hammer 2.1 1.5B Quantized',
    value: llm.hammer2_1_1_5b(),
  },
  {
    label: 'Hammer 2.1 3B',
    value: llm.hammer2_1_3b({ quant: false }),
  },
  {
    label: 'Hammer 2.1 3B Quantized',
    value: llm.hammer2_1_3b(),
  },
  // SmolLM2
  {
    label: 'SmolLM2 135M',
    value: llm.smollm2_1_135m({ quant: false }),
  },
  {
    label: 'SmolLM2 135M Quantized',
    value: llm.smollm2_1_135m(),
  },
  {
    label: 'SmolLM2 360M',
    value: llm.smollm2_1_360m({ quant: false }),
  },
  {
    label: 'SmolLM2 360M Quantized',
    value: llm.smollm2_1_360m(),
  },
  {
    label: 'SmolLM2 1.7B',
    value: llm.smollm2_1_1_7b({ quant: false }),
  },
  {
    label: 'SmolLM2 1.7B Quantized',
    value: llm.smollm2_1_1_7b(),
  },
  // Qwen2.5
  {
    label: 'Qwen2.5 0.5B',
    value: llm.qwen2_5_0_5b({ quant: false }),
  },
  {
    label: 'Qwen2.5 0.5B Quantized',
    value: llm.qwen2_5_0_5b(),
  },
  {
    label: 'Qwen2.5 1.5B',
    value: llm.qwen2_5_1_5b({ quant: false }),
  },
  {
    label: 'Qwen2.5 1.5B Quantized',
    value: llm.qwen2_5_1_5b(),
  },
  {
    label: 'Qwen2.5 3B',
    value: llm.qwen2_5_3b({ quant: false }),
  },
  { label: 'Qwen2.5 3B Quantized', value: llm.qwen2_5_3b() },
  // Qwen3.5
  { label: 'Qwen3.5 0.8B Quantized', value: llm.qwen3_5_0_8b() },
  { label: 'Qwen3.5 2B Quantized', value: llm.qwen3_5_2b() },
  // Phi-4
  {
    label: 'Phi-4 Mini 4B',
    value: llm.phi_4_mini_4b({ quant: false }),
  },
  {
    label: 'Phi-4 Mini 4B Quantized',
    value: llm.phi_4_mini_4b(),
  },
  // LFM2.5
  {
    label: 'LFM2.5 350M',
    value: llm.lfm2_5_350m({ quant: false }),
  },
  { label: 'LFM2.5 350M Quantized', value: llm.lfm2_5_350m() },
  {
    label: 'LFM2.5 1.2B Instruct',
    value: llm.lfm2_5_1_2b_instruct({ quant: false }),
  },
  {
    label: 'LFM2.5 1.2B Instruct Quantized',
    value: llm.lfm2_5_1_2b_instruct(),
  },
  // Bielik v3.0
  {
    label: 'Bielik v3.0 1.5B',
    value: llm.bielik_v3_0_1_5b({ quant: false }),
  },
  {
    label: 'Bielik v3.0 1.5B Quantized',
    value: llm.bielik_v3_0_1_5b(),
  },
];
