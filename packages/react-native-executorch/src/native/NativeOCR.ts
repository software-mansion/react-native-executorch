import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import { OCRDetection } from '../types/ocr';

export interface Spec extends TurboModule {
  loadModule(
    detectorSource: string,
    recognizerSourceLarge: string,
    recognizerSourceMedium: string,
    recognizerSourceSmall: string,
    symbols: string
  ): Promise<number>;
  forward(input: string): Promise<OCRDetection[]>;
}

export default TurboModuleRegistry.get<Spec>('OCR');
