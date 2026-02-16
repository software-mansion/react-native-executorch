import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { CocoLabel, DeeplabLabel } from '../../types/imageSegmentation';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError } from '../../errors/errorUtils';
import { BaseModule } from '../BaseModule';

enum SelfieSegmentationLabel {
  BACKGROUND,
  SELFIE,
}
type Enumish = Readonly<Record<string, number | string>>;
export type Triple<T> = readonly [T, T, T];

type SegmentationConfig<T extends Enumish> = {
  labelMap: T;
  preprocessorConfig?: { normMean?: Triple<number>; normStd?: Triple<number> };
};

type ForwardReturnWithArgmax<C extends Enumish> = Partial<
  Record<keyof C | 'ARGMAX', number[]>
>;

const IMAGENET_MEAN: Triple<number> = [0.485, 0.456, 0.406];
const IMAGENET_STD: Triple<number> = [0.229, 0.224, 0.225];

const ModelConfigs = {
  'deeplab-v3': {
    labelMap: DeeplabLabel,
  },
  'selfie-segmentation': {
    labelMap: SelfieSegmentationLabel,
  },
  'rfdetr': {
    labelMap: CocoLabel,
    preprocessorConfig: { normMean: IMAGENET_MEAN, normStd: IMAGENET_STD },
  },
} as const satisfies Record<string, SegmentationConfig<Enumish>>;

type ModelConfigsType = typeof ModelConfigs;
type ModelName = keyof ModelConfigsType;

export type SegmentationLabels<M extends ModelName> =
  ModelConfigsType[M]['labelMap'];

/**
 * Resolves the label type: if T is a ModelName, look up its labels; otherwise use T directly as an Enumish.
 */
type ResolveLabels<T extends ModelName | Enumish> = T extends ModelName
  ? SegmentationLabels<T>
  : T;

/**
 * Per-model config for `fromModelName`. Each model name maps to its required fields.
 * Add new union members here when a model needs extra sources or options.
 */
type ModelSources =
  | { modelName: 'deeplab-v3'; modelSource: ResourceSource }
  | { modelName: 'selfie-segmentation'; modelSource: ResourceSource }
  | { modelName: 'rfdetr'; modelSource: ResourceSource };

/**
 * Extract the model name from a config object.
 */
type ModelNameOf<C extends ModelSources> = C['modelName'];

/**
 * Generic image segmentation module with type-safe label maps.
 * Use a model name (e.g. `'deeplab-v3'`) as the generic parameter for built-in models,
 * or a custom label enum for custom configs.
 */
export class ImageSegmentation<
  T extends ModelName | Enumish,
> extends BaseModule {
  private labelMap: ResolveLabels<T>;

  private constructor(labelMap: ResolveLabels<T>, nativeModule: unknown) {
    super();
    this.labelMap = labelMap;
    this.nativeModule = nativeModule;
  }

  // TODO: figure it out so we can delete this (we need this because of basemodule inheritance)
  async load() {}

  /**
   * Creates a segmentation instance for a known model.
   * The config object is discriminated by `modelName` — each model can require different fields.
   */
  static async fromModelName<C extends ModelSources>(
    config: C,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ImageSegmentation<ModelNameOf<C>>> {
    const { modelName, modelSource } = config;
    const modelConfig = ModelConfigs[modelName];
    const { labelMap } = modelConfig;
    const preprocessorConfig =
      'preprocessorConfig' in modelConfig
        ? modelConfig.preprocessorConfig
        : undefined;
    const normMean = [...(preprocessorConfig?.normMean ?? [])];
    const normStd = [...(preprocessorConfig?.normStd ?? [])];
    const paths = await ResourceFetcher.fetch(onDownloadProgress, modelSource);
    if (paths === null || paths.length < 1) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'The download has been interrupted. Please retry.'
      );
    }
    const nativeModule = global.loadImageSegmentation(
      paths[0] || '',
      normMean,
      normStd
    );
    return new ImageSegmentation<ModelNameOf<C>>(
      labelMap as ResolveLabels<ModelNameOf<C>>,
      nativeModule
    );
  }

  /**
   * Creates a segmentation instance with a user-provided label map and custom config.
   */
  static async fromCustomConfig<L extends Enumish>(
    modelSource: ResourceSource,
    config: SegmentationConfig<L>,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ImageSegmentation<L>> {
    const paths = await ResourceFetcher.fetch(onDownloadProgress, modelSource);
    if (paths === null || paths.length < 1) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'The download has been interrupted. Please retry.'
      );
    }
    const normMean = config.preprocessorConfig?.normMean ?? [];
    const normStd = config.preprocessorConfig?.normStd ?? [];
    const nativeModule = global.loadImageSegmentation(
      paths[0] || '',
      [...normMean],
      [...normStd]
    );
    return new ImageSegmentation<L>(
      config.labelMap as ResolveLabels<L>,
      nativeModule
    );
  }

  /**
   * Executes the model's forward pass.
   */
  async forward(
    imageSource: string,
    classesOfInterest: (keyof ResolveLabels<T> | 'ARGMAX')[] = [],
    resizeToInput: boolean = true
  ): Promise<ForwardReturnWithArgmax<ResolveLabels<T>>> {
    if (this.nativeModule == null) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded.'
      );
    }

    const allClassNames = Object.keys(this.labelMap).filter((k) =>
      isNaN(Number(k))
    );
    const classesOfInterestNames = classesOfInterest.map((label) =>
      String(label)
    );

    const nativeResult = await this.nativeModule.generate(
      imageSource,
      allClassNames,
      classesOfInterestNames,
      resizeToInput
    );

    const result: ForwardReturnWithArgmax<ResolveLabels<T>> = {};
    for (const [key, maskData] of Object.entries(nativeResult)) {
      if (key in this.labelMap || key === 'ARGMAX') {
        result[key as keyof ResolveLabels<T>] = maskData as number[];
      }
    }
    return result;
  }
}
