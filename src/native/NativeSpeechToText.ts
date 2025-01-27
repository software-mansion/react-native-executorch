import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  loadModule(encoderSource: string, decoderSource: string): Promise<number>;
  encode(input: number[][]): Promise<number[][][]>;
  decode(prevTokens: number[], encoderOutput: number[]): Promise<number[][][]>;
}

export default TurboModuleRegistry.get<Spec>('SpeechToText');
