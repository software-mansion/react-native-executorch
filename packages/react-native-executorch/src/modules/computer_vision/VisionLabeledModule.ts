import { LabelEnum } from '../../types/common';
import { VisionModule } from './VisionModule';

/**
 * Base class for computer vision modules that carry a type-safe label map
 * and support the full VisionModule API (string/PixelData forward + runOnFrame).
 *
 * @typeParam TOutput - The model's output type.
 * @typeParam LabelMap - The resolved {@link LabelEnum} for the model's output classes.
 * @internal
 */
export abstract class VisionLabeledModule<
  TOutput,
  LabelMap extends LabelEnum,
> extends VisionModule<TOutput> {
  protected readonly labelMap: LabelMap;

  protected constructor(labelMap: LabelMap, nativeModule: unknown) {
    super();
    this.labelMap = labelMap;
    this.nativeModule = nativeModule;
  }

  // TODO: figure it out so we can delete this (we need this because of basemodule inheritance)
  override async load() {}
}
