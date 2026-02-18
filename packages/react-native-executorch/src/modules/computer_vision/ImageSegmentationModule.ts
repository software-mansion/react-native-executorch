import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource, LabelEnum } from '../../types/common';
import {
  DeeplabLabel,
  ModelNameOf,
  ModelSources,
  SegmentationConfig,
  SegmentationModelName,
  SelfieSegmentationLabel,
} from '../../types/imageSegmentation';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError } from '../../errors/errorUtils';
import { BaseModule } from '../BaseModule';

const ModelConfigs: Record<
  SegmentationModelName,
  SegmentationConfig<LabelEnum>
> = {
  'deeplab-v3': {
    labelMap: DeeplabLabel,
    preprocessorConfig: undefined,
  },
  'selfie-segmentation': {
    labelMap: SelfieSegmentationLabel,
    preprocessorConfig: undefined,
  },
} as const;

/** @internal */
type ModelConfigsType = typeof ModelConfigs;

/**
 * Resolves the {@link LabelEnum} for a given built-in model name.
 *
 * @typeParam M - A built-in model name from {@link SegmentationModelName}.
 *
 * @category Types
 */
export type SegmentationLabels<M extends SegmentationModelName> =
  ModelConfigsType[M]['labelMap'];

/**
 * @internal
 * Resolves the label type: if `T` is a {@link SegmentationModelName}, looks up its labels
 * from the built-in config; otherwise uses `T` directly as a {@link LabelEnum}.
 */
type ResolveLabels<T extends SegmentationModelName | LabelEnum> =
  T extends SegmentationModelName ? SegmentationLabels<T> : T;

/**
 * Generic image segmentation module with type-safe label maps.
 * Use a model name (e.g. `'deeplab-v3'`) as the generic parameter for built-in models,
 * or a custom label enum for custom configs.
 *
 * @typeParam T - Either a built-in model name (`'deeplab-v3'`, `'selfie-segmentation'`)
 *   or a custom {@link LabelEnum} label map.
 *
 * @category Typescript API
 */
export class ImageSegmentationModule<
  T extends SegmentationModelName | LabelEnum,
> extends BaseModule {
  private labelMap: ResolveLabels<T>;
  private allClassNames: string[];

  private constructor(labelMap: ResolveLabels<T>, nativeModule: unknown) {
    super();
    this.labelMap = labelMap;
    this.allClassNames = Object.keys(this.labelMap).filter((k) =>
      isNaN(Number(k))
    );
    this.nativeModule = nativeModule;
  }

  // TODO: figure it out so we can delete this (we need this because of basemodule inheritance)
  override async load() {}

  /**
   * Creates a segmentation instance for a built-in model.
   * The config object is discriminated by `modelName` — each model can require different fields.
   *
   * @param config - A {@link ModelSources} object specifying which model to load and where to fetch it from.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to an `ImageSegmentationModule` instance typed to the chosen model's label map.
   *
   * @example
   * ```ts
   * const segmentation = await ImageSegmentationModule.fromModelName({
   *   modelName: 'deeplab-v3',
   *   modelSource: 'https://example.com/deeplab.pte',
   * });
   * ```
   */
  static async fromModelName<C extends ModelSources>(
    config: C,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ImageSegmentationModule<ModelNameOf<C>>> {
    const { modelName, modelSource } = config;
    const { labelMap, preprocessorConfig } = ModelConfigs[modelName];
    const normMean = preprocessorConfig?.normMean ?? [];
    const normStd = preprocessorConfig?.normStd ?? [];
    const paths = await ResourceFetcher.fetch(onDownloadProgress, modelSource);
    if (!paths?.[0]) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'The download has been interrupted. Please retry.'
      );
    }
    const nativeModule = global.loadImageSegmentation(
      paths[0],
      normMean,
      normStd
    );
    return new ImageSegmentationModule<ModelNameOf<C>>(
      labelMap as ResolveLabels<ModelNameOf<C>>,
      nativeModule
    );
  }

  /**
   * Creates a segmentation instance with a user-provided label map and custom config.
   * Use this when working with a custom-exported segmentation model that is not one of the built-in models.
   *
   * @param modelSource - A fetchable resource pointing to the model binary.
   * @param config - A {@link SegmentationConfig} object with the label map and optional preprocessing parameters.
   * @param onDownloadProgress - Optional callback to monitor download progress, receiving a value between 0 and 1.
   * @returns A Promise resolving to an `ImageSegmentationModule` instance typed to the provided label map.
   *
   * @example
   * ```ts
   * const MyLabels = { BACKGROUND: 0, FOREGROUND: 1 } as const;
   * const segmentation = await ImageSegmentationModule.fromCustomConfig(
   *   'https://example.com/custom_model.pte',
   *   { labelMap: MyLabels },
   * );
   * ```
   */
  static async fromCustomConfig<L extends LabelEnum>(
    modelSource: ResourceSource,
    config: SegmentationConfig<L>,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ImageSegmentationModule<L>> {
    const paths = await ResourceFetcher.fetch(onDownloadProgress, modelSource);
    if (!paths?.[0]) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'The download has been interrupted. Please retry.'
      );
    }
    const normMean = config.preprocessorConfig?.normMean ?? [];
    const normStd = config.preprocessorConfig?.normStd ?? [];
    const nativeModule = global.loadImageSegmentation(
      paths[0],
      normMean,
      normStd
    );
    return new ImageSegmentationModule<L>(
      config.labelMap as ResolveLabels<L>,
      nativeModule
    );
  }

  /**
   * Executes the model's forward pass to perform semantic segmentation on the provided image.
   *
   * @param imageSource - A string representing the image source (e.g., a file path, URI, or Base64-encoded string).
   * @param classesOfInterest - An optional list of label keys indicating which per-class probability masks to include in the output. `ARGMAX` is always returned regardless.
   * @param resizeToInput - Whether to resize the output masks to the original input image dimensions. If `false`, returns the raw model output dimensions. Defaults to `true`.
   * @returns A Promise resolving to an object with an `'ARGMAX'` key mapped to an `Int32Array` of per-pixel class indices, and each requested class label mapped to a `Float32Array` of per-pixel probabilities.
   * @throws {RnExecutorchError} If the model is not loaded.
   */
  async forward<K extends keyof ResolveLabels<T>>(
    imageSource: string,
    classesOfInterest: K[] = [],
    resizeToInput: boolean = true
  ): Promise<Record<'ARGMAX', Int32Array> & Record<K, Float32Array>> {
    if (this.nativeModule == null) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded.'
      );
    }

    const classesOfInterestNames = classesOfInterest.map((label) =>
      String(label)
    );

    const nativeResult = await this.nativeModule.generate(
      imageSource,
      this.allClassNames,
      classesOfInterestNames,
      resizeToInput
    );

    return nativeResult as Record<'ARGMAX', Int32Array> &
      Record<K, Float32Array>;
  }
}
