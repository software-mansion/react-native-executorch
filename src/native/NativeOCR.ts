import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import { OCRDetection } from '../types/ocr';

export interface Spec extends TurboModule {
  loadModule(
    detectorSource: string,
    recognizerSource512: string,
    recognizerSource256: string,
    recognizerSource128: string,
    language: string
  ): Promise<number>;
  forward(input: string): Promise<OCRDetection[]>;
}

export default TurboModuleRegistry.get<Spec>('OCR');
