import { LLM } from '../../native/RnExecutorchModules';
import { Image } from 'react-native';
import { ResourceSource } from '../../types/common';

export class LLMModule {
  async loadModel(
    modelSource: ResourceSource,
    tokenizerSource: ResourceSource,
    systemPrompt?: string,
    contextWindowLength?: number
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

  async generate(input: string): Promise<void> {
    try {
      await LLM.runInference(input);
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  onDownloadProgress(callback: (data: number) => void) {
    return LLM.onDownloadProgress(callback);
  }

  onToken(callback: (data: string | undefined) => void) {
    return LLM.onToken(callback);
  }

  interrupt() {
    LLM.interrupt();
  }

  deleteModule() {
    LLM.deleteModule();
  }
}
