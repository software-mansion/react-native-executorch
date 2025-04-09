import { Platform } from 'react-native';
import { Spec as ObjectDetectionInterface } from './NativeObjectDetection';
import { Spec as StyleTransferInterface } from './NativeStyleTransfer';
import { Spec as ImageSegmentationInterface } from './NativeImageSegmentation';
import { Spec as ETModuleInterface } from './NativeETModule';
import { Spec as OCRInterface } from './NativeOCR';
import { Spec as VerticalOCRInterface } from './NativeVerticalOCR';

const LINKING_ERROR =
  `The package 'react-native-executorch' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

function returnSpecOrThrowLinkingError(source: any) {
  const spec = source;
  if (!spec) {
    throw new Error(LINKING_ERROR);
  }
  return spec;
}

const LLM = returnSpecOrThrowLinkingError(require('./NativeLLM').default);
const ETModule = returnSpecOrThrowLinkingError(
  require('./NativeETModule').default
);
const Classification = returnSpecOrThrowLinkingError(
  require('./NativeClassification').default
);
const ImageSegmentation = returnSpecOrThrowLinkingError(
  require('./NativeImageSegmentation').default
);
const ObjectDetection = returnSpecOrThrowLinkingError(
  require('./NativeObjectDetection').default
);
const StyleTransfer = returnSpecOrThrowLinkingError(
  require('./NativeStyleTransfer').default
);
const SpeechToText = returnSpecOrThrowLinkingError(
  require('./NativeSpeechToText').default
);
const OCR = returnSpecOrThrowLinkingError(require('./NativeOCR').default);
const VerticalOCR = returnSpecOrThrowLinkingError(
  require('./NativeVerticalOCR').default
);
const Tokenizer = returnSpecOrThrowLinkingError(
  require('./NativeTokenizer').default
);
const TextEmbeddings = returnSpecOrThrowLinkingError(
  require('./NativeTextEmbeddings').default
);

class _ImageSegmentationModule {
  async forward(
    input: string,
    classesOfInteres: string[],
    resize: boolean
  ): ReturnType<ImageSegmentationInterface['forward']> {
    return await ImageSegmentation.forward(input, classesOfInteres, resize);
  }
  async loadModule(
    modelSource: string | number
  ): ReturnType<ImageSegmentationInterface['loadModule']> {
    return await ImageSegmentation.loadModule(modelSource);
  }
}

class _ObjectDetectionModule {
  async forward(
    input: string
  ): ReturnType<ObjectDetectionInterface['forward']> {
    return await ObjectDetection.forward(input);
  }
  async loadModule(
    modelSource: string | number
  ): ReturnType<ObjectDetectionInterface['loadModule']> {
    return await ObjectDetection.loadModule(modelSource);
  }
}

class _StyleTransferModule {
  async forward(input: string): ReturnType<StyleTransferInterface['forward']> {
    return await StyleTransfer.forward(input);
  }
  async loadModule(
    modelSource: string | number
  ): ReturnType<StyleTransferInterface['loadModule']> {
    return await StyleTransfer.loadModule(modelSource);
  }
}

class _SpeechToTextModule {
  async generate(waveform: number[][]): Promise<number[]> {
    return await SpeechToText.generate(waveform);
  }

  async loadModule(modelName: String, modelSources: (string | number)[]) {
    return await SpeechToText.loadModule(modelName, modelSources);
  }

  async encode(input: number[]) {
    return await SpeechToText.encode(input);
  }

  async decode(prevTokens: number[], encoderOutput?: number[]) {
    return await SpeechToText.decode(prevTokens, encoderOutput || []);
  }
}

class _OCRModule {
  async forward(input: string): ReturnType<OCRInterface['forward']> {
    return await OCR.forward(input);
  }

  async loadModule(
    detectorSource: string,
    recognizerSourceLarge: string,
    recognizerSourceMedium: string,
    recognizerSourceSmall: string,
    symbols: string
  ) {
    return await OCR.loadModule(
      detectorSource,
      recognizerSourceLarge,
      recognizerSourceMedium,
      recognizerSourceSmall,
      symbols
    );
  }
}

class _VerticalOCRModule {
  async forward(input: string): ReturnType<VerticalOCRInterface['forward']> {
    return await VerticalOCR.forward(input);
  }

  async loadModule(
    detectorLargeSource: string,
    detectorMediumSource: string,
    recognizerSource: string,
    symbols: string,
    independentCharacters: boolean
  ): ReturnType<VerticalOCRInterface['loadModule']> {
    return await VerticalOCR.loadModule(
      detectorLargeSource,
      detectorMediumSource,
      recognizerSource,
      symbols,
      independentCharacters
    );
  }
}

class _ETModule {
  async forward(
    inputs: number[][],
    shapes: number[][],
    inputTypes: number[]
  ): ReturnType<ETModuleInterface['forward']> {
    return await ETModule.forward(inputs, shapes, inputTypes);
  }
  async loadModule(
    modelSource: string
  ): ReturnType<ETModuleInterface['loadModule']> {
    return await ETModule.loadModule(modelSource);
  }
  async loadMethod(
    methodName: string
  ): ReturnType<ETModuleInterface['loadMethod']> {
    return await ETModule.loadMethod(methodName);
  }
}

export {
  LLM,
  ETModule,
  Classification,
  ObjectDetection,
  StyleTransfer,
  ImageSegmentation,
  SpeechToText,
  OCR,
  VerticalOCR,
  TextEmbeddings,
  Tokenizer,
  _ETModule,
  _StyleTransferModule,
  _ImageSegmentationModule,
  _ObjectDetectionModule,
  _SpeechToTextModule,
  _OCRModule,
  _VerticalOCRModule,
};
