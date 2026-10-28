// Hugging Face repos renamed in October 2026, new name -> previous name.
//
// Hugging Face redirects every previous name to the new one, so releases that
// still use the old URLs keep downloading. Nobody may ever create a repo under a
// previous name: it would take over that redirect and serve its own files to
// every app still on the old URL.
export const RENAMED_HF_REPOS: Readonly<Record<string, string>> = {
  'all-MiniLM-L6-v2-ExecuTorch': 'react-native-executorch-all-MiniLM-L6-v2',
  'all-mpnet-base-v2-ExecuTorch': 'react-native-executorch-all-mpnet-base-v2',
  'Bielik-1.5B-v3.0-Instruct-ExecuTorch': 'react-native-executorch-bielik-v3.0',
  'bk-sdm-tiny-ExecuTorch': 'react-native-executorch-bk-sdm-tiny',
  'BlazeFace-ExecuTorch': 'react-native-executorch-blazeface',
  'clip-vit-base-patch32-ExecuTorch': 'react-native-executorch-clip-vit-base-patch32',
  'CRAFT-ExecuTorch': 'react-native-executorch-detector-craft',
  'DeepLabV3-ExecuTorch': 'react-native-executorch-deeplab-v3',
  'Depth-Anything-3-Small-ExecuTorch': 'react-native-executorch-depth-anything-v3',
  'Depth-Anything-V2-ExecuTorch': 'react-native-executorch-depth-anything-v2',
  'distiluse-base-multilingual-cased-v2-ExecuTorch':
    'react-native-executorch-distiluse-base-multilingual-cased-v2',
  'EasyOCR-CRNN-ExecuTorch': 'react-native-executorch-recognizer-crnn.en',
  'EasyOCR-ExecuTorch': 'react-native-executorch-easy-ocr',
  'EfficientNetV2-S-ExecuTorch': 'react-native-executorch-efficientnet-v2-s',
  'EuroLLM-1.7B-Instruct-ExecuTorch': 'react-native-executorch-eurollm',
  'FaceMesh-ExecuTorch': 'react-native-executorch-facemesh',
  'Fast-Neural-Style-Transfer-Candy-ExecuTorch': 'react-native-executorch-style-transfer-candy',
  'Fast-Neural-Style-Transfer-Mosaic-ExecuTorch': 'react-native-executorch-style-transfer-mosaic',
  'Fast-Neural-Style-Transfer-Rain-Princess-ExecuTorch':
    'react-native-executorch-style-transfer-rain-princess',
  'Fast-Neural-Style-Transfer-Udnie-ExecuTorch': 'react-native-executorch-style-transfer-udnie',
  'FastSAM-ExecuTorch': 'react-native-executorch-fast-sam',
  'FCN-ExecuTorch': 'react-native-executorch-fcn',
  'fsmn-vad-ExecuTorch': 'react-native-executorch-fsmn-vad',
  'gemma-4-E2B-it-ExecuTorch': 'react-native-executorch-gemma-4-multimodal',
  'gemma-4-E2B-it-text-ExecuTorch': 'react-native-executorch-gemma-4',
  'Hammer2.1-ExecuTorch': 'react-native-executorch-hammer-2.1',
  'Kokoro-82M-ExecuTorch': 'react-native-executorch-kokoro',
  'LFM2.5-1.2B-Instruct-ExecuTorch': 'react-native-executorch-lfm2.5-1.2B-instruct',
  'LFM2.5-350M-ExecuTorch': 'react-native-executorch-lfm2.5-350M',
  'LFM2.5-ColBERT-350M-ExecuTorch': 'react-native-executorch-lfm2.5-colbert-350m',
  'LFM2.5-Embedding-350M-ExecuTorch': 'react-native-executorch-lfm2.5-embedding-350m',
  'LFM2.5-ExecuTorch': 'react-native-executorch-lfm-2.5',
  'LFM3-ExecuTorch': 'react-native-executorch-lfm-3',
  'Llama-3.2-ExecuTorch': 'react-native-executorch-llama-3.2',
  'LRASPP-MobileNetV3-Large-ExecuTorch': 'react-native-executorch-lraspp',
  'MediaPipe-Selfie-Segmentation-ExecuTorch': 'react-native-executorch-selfie-segmentation',
  'MI-GAN-ExecuTorch': 'react-native-executorch-migan',
  'MiniCPM5-2B-ExecuTorch': 'react-native-executorch-minicpm-5',
  'moonshine-tiny-ExecuTorch': 'react-native-executorch-moonshine-tiny',
  'multi-qa-MiniLM-L6-cos-v1-ExecuTorch': 'react-native-executorch-multi-qa-MiniLM-L6-cos-v1',
  'multi-qa-mpnet-base-dot-v1-ExecuTorch': 'react-native-executorch-multi-qa-mpnet-base-dot-v1',
  'openai-privacy-filter-ExecuTorch': 'react-native-executorch-privacy-filter-openai',
  'opus-mt-ExecuTorch': 'react-native-executorch-opus-mt',
  'PaddleOCR-Helpers-ExecuTorch': 'react-native-executorch-paddle-helpers',
  'paraphrase-multilingual-MiniLM-L12-v2-ExecuTorch':
    'react-native-executorch-paraphrase-multilingual-MiniLM-L12-v2',
  'Phi-4-mini-instruct-ExecuTorch': 'react-native-executorch-phi-4-mini',
  'PP-DocLayoutV3-ExecuTorch': 'react-native-executorch-pp-doclayout-v3',
  'PP-OCRv6-ExecuTorch': 'react-native-executorch-pp-ocrv6',
  'privacy-filter-nemotron-ExecuTorch': 'react-native-executorch-privacy-filter-nemotron',
  'Qwen2.5-ExecuTorch': 'react-native-executorch-qwen-2.5',
  'Qwen3-ASR-ExecuTorch': 'react-native-executorch-qwen-3-asr',
  'Qwen3-ExecuTorch': 'react-native-executorch-qwen-3',
  'Qwen3.5-ExecuTorch': 'react-native-executorch-qwen-3.5',
  'rf-detr-keypoint-ExecuTorch': 'react-native-executorch-rfdetr-keypoint',
  'rf-detr-nano-ExecuTorch': 'react-native-executorch-rfdetr-nano-detector',
  'rf-detr-seg-nano-ExecuTorch': 'react-native-executorch-rfdetr-nano-segmentation',
  'sdxs-512-dreamshaper-ExecuTorch': 'react-native-executorch-sdxs-512-dreamshaper',
  'SmolLM2-ExecuTorch': 'react-native-executorch-smolLm-2',
  'SSDlite320-MobileNetV3-Large-ExecuTorch':
    'react-native-executorch-ssdlite320-mobilenet-v3-large',
  'supertonic-ExecuTorch': 'react-native-executorch-supertonic',
  'whisper-base-ExecuTorch': 'react-native-executorch-whisper-base',
  'whisper-base.en-ExecuTorch': 'react-native-executorch-whisper-base.en',
  'whisper-base.en-quantized-ExecuTorch': 'react-native-executorch-whisper-base-quantized.en',
  'whisper-small-ExecuTorch': 'react-native-executorch-whisper-small',
  'whisper-small.en-ExecuTorch': 'react-native-executorch-whisper-small.en',
  'whisper-small.en-quantized-ExecuTorch': 'react-native-executorch-whisper-small-quantized.en',
  'whisper-tiny-ExecuTorch': 'react-native-executorch-whisper-tiny',
  'whisper-tiny.en-ExecuTorch': 'react-native-executorch-whisper-tiny.en',
  'whisper-tiny.en-quantized-ExecuTorch': 'react-native-executorch-whisper-tiny-quantized.en',
  'YOLO26-ExecuTorch': 'react-native-executorch-yolo26',
  'YOLO26-pose-ExecuTorch': 'react-native-executorch-yolo26-pose',
  'YOLO26-seg-ExecuTorch': 'react-native-executorch-yolo26-seg',
  'ZipDepth-ExecuTorch': 'react-native-executorch-zipdepth',
};

const ORG_PREFIX = 'https://huggingface.co/software-mansion/';
const PREVIOUS_NAME = new Map(
  Object.entries(RENAMED_HF_REPOS).map(([next, previous]) => [next.toLowerCase(), previous])
);

/**
 * Rewrites a renamed repo's URL to the URL it had before the rename.
 *
 * Cache keys are derived from this form, so a model an older release downloaded
 * from the previous URL is found again after the app upgrades, instead of being
 * downloaded a second time.
 * @param url - Any URL.
 * @returns `url` with a renamed repo swapped for its previous name; any other URL unchanged.
 */
export function previousRepoUrl(url: string): string {
  if (!url.startsWith(ORG_PREFIX)) return url;
  const rest = url.slice(ORG_PREFIX.length);
  const slash = rest.indexOf('/');
  const repo = slash === -1 ? rest : rest.slice(0, slash);
  const previous = PREVIOUS_NAME.get(repo.toLowerCase());
  return previous ? ORG_PREFIX + previous + rest.slice(repo.length) : url;
}
