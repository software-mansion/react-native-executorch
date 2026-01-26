import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { Segment } from '../../types/vad';
import { BaseModule } from '../BaseModule';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError } from '../../errors/errorUtils';

export class VADModule extends BaseModule {
  /**
   * Loads the model, where `modelSource` is a string that specifies the location of the model binary.
   * To track the download progress, supply a callback function `onDownloadProgressCallback`.
   * 
   * @param model - Object containing `modelSource`.
   * @param onDownloadProgressCallback - Optional callback to monitor download progress.
   */
  async load(
    model: { modelSource: ResourceSource },
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ): Promise<void> {
    const paths = await ResourceFetcher.fetch(
      onDownloadProgressCallback,
      model.modelSource
    );
    if (paths === null || paths.length < 1) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'The download has been interrupted. As a result, not every file was downloaded. Please retry the download.'
      );
    }
    this.nativeModule = global.loadVAD(paths[0] || '');
  }

  /**
   * Executes the model's forward pass, where `waveform` is a Float32Array representing the audio signal.
   * 
   * @param waveform - The input audio waveform as a Float32Array.
   * @returns A promise resolving to an array of detected speech segments.
   */
  async forward(waveform: Float32Array): Promise<Segment[]> {
    if (this.nativeModule == null)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    return await this.nativeModule.generate(waveform);
  }
}
