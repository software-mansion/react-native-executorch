import { LabelEnum, PixelData, ResourceSource } from '../../types/common';
import {
  Detection,
  ObjectDetectionConfig,
  ObjectDetectionModelName,
  ObjectDetectionModelSources,
} from '../../types/objectDetection';
import {
  CocoLabel,
  IMAGENET1K_MEAN,
  IMAGENET1K_STD,
} from '../../constants/commonVision';
import {
  fetchModelPath,
  ResolveLabels as ResolveLabelsFor,
} from '../BaseLabeledModule';
import { VisionLabeledModule } from './VisionLabeledModule';

const ModelConfigs = {
  'ssdlite-320-mobilenet-v3-large': {
    labelMap: CocoLabel,
    preprocessorConfig: undefined,
  },
  'rf-detr-nano': {
    labelMap: CocoLabel,
    preprocessorConfig: { normMean: IMAGENET1K_MEAN, normStd: IMAGENET1K_STD },
  },
} as const satisfies Record<
  ObjectDetectionModelName,
  ObjectDetectionConfig<LabelEnum>
>;

type ModelConfigsType = typeof ModelConfigs;

/**
 * Resolves the {@link LabelEnum} for a given built-in object detection model name.
 *
 * @typeParam M - A built-in model name from {@link ObjectDetectionModelName}.
 *
 * @category Types
 */
export type ObjectDetectionLabels<M extends ObjectDetectionModelName> =
  ResolveLabelsFor<M, ModelConfigsType>;

type ModelNameOf<C extends ObjectDetectionModelSources> = C['modelName'];

/** @internal */
type ResolveLabels<T extends ObjectDetectionModelName | LabelEnum> =
  ResolveLabelsFor<T, ModelConfigsType>;

/**
 * Generic object detection module with type-safe label maps.
 *
 * @typeParam T - Either a built-in model name (e.g. `'ssdlite-320-mobilenet-v3-large'`)
 *   or a custom {@link LabelEnum} label map.
 *
 * @category Typescript API
 */
export class ObjectDetectionModule<
  T extends ObjectDetectionModelName | LabelEnum,
> extends VisionLabeledModule<Detection<ResolveLabels<T>>[], ResolveLabels<T>> {
  private constructor(labelMap: ResolveLabels<T>, nativeModule: unknown) {
    super(labelMap, nativeModule);
  }

  /**
   * Creates an object detection instance for a built-in model.
   *
   * @param namedSources - A {@link ObjectDetectionModelSources} object specifying which model to load and where to fetch it from.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to an `ObjectDetectionModule` instance typed to the chosen model's label map.
   */
  static async fromModelName<C extends ObjectDetectionModelSources>(
    namedSources: C,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ObjectDetectionModule<ModelNameOf<C>>> {
    const { modelSource } = namedSources;
    const { labelMap, preprocessorConfig } = ModelConfigs[
      namedSources.modelName
    ] as ObjectDetectionConfig<LabelEnum>;
    const normMean = preprocessorConfig?.normMean ?? [];
    const normStd = preprocessorConfig?.normStd ?? [];
    const allLabelNames: string[] = [];
    for (const [name, value] of Object.entries(labelMap)) {
      if (typeof value === 'number') allLabelNames[value] = name;
    }
    for (let i = 0; i < allLabelNames.length; i++) {
      if (allLabelNames[i] == null) allLabelNames[i] = '';
    }
    const modelPath = await fetchModelPath(modelSource, onDownloadProgress);
    const nativeModule = await global.loadObjectDetection(
      modelPath,
      normMean,
      normStd,
      allLabelNames
    );
    return new ObjectDetectionModule<ModelNameOf<C>>(
      labelMap as ResolveLabels<ModelNameOf<C>>,
      nativeModule
    );
  }

  /**
   * Executes the model's forward pass to detect objects within the provided image.
   *
   * @param input - A string image source (file path, URI, or Base64) or a {@link PixelData} object.
   * @param detectionThreshold - Minimum confidence score for a detection to be included. Default is 0.7.
   * @returns A Promise resolving to an array of {@link Detection} objects.
   */
  override async forward(
    input: string | PixelData,
    detectionThreshold = 0.7
  ): Promise<Detection<ResolveLabels<T>>[]> {
    return super.forward(input, detectionThreshold);
  }

  /**
   * Creates an object detection instance with a user-provided model binary and label map.
   * Use this when working with a custom-exported model that is not one of the built-in presets.
   * Internally uses `'custom'` as the model name for telemetry unless overridden.
   *
   * ## Required model contract
   *
   * The `.pte` model binary must expose a single `forward` method with the following interface:
   *
   * **Input:** one `float32` tensor of shape `[1, 3, H, W]` — a single RGB image, values in
   * `[0, 1]` after optional per-channel normalization `(pixel − mean) / std`.
   * H and W are read from the model's declared input shape at load time.
   *
   * **Outputs:** exactly three `float32` tensors, in this order:
   * 1. Bounding boxes — flat `[4·N]` array of `(x1, y1, x2, y2)` coordinates in model-input
   *    pixel space, repeated for N detections.
   * 2. Confidence scores — flat `[N]` array of values in `[0, 1]`.
   * 3. Class indices — flat `[N]` array of `float32`-encoded integer class indices
   *    (0-based, matching the order of entries in your `labelMap`).
   *
   * Preprocessing (resize → normalize) and postprocessing (coordinate rescaling, threshold
   * filtering, NMS) are handled by the native runtime — your model only needs to produce
   * the raw detections above.
   *
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param config - A {@link ObjectDetectionConfig} object with the label map and optional preprocessing parameters.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to an `ObjectDetectionModule` instance typed to the provided label map.
   */
  static async fromCustomModel<L extends LabelEnum>(
    modelSource: ResourceSource,
    config: ObjectDetectionConfig<L>,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ObjectDetectionModule<L>> {
    const normMean = config.preprocessorConfig?.normMean ?? [];
    const normStd = config.preprocessorConfig?.normStd ?? [];
    const allLabelNames: string[] = [];
    for (const [name, value] of Object.entries(config.labelMap)) {
      if (typeof value === 'number') allLabelNames[value] = name;
    }
    for (let i = 0; i < allLabelNames.length; i++) {
      if (allLabelNames[i] == null) allLabelNames[i] = '';
    }
    const modelPath = await fetchModelPath(modelSource, onDownloadProgress);
    const nativeModule = await global.loadObjectDetection(
      modelPath,
      normMean,
      normStd,
      allLabelNames
    );
    return new ObjectDetectionModule<L>(
      config.labelMap as ResolveLabels<L>,
      nativeModule
    );
  }
}
