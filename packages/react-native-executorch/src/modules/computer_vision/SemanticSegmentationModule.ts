import { ResourceSource, LabelEnum, PixelData } from '../../types/common';
import {
  DeeplabLabel,
  ModelNameOf,
  SemanticSegmentationModelSources,
  SemanticSegmentationConfig,
  SemanticSegmentationModelName,
  SelfieSegmentationLabel,
} from '../../types/semanticSegmentation';
import { IMAGENET1K_MEAN, IMAGENET1K_STD } from '../../constants/commonVision';
import {
  fetchModelPath,
  ResolveLabels as ResolveLabelsFor,
  VisionLabeledModule,
} from './VisionLabeledModule';

const PascalVocSegmentationConfig = {
  labelMap: DeeplabLabel,
  preprocessorConfig: {
    normMean: IMAGENET1K_MEAN,
    normStd: IMAGENET1K_STD,
  },
};
const ModelConfigs = {
  'deeplab-v3-resnet50': PascalVocSegmentationConfig,
  'deeplab-v3-resnet101': PascalVocSegmentationConfig,
  'deeplab-v3-mobilenet-v3-large': PascalVocSegmentationConfig,
  'lraspp-mobilenet-v3-large': PascalVocSegmentationConfig,
  'fcn-resnet50': PascalVocSegmentationConfig,
  'fcn-resnet101': PascalVocSegmentationConfig,
  'deeplab-v3-resnet50-quantized': PascalVocSegmentationConfig,
  'deeplab-v3-resnet101-quantized': PascalVocSegmentationConfig,
  'deeplab-v3-mobilenet-v3-large-quantized': PascalVocSegmentationConfig,
  'lraspp-mobilenet-v3-large-quantized': PascalVocSegmentationConfig,
  'fcn-resnet50-quantized': PascalVocSegmentationConfig,
  'fcn-resnet101-quantized': PascalVocSegmentationConfig,
  'selfie-segmentation': {
    labelMap: SelfieSegmentationLabel,
    preprocessorConfig: undefined,
  },
} as const satisfies Record<
  SemanticSegmentationModelName,
  SemanticSegmentationConfig<LabelEnum>
>;

/** @internal */
type ModelConfigsType = typeof ModelConfigs;

/**
 * Resolves the {@link LabelEnum} for a given built-in model name.
 *
 * @typeParam M - A built-in model name from {@link SemanticSegmentationModelName}.
 *
 * @category Types
 */
export type SegmentationLabels<M extends SemanticSegmentationModelName> =
  ModelConfigsType[M]['labelMap'];

/** @internal */
type ResolveLabels<T extends SemanticSegmentationModelName | LabelEnum> =
  ResolveLabelsFor<T, ModelConfigsType>;

/**
 * Generic semantic segmentation module with type-safe label maps.
 * Use a model name (e.g. `'deeplab-v3'`) as the generic parameter for built-in models,
 * or a custom label enum for custom configs.
 *
 * @typeParam T - Either a built-in model name (`'deeplab-v3-resnet50'`,
 *   `'deeplab-v3-resnet50-quantized'`, `'deeplab-v3-resnet101'`,
 *   `'deeplab-v3-resnet101-quantized'`, `'deeplab-v3-mobilenet-v3-large'`,
 *   `'deeplab-v3-mobilenet-v3-large-quantized'`, `'lraspp-mobilenet-v3-large'`,
 *   `'lraspp-mobilenet-v3-large-quantized'`, `'fcn-resnet50'`,
 *   `'fcn-resnet50-quantized'`, `'fcn-resnet101'`, `'fcn-resnet101-quantized'`,
 *   `'selfie-segmentation'`) or a custom {@link LabelEnum} label map.
 *
 * @category Typescript API
 */
export class SemanticSegmentationModule<
  T extends SemanticSegmentationModelName | LabelEnum,
> extends VisionLabeledModule<
  Record<'ARGMAX', Int32Array> & Record<keyof ResolveLabels<T>, Float32Array>,
  ResolveLabels<T>
