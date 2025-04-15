import { Platform } from 'react-native';

// LLM's
export const LLAMA3_2_3B =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.4.0/llama-3.2-3B/original/llama3_2_3B_bf16.pte';
export const LLAMA3_2_3B_QLORA =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.4.0/llama-3.2-3B/QLoRA/llama3_2-3B_qat_lora.pte';
export const LLAMA3_2_3B_SPINQUANT =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.4.0/llama-3.2-3B/spinquant/llama3_2_3B_spinquant.pte';
export const LLAMA3_2_1B =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.4.0/llama-3.2-1B/original/llama3_2_bf16.pte';
export const LLAMA3_2_1B_QLORA =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.4.0/llama-3.2-1B/QLoRA/llama3_2_qat_lora.pte';
export const LLAMA3_2_1B_SPINQUANT =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.4.0/llama-3.2-1B/spinquant/llama3_2_spinquant.pte';
export const LLAMA3_2_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.4.0/tokenizer.json';
export const LLAMA3_2_TOKENIZER_CONFIG =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.4.0/tokenizer_config.json';

// Classification
export const EFFICIENTNET_V2_S =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-efficientnet-v2-s/resolve/v0.4.0/coreml/efficientnet_v2_s_coreml_all.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-efficientnet-v2-s/resolve/v0.4.0/xnnpack/efficientnet_v2_s_xnnpack.pte';

// Object detection
export const SSDLITE_320_MOBILENET_V3_LARGE =
  'https://huggingface.co/software-mansion/react-native-executorch-ssdlite320-mobilenet-v3-large/resolve/v0.4.0/ssdlite320-mobilenetv3-large.pte';

// Style transfer
export const STYLE_TRANSFER_CANDY =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-candy/resolve/v0.4.0/coreml/style_transfer_candy_coreml.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-candy/resolve/v0.4.0/xnnpack/style_transfer_candy_xnnpack.pte';
export const STYLE_TRANSFER_MOSAIC =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-mosaic/resolve/v0.4.0/coreml/style_transfer_mosaic_coreml.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-mosaic/resolve/v0.4.0/xnnpack/style_transfer_mosaic_xnnpack.pte';
export const STYLE_TRANSFER_RAIN_PRINCESS =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-rain-princess/resolve/v0.4.0/coreml/style_transfer_rain_princess_coreml.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-rain-princess/resolve/v0.4.0/xnnpack/style_transfer_rain_princess_xnnpack.pte';
export const STYLE_TRANSFER_UDNIE =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-udnie/resolve/v0.4.0/coreml/style_transfer_udnie_coreml.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-udnie/resolve/v0.4.0/xnnpack/style_transfer_udnie_xnnpack.pte';

// S2T
export const MOONSHINE_TINY_DECODER =
  'https://huggingface.co/software-mansion/react-native-executorch-moonshine-tiny/resolve/v0.4.0/xnnpack/moonshine_tiny_xnnpack_decoder.pte';
export const MOONSHINE_TINY_ENCODER =
  'https://huggingface.co/software-mansion/react-native-executorch-moonshine-tiny/resolve/v0.4.0/xnnpack/moonshine_tiny_xnnpack_encoder.pte';
export const MOONSHINE_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-moonshine-tiny/resolve/v0.4.0/moonshine_tiny_tokenizer.json';
export const WHISPER_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/resolve/v0.4.0/whisper_tokenizer.json';
export const WHISPER_TINY_DECODER =
  'https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/resolve/v0.4.0/xnnpack/whisper_tiny_en_xnnpack_decoder.pte';
export const WHISPER_TINY_ENCODER =
  'https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/resolve/v0.4.0/xnnpack/whisper_tiny_en_xnnpack_encoder.pte';
export const WHISPER_TINY_MULTILINGUAL_ENCODER =
  'https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny/resolve/v0.4.0/xnnpack/xnnpack_whisper_encoder.pte';
export const WHISPER_TINY_MULTILINGUAL_DECODER =
  'https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny/resolve/v0.4.0/xnnpack/xnnpack_whisper_decoder.pte';
export const WHISPER_TINY_MULTILINGUAL_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny/resolve/v0.4.0/tokenizer.json';

// OCR
export const DETECTOR_CRAFT_1280 =
  'https://huggingface.co/software-mansion/react-native-executorch-detector-craft/resolve/v0.4.0/xnnpack/xnnpack_craft_1280.pte';
export const DETECTOR_CRAFT_800 =
  'https://huggingface.co/software-mansion/react-native-executorch-detector-craft/resolve/v0.4.0/xnnpack/xnnpack_craft_800.pte';
export const DETECTOR_CRAFT_320 =
  'https://huggingface.co/software-mansion/react-native-executorch-detector-craft/resolve/v0.4.0/xnnpack/xnnpack_craft_320.pte';

// Image segmentation
export const DEEPLAB_V3_RESNET50 =
  'https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3/resolve/v0.4.0/xnnpack/deeplabV3_xnnpack_fp32.pte';

// Backward compatibility
export const LLAMA3_2_3B_URL = LLAMA3_2_3B;
export const LLAMA3_2_3B_QLORA_URL = LLAMA3_2_3B_QLORA;
export const LLAMA3_2_3B_SPINQUANT_URL = LLAMA3_2_3B_SPINQUANT;
export const LLAMA3_2_1B_URL = LLAMA3_2_1B;
export const LLAMA3_2_1B_QLORA_URL = LLAMA3_2_1B_QLORA;
export const LLAMA3_2_1B_SPINQUANT_URL = LLAMA3_2_1B_SPINQUANT;
