import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  /**
   * Initialize the background blur processor with a segmentation model
   * @param modelPath Path to the .pte segmentation model file
   */
  initialize(modelPath: string): void;

  /**
   * Deinitialize and release resources
   */
  deinitialize(): void;

  /**
   * Set the blur radius/intensity
   * @param radius Blur sigma value (default: 12.0)
   */
  setBlurRadius(radius: number): void;

  /**
   * Check if background blur is available on this device
   */
  isAvailable(): boolean;

  /**
   * Get the processor name to use with _setVideoEffect
   */
  getProcessorName(): string;
}

export default TurboModuleRegistry.get<Spec>('ExecutorchWebRTC');
