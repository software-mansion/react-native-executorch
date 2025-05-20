import { SpeechToTextLanguage } from './types/stt';

import { ETInstallerNativeModule } from './native/RnExecutorchModules';

// eslint-disable no-var
declare global {
  var loadStyleTransfer: (source: string) => Promise<any>;
}
// eslint-disable no-var

if (global.loadStyleTransfer == null) {
  if (!ETInstallerNativeModule) {
    throw new Error(
      `Failed to install react-native-executorch: The native module could not be found.`
    );
  }

  ETInstallerNativeModule.install();
}

// hooks
export * from './hooks/computer_vision/useClassification';
export * from './hooks/computer_vision/useObjectDetection';
export * from './hooks/computer_vision/useStyleTransfer';
export * from './hooks/computer_vision/useImageSegmentation';
export * from './hooks/computer_vision/useOCR';
export * from './hooks/computer_vision/useVerticalOCR';

export * from './hooks/natural_language_processing/useLLM';
export * from './hooks/natural_language_processing/useSpeechToText';
export * from './hooks/natural_language_processing/useTextEmbeddings';
export * from './hooks/natural_language_processing/useTokenizer';

export * from './hooks/general/useExecutorchModule';

// modules
export * from './modules/computer_vision/ClassificationModule';
export * from './modules/computer_vision/ObjectDetectionModule';
export * from './modules/computer_vision/StyleTransferModule';
export * from './modules/computer_vision/ImageSegmentationModule';
export * from './modules/computer_vision/OCRModule';
export * from './modules/computer_vision/VerticalOCRModule';

export * from './modules/natural_language_processing/LLMModule';
export * from './modules/natural_language_processing/SpeechToTextModule';
export * from './modules/natural_language_processing/TextEmbeddingsModule';
export * from './modules/natural_language_processing/TokenizerModule';

export * from './modules/general/ExecutorchModule';

// utils
export * from './utils/ResourceFetcher';

// types
export * from './types/objectDetection';
export * from './types/ocr';
export * from './types/imageSegmentation';
export * from './types/llm';
export { SpeechToTextLanguage };

// constants
export * from './constants/modelUrls';
export * from './constants/ocr/models';
export * from './constants/llmDefaults';
export { STREAMING_ACTION, MODES } from './constants/sttDefaults';
