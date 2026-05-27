import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { StyleTransferModelName } from '../../types/styleTransfer';
import { ResourceSource, PixelData } from '../../types/common';
import { parseUnknownError, RnExecutorchError } from '../../errors/errorUtils';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { Logger } from '../../common/Logger';
import { VisionModule } from './VisionModule';

/**
 * Module for style transfer tasks.
 * @category Typescript API
 */
export class StyleTransferModule extends VisionModule<PixelData | string> {
  private constructor(nativeModule: unknown) {
    super();
    this.nativeModule = nativeModule;
  }
  /**
   * Creates a style transfer instance for a built-in model.
   * @param namedSources - An object specifying which built-in model to load and where to fetch it from.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `StyleTransferModule` instance.
   */
  static async fromModelName(
    namedSources: {
      modelName: StyleTransferModelName;
      modelSource: ResourceSource;
    },
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<StyleTransferModule> {
    try {
      const paths = await ResourceFetcher.fetch(
        onDownloadProgress,
        namedSources.modelSource
      );

      if (!paths?.[0]) {
        throw new RnExecutorchError(RnExecutorchErrorCode.DownloadInterrupted);
      }

      return new StyleTransferModule(await global.loadStyleTransfer(paths[0]));
    } catch (error) {
      Logger.error('Load failed:', error);
      throw parseUnknownError(error);
    }
  }

  /**
   * Creates a style transfer instance with a user-provided model binary.
   * Use this when working with a custom-exported model that is not one of the built-in presets.
   * @remarks The native model contract for this method is not formally defined and may change
   * between releases. Refer to the native source code for the current expected tensor interface.
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `StyleTransferModule` instance.
   */
  static fromCustomModel(
    modelSource: ResourceSource,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<StyleTransferModule> {
    return StyleTransferModule.fromModelName(
      { modelName: 'custom' as StyleTransferModelName, modelSource },
      onDownloadProgress
    );
  }

  /**
   * Executes style transfer on the provided image.
   * @param input - Image source (string path/URI or `PixelData` from a frame library).
   * @param outputType - Controls the output format. Defaults to `'pixelData'`, which
   *   returns raw RGBA pixels suitable for direct rendering. Pass `'url'` to
   *   have the stylized image saved to a temporary PNG on the device and
   *   receive a `file://` URI string instead.
   * @returns A Promise resolving to either a `PixelData` object or a `file://` URI string,
   *   depending on `outputType`.
   */
  async forward<O extends 'pixelData' | 'url' = 'pixelData'>(
    input: string | PixelData,
    outputType?: O
  ): Promise<O extends 'url' ? string : PixelData> {
    return super.forward(input, outputType === 'url') as Promise<
      O extends 'url' ? string : PixelData
    >;
  }
}
