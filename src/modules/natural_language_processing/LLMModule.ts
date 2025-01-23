import { LLM } from '../../native/RnExecutorchModules';
import { Image } from 'react-native';
import {
  DEFAULT_CONTEXT_WINDOW_LENGTH,
  DEFAULT_SYSTEM_PROMPT,
} from '../../constants/llamaDefaults';
import { ResourceSource } from '../../types/common';

export class LLMModule {
  static async load(
    modelSource: ResourceSource,
    tokenizerSource: ResourceSource,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    contextWindowLength = DEFAULT_CONTEXT_WINDOW_LENGTH
  ) {
    try {
      let modelUrl = modelSource;
      let tokenizerUrl = tokenizerSource;

      if (typeof modelSource === 'number') {
        modelUrl = Image.resolveAssetSource(modelSource).uri;
      }

      if (typeof tokenizerSource === 'number') {
        tokenizerUrl = Image.resolveAssetSource(tokenizerSource).uri;
      }

      await LLM.loadLLM(
        modelUrl as string,
        tokenizerUrl as string,
        systemPrompt,
        contextWindowLength
      );
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  static async generate(input: string) {
    try {
      await LLM.runInference(input);
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  static onDownloadProgress(callback: (data: number) => void) {
    return LLM.onDownloadProgress(callback);
  }

  static onToken(callback: (data: string | undefined) => void) {
    return LLM.onToken(callback);
  }

  static interrupt() {
    LLM.interrupt();
  }

  static delete() {
    LLM.deleteModule();
  }
}
