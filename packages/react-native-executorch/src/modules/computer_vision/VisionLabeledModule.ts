import { LabelEnum, ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError } from '../../errors/errorUtils';
import { VisionModule } from './VisionModule';

export { ResolveLabels } from '../../types/computerVision';

/**
 * Fetches a model binary and returns its local path, throwing if the download
 * was interrupted (paused or cancelled).
 *
 * @internal
 */
export async function fetchModelPath(
  source: ResourceSource,
  onDownloadProgress: (progress: number) => void
): Promise<string> {
  const paths = await ResourceFetcher.fetch(onDownloadProgress, source);
  if (!paths?.[0]) {
    throw new RnExecutorchError(
      RnExecutorchErrorCode.DownloadInterrupted,
      'The download has been interrupted. Please retry.'
    );
  }
  return paths[0];
}

/**
 * Base class for computer vision modules that carry a type-safe label map
 * and support the full VisionModule API (string/PixelData forward + runOnFrame).
 *
 * @typeParam TOutput - The model's output type.
 * @typeParam LabelMap - The resolved {@link LabelEnum} for the model's output classes.
 * @internal
 */
export abstract class VisionLabeledModule<
  TOutput = unknown,
  LabelMap extends LabelEnum = LabelEnum,
> extends VisionModule<TOutput> {
  protected readonly labelMap: LabelMap;

  protected constructor(labelMap: LabelMap, nativeModule: unknown) {
    super();
    this.labelMap = labelMap;
    this.nativeModule = nativeModule;
  }
}
