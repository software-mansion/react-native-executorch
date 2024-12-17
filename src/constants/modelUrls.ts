import { Platform } from 'react-native';

// LLM's
export const LLAMA3_2_3B_URL =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.1.0/llama-3.2-3B/original/llama3_2_3B_bf16.pte';
export const LLAMA3_2_3B_QLORA_URL =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.1.0/llama-3.2-3B/QLoRA/llama3_2-3B_qat_lora.pte';
export const LLAMA3_2_3B_SPINQUANT_URL =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.1.0/llama-3.2-3B/spinquant/llama3_2_3B_spinquant.pte';
export const LLAMA3_2_1B_URL =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.1.0/llama-3.2-1B/original/llama3_2_bf16.pte';
export const LLAMA3_2_1B_QLORA_URL =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.1.0/llama-3.2-1B/QLoRA/llama3_2_qat_lora.pte';
export const LLAMA3_2_1B_SPINQUANT_URL =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.1.0/llama-3.2-1B/spinquant/llama3_2_spinquant.pte';
export const LLAMA3_2_1B_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.1.0/llama-3.2-1B/original/tokenizer.bin';
export const LLAMA3_2_3B_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.1.0/llama-3.2-3B/original/tokenizer.bin';

// Classification
export const EFFICIENTNET_V2_S =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-efficientnet-v2-s/resolve/v0.2.0/coreml/efficientnet_v2_s_coreml_all.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-efficientnet-v2-s/resolve/v0.2.0/xnnpack/efficientnet_v2_s_xnnpack.pte';

// Style transfer
export const STYLE_TRANSFER_CANDY =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-candy/resolve/v0.2.0/coreml/style_transfer_candy_coreml.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-candy/resolve/v0.2.0/xnnpack/style_transfer_candy_xnnpack.pte';

export const STYLE_TRANSFER_MOSAIC =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-mosaic/resolve/main/coreml/style_transfer_mosaic_coreml.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-mosaic/resolve/main/xnnpack/style_transfer_mosaic_xnnpack.pte';

export const STYLE_TRANSFER_RAIN_PRINCESS =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-rain-princess/resolve/main/coreml/style_transfer_rain_princess_coreml.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-rain-princess/resolve/main/xnnpack/style_transfer_rain_princess_xnnpack.pte';
export const STYLE_TRANSFER_UDNIE =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-udnie/resolve/main/coreml/style_transfer_udnie_coreml.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-udnie/resolve/main/xnnpack/style_transfer_udnie_xnnpack.pte';
