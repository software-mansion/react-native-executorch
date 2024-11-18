import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  loadLLM(
    modelSource: string,
    tokenizerSource: string,
    systemPrompt: string,
    contextWindowLength: number
  ): Promise<string>;
  runInference(input: string): Promise<string>;
  deleteModule(): void;
  interrupt(): void;

  addListener: (eventType: string) => void;
  removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.get<Spec>('RnExecutorch');
