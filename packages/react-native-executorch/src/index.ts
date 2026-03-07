import { ETInstallerNativeModule } from './native/RnExecutorchModules';
import {
  ResourceFetcher,
  ResourceFetcherAdapter,
} from './utils/ResourceFetcher';
import { Triple } from './types/common';
/**
 * Configuration that goes to the `initExecutorch`.
 * You can pass either bare React Native or Expo configuration.
 *
 * @category Utilities - General
 */
export interface ExecutorchConfig {
  resourceFetcher: ResourceFetcherAdapter;
}

/**
 * Function that setups the provided resource fetcher.
 *
 * @category Utilities - General
 * @param config - Configuration that you want to use in resource fetching.
 */
export function initExecutorch(config: ExecutorchConfig) {
  ResourceFetcher.setAdapter(config.resourceFetcher);
}

/**
 * Function that cleans current setup of fetching resources.
 *
 * @category Utilities - General
 */
export function cleanupExecutorch() {
  ResourceFetcher.resetAdapter();
}

// eslint-disable no-var
declare global {
  var loadStyleTransfer: (source: string) => Promise<any>;
  var loadSemanticSegmentation: (
    source: string,
    normMean: Triple<number> | [],
    normStd: Triple<number> | [],
    allClasses: string[]
  ) => Promise<any>;
  var loadClassification: (source: string) => Promise<any>;
  var loadObjectDetection: (
    source: string,
    normMean: Triple<number> | [],
    normStd: Triple<number> | [],
    labelNames: string[]
  ) => Promise<any>;
  var loadExecutorchModule: (source: string) => Promise<any>;
  var loadTokenizerModule: (source: string) => Promise<any>;
  var loadImageEmbeddings: (source: string) => Promise<any>;
  var loadVAD: (source: string) => Promise<any>;
  var loadTextEmbeddings: (modelSource: string, tokenizerSource: string) => Promise<any>;
  var loadLLM: (modelSource: string, tokenizerSource: string) => Promise<any>;
  var loadTextToImage: (
    tokenizerSource: string,
    encoderSource: string,
    unetSource: string,
    decoderSource: string,
    schedulerBetaStart: number,
    schedulerBetaEnd: number,
    schedulerNumTrainTimesteps: number,
    schedulerStepsOffset: number
  ) => Promise<any>;
  var loadSpeechToText: (
    encoderSource: string,
    decoderSource: string,
    modelName: string
  ) => Promise<any>;
  var loadTextToSpeechKokoro: (
    lang: string,
    taggerData: string,
    phonemizerData: string,
    durationPredictorSource: string,
    synthesizerSource: string,
    voice: string
  ) => Promise<any>;
  var loadOCR: (
    detectorSource: string,
    recognizer: string,
    symbols: string
  ) => Promise<any>;
  var loadVerticalOCR: (
    detectorSource: string,
    recognizer: string,
    symbols: string,
    independentCharacters?: boolean
  ) => Promise<any>;
}
// eslint-disable no-var
if (
  global.loadStyleTransfer == null ||
  global.loadSemanticSegmentation == null ||
  global.loadTextToImage == null ||
  global.loadExecutorchModule == null ||
  global.loadClassification == null ||
  global.loadObjectDetection == null ||
  global.loadTokenizerModule == null ||
  global.loadTextEmbeddings == null ||
  global.loadImageEmbeddings == null ||
  global.loadVAD == null ||
  global.loadLLM == null ||
  global.loadSpeechToText == null ||
  global.loadTextToSpeechKokoro == null ||
  global.loadOCR == null ||
  global.loadVerticalOCR == null
) {
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
export * from './hooks/computer_vision/useSemanticSegmentation';
export * from './hooks/computer_vision/useOCR';
export * from './hooks/computer_vision/useVerticalOCR';
export * from './hooks/computer_vision/useImageEmbeddings';
export * from './hooks/computer_vision/useTextToImage';

export * from './hooks/natural_language_processing/useLLM';
export * from './hooks/natural_language_processing/useSpeechToText';
export * from './hooks/natural_language_processing/useTextToSpeech';
export * from './hooks/natural_language_processing/useTextEmbeddings';
export * from './hooks/natural_language_processing/useTokenizer';
export * from './hooks/natural_language_processing/useVAD';

export * from './hooks/general/useExecutorchModule';

// modules
export * from './modules/computer_vision/ClassificationModule';
export * from './modules/computer_vision/ObjectDetectionModule';
export * from './modules/computer_vision/StyleTransferModule';
export * from './modules/computer_vision/SemanticSegmentationModule';
export * from './modules/computer_vision/OCRModule';
export * from './modules/computer_vision/VerticalOCRModule';
export * from './modules/computer_vision/ImageEmbeddingsModule';
export * from './modules/computer_vision/TextToImageModule';

export * from './modules/natural_language_processing/LLMModule';
export * from './modules/natural_language_processing/SpeechToTextModule';
export * from './modules/natural_language_processing/TextToSpeechModule';
export * from './modules/natural_language_processing/TextEmbeddingsModule';
export * from './modules/natural_language_processing/TokenizerModule';
export * from './modules/natural_language_processing/VADModule';

export * from './modules/general/ExecutorchModule';

// utils
export * from './utils/ResourceFetcher';
export * from './utils/ResourceFetcherUtils';
export * from './utils/llm';
export * from './common/Logger';
export * from './utils/llms/context_strategy';

// types
export * from './types/objectDetection';
export * from './types/ocr';
export * from './types/semanticSegmentation';
export * from './types/llm';
export * from './types/vad';
export * from './types/common';
export * from './types/stt';
export * from './types/textEmbeddings';
export * from './types/tts';
export * from './types/tokenizer';
export * from './types/executorchModule';
export * from './types/classification';
export * from './types/imageEmbeddings';
export * from './types/styleTransfer';
export * from './types/tti';

// constants
export * from './constants/commonVision';
export * from './constants/modelUrls';
export * from './constants/ocr/models';
export * from './constants/tts/models';
export * from './constants/tts/voices';
export * from './constants/llmDefaults';

export { RnExecutorchError } from './errors/errorUtils';
export { RnExecutorchErrorCode } from './errors/ErrorCodes';
