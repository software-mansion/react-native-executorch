import {
  LFM2_VL_1_6B_QUANTIZED,
  LFM2_VL_450M_QUANTIZED,
  QWEN3_5_VL_0_8B_QUANTIZED,
  QWEN3_5_VL_2B_QUANTIZED,
} from 'react-native-executorch';
import { ModelOption } from './ModelPicker';

export type VLMModelSources =
  | typeof QWEN3_5_VL_0_8B_QUANTIZED
  | typeof QWEN3_5_VL_2B_QUANTIZED
  | typeof LFM2_VL_450M_QUANTIZED
  | typeof LFM2_VL_1_6B_QUANTIZED;

export const VLM_MODELS: ModelOption<VLMModelSources>[] = [
  { label: 'LFM2 VL 450M Quantized', value: LFM2_VL_450M_QUANTIZED },
  { label: 'LFM2 VL 1.6B Quantized', value: LFM2_VL_1_6B_QUANTIZED },
  { label: 'Qwen 3.5 VL 0.8B Quantized', value: QWEN3_5_VL_0_8B_QUANTIZED },
  { label: 'Qwen 3.5 VL 2B Quantized', value: QWEN3_5_VL_2B_QUANTIZED },
];
