import { Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-executorch' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const LLMSpec = require('./NativeLLM').default;

const LLM = LLMSpec
  ? LLMSpec
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

const ETModuleSpec = require('./NativeETModule').default;

const ETModule = ETModuleSpec
  ? ETModuleSpec
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

const ClassificationSpec = require('./NativeClassification').default;

const Classification = ClassificationSpec
  ? ClassificationSpec
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

const ObjectDetectionSpec = require('./NativeObjectDetection').default;

const ObjectDetection = ObjectDetectionSpec
  ? ObjectDetectionSpec
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

const StyleTransferSpec = require('./NativeStyleTransfer').default;

const StyleTransfer = StyleTransferSpec
  ? StyleTransferSpec
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

class ObjectDetectionModule {
  async forward(input: string){
    return await ObjectDetection.forward(input)
  }
  async loadModule(modelSource: string){
    return await ObjectDetection.loadModule(modelSource)
  }
}

class StyleTransferModule {
  async forward(input: string){
    return await StyleTransfer.forward(input)
  }
  async loadModule(modelSource: string){
    return await StyleTransfer.loadModule(modelSource);
  }
}

class ClassificationModule {
  async forward(input: string){
    return await Classification.forward(input)
  }
  async loadModule(modelSource: string){
    return await Classification.loadModule(modelSource)
  }
}

export { LLM, ETModule, Classification, ObjectDetection, StyleTransfer, ClassificationModule, StyleTransferModule, ObjectDetectionModule };