> {
  private constructor(labelMap: ResolveLabels<T>, nativeModule: unknown) {
    super(labelMap, nativeModule);
  }

  /**
   * Creates a segmentation instance for a built-in model.
   * The config object is discriminated by `modelName` — each model can require different fields.
   *
   * @param namedSources - A {@link SemanticSegmentationModelSources} object specifying which model to load and where to fetch it from.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `SemanticSegmentationModule` instance typed to the chosen model's label map.
   *
   * @example
   * ```ts
   * const segmentation = await SemanticSegmentationModule.fromModelName(DEEPLAB_V3_RESNET50);
   * ```
   */

  static async fromModelName<C extends SemanticSegmentationModelSources>(
    namedSources: C,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<SemanticSegmentationModule<ModelNameOf<C>>> {
    const { modelName, modelSource } = namedSources;
    const { labelMap } = ModelConfigs[modelName];
    const { preprocessorConfig } = ModelConfigs[
      modelName
    ] as SemanticSegmentationConfig<LabelEnum>;
    const normMean = preprocessorConfig?.normMean ?? [];
    const normStd = preprocessorConfig?.normStd ?? [];
    const allClassNames = Object.keys(labelMap).filter((k) => isNaN(Number(k)));
    const modelPath = await fetchModelPath(modelSource, onDownloadProgress);
    const nativeModule = await global.loadSemanticSegmentation(
      modelPath,
      normMean,
      normStd,
      allClassNames
    );
    return new SemanticSegmentationModule<ModelNameOf<C>>(
      labelMap as ResolveLabels<ModelNameOf<C>>,
      nativeModule
    );
  }

  /**
   * Creates a segmentation instance with a user-provided model binary and label map.
   * Use this when working with a custom-exported segmentation model that is not one of the built-in models.
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
   * **Output:** one `float32` tensor of shape `[1, C, H_out, W_out]` (NCHW) containing raw
   * logits — one channel per class, in the same order as the entries in your `labelMap`.
   * For binary segmentation a single-channel output is also supported: channel 0 is treated
   * as the foreground probability and a synthetic background channel is added automatically.
   *
   * Preprocessing (resize → normalize) and postprocessing (softmax, argmax, resize back to
   * original dimensions) are handled by the native runtime.
   *
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param config - A {@link SemanticSegmentationConfig} object with the label map and optional preprocessing parameters.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `SemanticSegmentationModule` instance typed to the provided label map.
   *
   * @example
   * ```ts
   * const MyLabels = { BACKGROUND: 0, FOREGROUND: 1 } as const;
   * const segmentation = await SemanticSegmentationModule.fromCustomModel(
   *   'https://example.com/custom_model.pte',
   *   { labelMap: MyLabels },
   * );
   * ```
   */
  static async fromCustomModel<L extends LabelEnum>(
    modelSource: ResourceSource,
    config: SemanticSegmentationConfig<L>,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<SemanticSegmentationModule<L>> {
    const normMean = config.preprocessorConfig?.normMean ?? [];
    const normStd = config.preprocessorConfig?.normStd ?? [];
    const allClassNames = Object.keys(config.labelMap).filter((k) =>
      isNaN(Number(k))
    );
    const modelPath = await fetchModelPath(modelSource, onDownloadProgress);
    const nativeModule = await global.loadSemanticSegmentation(
      modelPath,
      normMean,
      normStd,
      allClassNames
    );
    return new SemanticSegmentationModule<L>(
      config.labelMap as ResolveLabels<L>,
      nativeModule
    );
  }

  /**
   * Executes the model's forward pass to perform semantic segmentation on the provided image.
   *
   * Supports two input types:
   * 1. **String path/URI**: File path, URL, or Base64-encoded string
   * 2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)
   *
   * **Note**: For VisionCamera frame processing, use `runOnFrame` instead.
   *
   * @param input - Image source (string or PixelData object)
   * @param classesOfInterest - An optional list of label keys indicating which per-class probability masks to include in the output. `ARGMAX` is always returned regardless.
   * @param resizeToInput - Whether to resize the output masks to the original input image dimensions. If `false`, returns the raw model output dimensions. Defaults to `true`.
   * @returns A Promise resolving to an object with an `'ARGMAX'` key mapped to an `Int32Array` of per-pixel class indices, and each requested class label mapped to a `Float32Array` of per-pixel probabilities.
   * @throws {RnExecutorchError} If the model is not loaded.
   */
  override async forward<K extends keyof ResolveLabels<T>>(
    input: string | PixelData,
    classesOfInterest: K[] = [],
    resizeToInput: boolean = true
  ): Promise<Record<'ARGMAX', Int32Array> & Record<K, Float32Array>> {
    const classesOfInterestNames = classesOfInterest.map(String);
    return super.forward(input, classesOfInterestNames, resizeToInput);
  }
}
