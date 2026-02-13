import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ResourceSource } from '../../types/common';
import { DeeplabLabel } from '../../types/imageSegmentation';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';
import { RnExecutorchError } from '../../errors/errorUtils';

type Enumish = Record<string, number | string>;

type SegmentationConfig<T extends Enumish = Enumish> = {
  labelMap: T;
};

const ModelConfigs = {
  'deeplab-v3': {
    labelMap: DeeplabLabel,
    loader: (path: string) => global.loadImageSegmentation(path),
  },
  'selfie-segmentation': {
    labelMap: { background: 0, object: 1 },
    loader: (path: string) => global.loadImageSegmentation(path),
  },
  'rfdetr': {
    labelMap: DeeplabLabel,
    loader: (path: string) => global.loadImageSegmentation(path),
  },
} as const;

type ModelConfigsType = typeof ModelConfigs;
type ModelName = keyof ModelConfigsType;

export type SegmentationLabels<M extends ModelName> =
  ModelConfigsType[M]['labelMap'];

/**
 * Generic image segmentation module with type-safe label maps.
 */
export class ImageSegmentation<T extends Enumish = Enumish> {
  private labelMap: T;
  private nativeModule: any;

  private constructor(labelMap: T, nativeModule: unknown) {
    this.labelMap = labelMap;
    this.nativeModule = nativeModule;
  }

  /**
   * Creates a segmentation instance for a known model.
   * The config object is strictly typed based on the modelName provided.
   */
  static async fromModelName<N extends ModelName>(
    modelSource: ResourceSource,
    modelName: N,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ImageSegmentation<ModelConfigsType[N]['labelMap']>> {
    const { labelMap, loader } = ModelConfigs[modelName];
    const paths = await ResourceFetcher.fetch(onDownloadProgress, modelSource);
    if (paths === null || paths.length < 1) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'The download has been interrupted. Please retry.'
      );
    }
    const nativeModule = loader(paths[0] || '');
    return new ImageSegmentation(labelMap, nativeModule);
  }

  /**
   * Creates a segmentation instance with a user-provided label map and custom config.
   */
  static async fromCustomConfig<T extends Enumish>(
    modelSource: ResourceSource,
    config: SegmentationConfig<T>,
    onDownloadProgress: (progress: number) => void = () => {}
  ): Promise<ImageSegmentation<T>> {
    const paths = await ResourceFetcher.fetch(onDownloadProgress, modelSource);
    if (paths === null || paths.length < 1) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.DownloadInterrupted,
        'The download has been interrupted. Please retry.'
      );
    }
    const nativeModule = global.loadImageSegmentation(paths[0] || '');
    return new ImageSegmentation(config.labelMap, nativeModule);
  }

  /**
   * Executes the model's forward pass.
   */
  async forward(
    imageSource: string,
    classesOfInterest: (keyof T)[] = [],
    resizeToInput: boolean = true
  ): Promise<Partial<Record<keyof T, number[]>>> {
    if (this.nativeModule == null) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded.'
      );
    }

    const classNames = classesOfInterest.map((label) => String(label));

    const nativeResult = await this.nativeModule.generate(
      imageSource,
      classNames,
      resizeToInput
    );

    const result: Partial<Record<keyof T, number[]>> = {};
    for (const [key, maskData] of Object.entries(nativeResult)) {
      if (key in this.labelMap) {
        result[key as keyof T] = maskData as number[];
      }
    }
    return result;
  }

  /**
   * Unloads the model from memory.
   */
  delete() {
    if (this.nativeModule != null) {
      this.nativeModule.unload();
    }
  }
}

// Type tests

// async function _typeTests() {
//   const deeplab = await ImageSegmentation.fromModelName('https://example.com/model.pte', 'deeplab-v3');
//   const deeplabResult = await deeplab.forward('image.jpg', ['PERSON', 'CAR', 'ARGMAX']);
//   deeplabResult.PERSON;    // OK
//   deeplabResult.CAR;       // OK
//   // ERROR: 'BANANA' is not a DeeplabLabel key
//   deeplabResult.BANANA;
//
//   // fromModelName: selfie-segmentation — should autocomplete 'background' | 'object'
//   const selfie = await ImageSegmentation.fromModelName('https://example.com/model.pte', 'selfie-segmentation');
//   const selfieResult = await selfie.forward('image.jpg', ['background']);
//   selfieResult.background; // OK
//   selfieResult.object;     // OK
//   // ERROR: 'PERSON' is not a selfie-segmentation key
//   selfieResult.PERSON;
//
//   // fromCustomConfig: custom labels — should infer from provided map
//   const custom = await ImageSegmentation.fromCustomConfig('https://example.com/model.pte', {
//     labelMap: { sky: 0, ground: 1, building: 2 } as const,
//   });
//   const customResult = await custom.forward('image.jpg', ['sky', 'ground']);
//   customResult.sky;        // OK
//   customResult.building;   // OK
//   // 'water' is not in the custom label map
//   customResult.water;
//
//   // ERORR: 'nonexistent-model' is not a known model name
//   await ImageSegmentation.fromModelName('https://example.com/model.pte', 'nonexistent-model');
//
//   // forward classesOfInterest should only accept valid keys
//   // 'INVALID' is not a DeeplabLabel key
//   await deeplab.forward('image.jpg', ['INVALID']);
// }
