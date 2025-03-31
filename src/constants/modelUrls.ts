import { Platform } from 'react-native';

// LLM's
export const LLAMA3_2_3B =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.1.0/llama-3.2-3B/original/llama3_2_3B_bf16.pte';
export const LLAMA3_2_3B_QLORA =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.1.0/llama-3.2-3B/QLoRA/llama3_2-3B_qat_lora.pte';
export const LLAMA3_2_3B_SPINQUANT =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.1.0/llama-3.2-3B/spinquant/llama3_2_3B_spinquant.pte';
export const LLAMA3_2_1B =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.1.0/llama-3.2-1B/original/llama3_2_bf16.pte';
export const LLAMA3_2_1B_QLORA =
  'https://huggingface.co/software-mansion/react-native-executorch-llama-3.2/resolve/v0.1.0/llama-3.2-1B/QLoRA/llama3_2_qat_lora.pte';
export const LLAMA3_2_1B_SPINQUANT =
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

// Object detection
export const SSDLITE_320_MOBILENET_V3_LARGE =
  'https://huggingface.co/software-mansion/react-native-executorch-ssdlite320-mobilenet-v3-large/resolve/v0.2.0/ssdlite320-mobilenetv3-large.pte';

// Style transfer
export const STYLE_TRANSFER_CANDY =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-candy/resolve/v0.2.0/coreml/style_transfer_candy_coreml.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-candy/resolve/v0.2.0/xnnpack/style_transfer_candy_xnnpack.pte';
export const STYLE_TRANSFER_MOSAIC =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-mosaic/resolve/v0.2.0/coreml/style_transfer_mosaic_coreml.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-mosaic/resolve/v0.2.0/xnnpack/style_transfer_mosaic_xnnpack.pte';
export const STYLE_TRANSFER_RAIN_PRINCESS =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-rain-princess/resolve/v0.2.0/coreml/style_transfer_rain_princess_coreml.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-rain-princess/resolve/v0.2.0/xnnpack/style_transfer_rain_princess_xnnpack.pte';
export const STYLE_TRANSFER_UDNIE =
  Platform.OS === 'ios'
    ? 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-udnie/resolve/v0.2.0/coreml/style_transfer_udnie_coreml.pte'
    : 'https://huggingface.co/software-mansion/react-native-executorch-style-transfer-udnie/resolve/v0.2.0/xnnpack/style_transfer_udnie_xnnpack.pte';

// S2T
export const MOONSHINE_TINY_DECODER =
  'https://huggingface.co/software-mansion/react-native-executorch-moonshine-tiny/resolve/v0.3.0/xnnpack/moonshine_tiny_xnnpack_decoder.pte';
export const MOONSHINE_TINY_ENCODER =
  'https://huggingface.co/software-mansion/react-native-executorch-moonshine-tiny/resolve/v0.3.0/xnnpack/moonshine_tiny_xnnpack_encoder.pte';
export const MOONSHINE_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-moonshine-tiny/resolve/v0.3.0/moonshine_tiny_tokenizer.json';
export const WHISPER_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/resolve/v0.3.0/whisper_tokenizer.json';
export const WHISPER_TINY_DECODER =
  'https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/resolve/v0.3.0/xnnpack/whisper_tiny_en_xnnpack_decoder.pte';
export const WHISPER_TINY_ENCODER =
  'https://huggingface.co/software-mansion/react-native-executorch-whisper-tiny.en/resolve/v0.3.0/xnnpack/whisper_tiny_en_xnnpack_encoder.pte';

// OCR

export const DETECTOR_CRAFT_1280 =
  'https://huggingface.co/software-mansion/react-native-executorch-detector-craft/resolve/v0.3.0/xnnpack/xnnpack_craft_1280.pte';
export const DETECTOR_CRAFT_800 =
  'https://huggingface.co/software-mansion/react-native-executorch-detector-craft/resolve/v0.3.0/xnnpack/xnnpack_craft_800.pte';
export const DETECTOR_CRAFT_320 =
  'https://huggingface.co/software-mansion/react-native-executorch-detector-craft/resolve/v0.3.0/xnnpack/xnnpack_craft_320.pte';

export const RECOGNIZER_EN_CRNN_512 =
  'https://huggingface.co/software-mansion/react-native-executorch-recognizer-crnn.en/resolve/v0.3.0/xnnpack/xnnpack_crnn_en_512.pte';
export const RECOGNIZER_EN_CRNN_256 =
  'https://huggingface.co/software-mansion/react-native-executorch-recognizer-crnn.en/resolve/v0.3.0/xnnpack/xnnpack_crnn_en_256.pte';
export const RECOGNIZER_EN_CRNN_128 =
  'https://huggingface.co/software-mansion/react-native-executorch-recognizer-crnn.en/resolve/v0.3.0/xnnpack/xnnpack_crnn_en_128.pte';
export const RECOGNIZER_EN_CRNN_64 =
  'https://huggingface.co/software-mansion/react-native-executorch-recognizer-crnn.en/resolve/v0.3.0/xnnpack/xnnpack_crnn_en_64.pte';

// Image segmentation
export const DEEPLABV3_RESNET50 =
  'https://huggingface.co/software-mansion/react-native-executorch-deeplab-v3/resolve/v0.4.0/xnnpack/deeplabV3_xnnpack_fp32.pte';

// Text Embeddings
export const ALL_MINILM_L6_V2 =
  'https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2/resolve/v0.4.0/all-MiniLM-L6-v2_xnnpack.pte';
export const ALL_MINILM_L6_V2_TOKENIZER =
  'https://huggingface.co/software-mansion/react-native-executorch-all-MiniLM-L6-v2/resolve/v0.4.0/tokenizer.json';

// Backward compatibility
export const LLAMA3_2_3B_URL = LLAMA3_2_3B;
export const LLAMA3_2_3B_QLORA_URL = LLAMA3_2_3B_QLORA;
export const LLAMA3_2_3B_SPINQUANT_URL = LLAMA3_2_3B_SPINQUANT;
export const LLAMA3_2_1B_URL = LLAMA3_2_1B;
export const LLAMA3_2_1B_QLORA_URL = LLAMA3_2_1B_QLORA;
export const LLAMA3_2_1B_SPINQUANT_URL = LLAMA3_2_1B_SPINQUANT;
