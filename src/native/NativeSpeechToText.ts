import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  loadModule(
    preprocessorSource: string,
    encoderSource: string,
    decoderSource: string
  ): Promise<number>;
  encode(input: number[][]): Promise<number[][][]>;
  decode(prevTokens: number[], encoderOutput: number[]): Promise<number[][][]>;
  generate(spectrogram: number[]): Promise<number[]>;
  generateSync(fft: number[], numFrames: number, prevTokens: number[]): void;

  readonly onToken: EventEmitter<string>;
}

export default TurboModuleRegistry.get<Spec>('SpeechToText');
