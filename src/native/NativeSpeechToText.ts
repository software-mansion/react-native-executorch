import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  loadModule(
    modelName: string,
    modelSources: (string | number)[]
  ): Promise<number>;
  generate(waveform: number[]): Promise<number[]>;
  encode(input: number[][]): Promise<number[]>;
  decode(prevTokens: number[], encoderOutput: number[]): Promise<number[]>;

  readonly onToken: EventEmitter<number>;
}

export default TurboModuleRegistry.get<Spec>('SpeechToText');
