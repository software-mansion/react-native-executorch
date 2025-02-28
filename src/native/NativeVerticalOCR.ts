import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import { OCRDetection } from '../types/ocr';

export interface Spec extends TurboModule {
  loadModule(
    detectorLargeSource: string,
    detectorNarrowSource: string,
    recognizerSource: string,
    symbols: string,
    independentCharacters: boolean
  ): Promise<number>;
  forward(input: string): Promise<OCRDetection[]>;
}

export default TurboModuleRegistry.get<Spec>('VerticalOCR');
