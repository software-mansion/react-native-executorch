import { LabelEnum, PixelData, ResourceSource } from '../../types/common';
import {
  ClassificationConfig,
  ClassificationModelName,
  ClassificationModelSources,
} from '../../types/classification';
import { Imagenet1kLabel } from '../../constants/classification';
import {
  fetchModelPath,
  ResolveLabels as ResolveLabelsFor,
  VisionLabeledModule,
} from './VisionLabeledModule';

const ModelConfigs = {
  'efficientnet-v2-s': {
    labelMap: Imagenet1kLabel,
  },
  'efficientnet-v2-s-quantized': {
    labelMap: Imagenet1kLabel,
  },
} as const satisfies Record<
  ClassificationModelName,
  ClassificationConfig<LabelEnum>
>;

type ModelConfigsType = typeof ModelConfigs;

/**
 * Resolves the {@link LabelEnum} for a given built-in classification model name.
 * @typeParam M - A built-in model name from {@link ClassificationModelName}.
 * @category Types
 */
export type ClassificationLabels<M extends ClassificationModelName> =
  ResolveLabelsFor<M, ModelConfigsType>;

type ModelNameOf<C extends ClassificationModelSources> = C['modelName'];

/** @internal */
type ResolveLabels<T extends ClassificationModelName | LabelEnum> =
  ResolveLabelsFor<T, ModelConfigsType>;

/**
 * Generic classification module with type-safe label maps.
 * @typeParam T - Either a built-in model name (e.g. `'efficientnet-v2-s'`)
 *   or a custom {@link LabelEnum} label map.
 * @category Typescript API
 */
export class ClassificationModule<
  T extends ClassificationModelName | LabelEnum,
> extends VisionLabeledModule<
  Record<keyof ResolveLabels<T>, number>,
  ResolveLabels<T>
> {
  private constructor(labelMap: ResolveLabels<T>, nativeModule: unknown) {
    super(labelMap, nativeModule);
  }

  /**
   * Creates a classification instance for a built-in model.
   * @param namedSources - A {@link ClassificationModelSources} object specifying which model to load and where to fetch it from.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `ClassificationModule` instance typed to the chosen model's label map.
   */
  static async fromModelName<C extends ClassificationModelSources>(
    namedSources: C,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ClassificationModule<ModelNameOf<C>>> {
    const { modelSource } = namedSources;
    const { labelMap, preprocessorConfig } = ModelConfigs[
      namedSources.modelName
    ] as ClassificationConfig<LabelEnum>;
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
    const nativeModule = await global.loadClassification(
      modelPath,
      normMean,
      normStd,
      allLabelNames
    );
    return new ClassificationModule<ModelNameOf<C>>(
      labelMap as ResolveLabels<ModelNameOf<C>>,
      nativeModule
    );
  }

  /**
   * Creates a classification instance with a user-provided model binary and label map.
   * Use this when working with a custom-exported model that is not one of the built-in presets.
   *
   * ## Required model contract
   *
   * The `.pte` model binary must expose a single `forward` method with the following interface:
   *
   * **Input:** one `float32` tensor of shape `[1, 3, H, W]` — a single RGB image, values in
   * `[0, 1]` after optional per-channel normalization `(pixel − mean) / std`.
   * H and W are read from the model's declared input shape at load time.
   *
   * **Output:** one `float32` tensor of shape `[1, C]` containing raw logits — one value per class,
   * in the same order as the entries in your `labelMap`. Softmax is applied by the native runtime.
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param config - A {@link ClassificationConfig} object with the label map and optional preprocessing parameters.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to a `ClassificationModule` instance typed to the provided label map.
   */
  static async fromCustomModel<L extends LabelEnum>(
    modelSource: ResourceSource,
    config: ClassificationConfig<L>,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ClassificationModule<L>> {
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
    const nativeModule = await global.loadClassification(
      modelPath,
      normMean,
      normStd,
      allLabelNames
    );
    return new ClassificationModule<L>(
      config.labelMap as ResolveLabels<L>,
      nativeModule
    );
  }

  /**
   * Executes the model's forward pass to classify the provided image.
   * @param input - A string image source (file path, URI, or Base64) or a {@link PixelData} object.
   * @returns A Promise resolving to an object mapping label keys to confidence scores.
   */
  override async forward(
    input: string | PixelData
  ): Promise<Record<keyof ResolveLabels<T>, number>> {
    return super.forward(input);
  }
}
