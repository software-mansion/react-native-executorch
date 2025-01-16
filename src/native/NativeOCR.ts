import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  loadModule(
    detectorSource: string,
    recognizerSources: string[],
    language: string
  ): Promise<number>;
  forward(input: string): Promise<any[]>;
}

export default TurboModuleRegistry.get<Spec>('OCR');
