import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';
import { MessageType } from '../types/common';

export interface Spec extends TurboModule {
  loadLLM(
    modelSource: string,
    tokenizerSource: string,
    systemPrompt: string,
    messageHistory: MessageType[],
    contextWindowLength: number
  ): Promise<string>;
  runInference(input: string): Promise<string>;
  interrupt(): void;
  deleteModule(): void;

  readonly onToken: EventEmitter<string>;
}

export default TurboModuleRegistry.get<Spec>('LLM');
