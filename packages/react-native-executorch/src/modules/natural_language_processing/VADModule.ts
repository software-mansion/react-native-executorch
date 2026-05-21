import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { Segment, VADModelName, VADStreamingInput } from '../../types/vad';
import { BaseModule } from '../BaseModule';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { Logger } from '../../common/Logger';

/**
 * Module for Voice Activity Detection (VAD) functionalities.
 * @category Typescript API
 */
export class VADModule extends BaseModule {
  private isStreaming: boolean = false;

  private constructor(nativeModule: unknown) {
    super();
    this.nativeModule = nativeModule;
  }

  /**
   * Creates a VAD instance for a built-in model.
   * @param namedSources - An object specifying which built-in model to load and where to fetch it from.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `VADModule` instance.
   */
  static async fromModelName(
    namedSources: { modelName: VADModelName; modelSource: ResourceSource },
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<VADModule> {
    try {
      const paths = await ResourceFetcher.fetch(
        onDownloadProgress,
        namedSources.modelSource
      );
      if (!paths?.[0]) {
        throw new RnExecutorchError(RnExecutorchErrorCode.DownloadInterrupted);
      }
      return new VADModule(await global.loadVAD(paths[0]));
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Creates a VAD instance with a user-provided model binary.
   * Use this when working with a custom-exported model that is not one of the built-in presets.
   * @remarks The native model contract for this method is not formally defined and may change
   * between releases. Refer to the native source code for the current expected tensor interface.
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `VADModule` instance.
   */
  static fromCustomModel(
    modelSource: ResourceSource,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<VADModule> {
    return VADModule.fromModelName(
      { modelName: 'custom' as VADModelName, modelSource },
      onDownloadProgress
    );
  }

  /**
   * Executes the model's forward pass to detect speech segments within the provided audio.
   * @param waveform - A `Float32Array` representing a mono audio signal sampled at 16kHz.
   * @returns A Promise resolving to an array of {@link Segment} objects.
   */
  async forward(waveform: Float32Array): Promise<Segment[]> {
    if (this.nativeModule == null)
      throw new RnExecutorchError(RnExecutorchErrorCode.ModuleNotLoaded);
    return await this.nativeModule.generate(waveform);
  }

  /**
   * Starts a streaming VAD session.
   * @param input - Configuration for streaming, including callbacks for speech begin/end and optional parameters.
   * @returns A promise that resolves when the streaming session stops.
   */
  public async stream({
    onSpeechBegin,
    onSpeechEnd,
    options,
  }: VADStreamingInput): Promise<void> {
    if (this.nativeModule == null)
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling stream().'
      );

    const timeout = options?.timeout ?? 100;
    const detectionMargin = options?.detectionMargin ?? 100;

    let isSpeaking = false;
    let error: unknown;
    let finished = false;

    let waiter: (() => void) | null = null;
    const wake = () => {
      waiter?.();
      waiter = null;
    };

    this.isStreaming = true;

    (async () => {
      try {
        await this.nativeModule.stream(
          async (speaking: boolean) => {
            if (speaking && !isSpeaking) {
              isSpeaking = true;
              await onSpeechBegin?.();
            } else if (!speaking && isSpeaking) {
              isSpeaking = false;
              await onSpeechEnd?.();
            }
          },
          timeout,
          detectionMargin
        );
        finished = true;
        wake();
      } catch (e) {
        error = e;
        finished = true;
        wake();
      }
    })();

    while (this.isStreaming && !finished) {
      if (error) throw parseUnknownError(error);
      await new Promise<void>((r) => (waiter = r));
    }
  }

  /**
   * Inserts a new audio chunk into the streaming VAD session.
   * @param waveform - The audio chunk to insert.
   */
  public streamInsert(waveform: Float32Array): void {
    if (this.nativeModule == null)
      throw new RnExecutorchError(RnExecutorchErrorCode.ModuleNotLoaded);
    this.nativeModule.streamInsert(waveform);
  }

  /**
   * Stops the current streaming VAD session.
   */
  public streamStop(): void {
    if (this.nativeModule == null)
      throw new RnExecutorchError(RnExecutorchErrorCode.ModuleNotLoaded);
    this.nativeModule.streamStop();
    this.isStreaming = false;
  }
}
