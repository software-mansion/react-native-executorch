import { Platform } from 'react-native';
import { Spec as ObjectDetectionInterface } from './NativeObjectDetection';
import { Spec as ETModuleInterface } from './NativeETModule';
import { Spec as OCRInterface } from './NativeOCR';
import { Spec as VerticalOCRInterface } from './NativeVerticalOCR';
import { Spec as SpeechToTextInterface } from './NativeSpeechToText';
import { Spec as TextEmbeddingsInterface } from './NativeTextEmbeddings';
import { Spec as LLMInterface } from './NativeLLM';
import { Spec as ClassificationInterface } from './NativeClassification';
import { Spec as TokenizerInterface } from './NativeTokenizer';
import { Spec as ETInstallerInterface } from './NativeETInstaller';

const LINKING_ERROR =
  `The package 'react-native-executorch' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

function returnSpecOrThrowLinkingError(spec: any) {
  return spec
    ? spec
    : new Proxy(
        {},
        {
          get() {
            throw new Error(LINKING_ERROR);
          },
        }
      );
}

const LLMNativeModule: LLMInterface = returnSpecOrThrowLinkingError(
  require('./NativeLLM').default
);
const ETModuleNativeModule: ETModuleInterface = returnSpecOrThrowLinkingError(
  require('./NativeETModule').default
);
const ClassificationNativeModule: ClassificationInterface =
  returnSpecOrThrowLinkingError(require('./NativeClassification').default);
const ObjectDetectionNativeModule: ObjectDetectionInterface =
  returnSpecOrThrowLinkingError(require('./NativeObjectDetection').default);
const SpeechToTextNativeModule: SpeechToTextInterface =
  returnSpecOrThrowLinkingError(require('./NativeSpeechToText').default);
const OCRNativeModule: OCRInterface = returnSpecOrThrowLinkingError(
  require('./NativeOCR').default
);
const VerticalOCRNativeModule: VerticalOCRInterface =
  returnSpecOrThrowLinkingError(require('./NativeVerticalOCR').default);
const TokenizerNativeModule: TokenizerInterface = returnSpecOrThrowLinkingError(
  require('./NativeTokenizer').default
);
const TextEmbeddingsNativeModule: TextEmbeddingsInterface =
  returnSpecOrThrowLinkingError(require('./NativeTextEmbeddings').default);
const ETInstallerNativeModule: ETInstallerInterface =
  returnSpecOrThrowLinkingError(require('./NativeETInstaller').default);

export {
  LLMNativeModule,
  ETModuleNativeModule,
  ClassificationNativeModule,
  ObjectDetectionNativeModule,
  SpeechToTextNativeModule,
  OCRNativeModule,
  VerticalOCRNativeModule,
  TextEmbeddingsNativeModule,
  TokenizerNativeModule,
  ETInstallerNativeModule,
};
