import { ETInstallerNativeModule } from './native/RnExecutorchModules';
import { Triple } from './types/common';

// eslint-disable no-var
declare global {
  var loadStyleTransfer: (source: string) => any;
  var loadImageSegmentation: (
    source: string,
    normMean: Triple<number> | [],
    normStd: Triple<number> | []
  ) => any;
  var loadClassification: (source: string) => any;
  var loadObjectDetection: (source: string) => any;
  var loadExecutorchModule: (source: string) => any;
  var loadTokenizerModule: (source: string) => any;
  var loadImageEmbeddings: (source: string) => any;
  var loadVAD: (source: string) => any;
  var loadTextEmbeddings: (modelSource: string, tokenizerSource: string) => any;
  var loadLLM: (modelSource: string, tokenizerSource: string) => any;
  var loadTextToImage: (
    tokenizerSource: string,
    encoderSource: string,
    unetSource: string,
    decoderSource: string,
    schedulerBetaStart: number,
    schedulerBetaEnd: number,
    schedulerNumTrainTimesteps: number,
    schedulerStepsOffset: number
  ) => any;
  var loadSpeechToText: (
    encoderSource: string,
    decoderSource: string,
    modelName: string
  ) => any;
  var loadTextToSpeechKokoro: (
    lang: string,
    taggerData: string,
    phonemizerData: string,
    durationPredictorSource: string,
    synthesizerSource: string,
    voice: string
  ) => any;
  var loadOCR: (
    detectorSource: string,
    recognizer: string,
    symbols: string
  ) => any;
  var loadVerticalOCR: (
    detectorSource: string,
    recognizer: string,
    symbols: string,
    independentCharacters?: boolean
  ) => any;
}
// eslint-disable no-var
if (
  global.loadStyleTransfer == null ||
  global.loadImageSegmentation == null ||
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
export * from './hooks/computer_vision/useImageSegmentation';
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
export * from './modules/computer_vision/ImageSegmentationModule';
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
export * from './utils/llm';

// types
export * from './types/objectDetection';
export * from './types/ocr';
export * from './types/imageSegmentation';
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
export * from './constants/modelUrls';
export * from './constants/ocr/models';
export * from './constants/tts/models';
export * from './constants/tts/voices';
export * from './constants/llmDefaults';

export { RnExecutorchError } from './errors/errorUtils';
export { RnExecutorchErrorCode } from './errors/ErrorCodes';
