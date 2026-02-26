import { RnExecutorchError } from '../errors/errorUtils';
import { LabelEnum, Triple, ResourceSource } from './common';

/**
 * Configuration for a custom semantic segmentation model.
 *
 * @typeParam T - The {@link LabelEnum} type for the model.
 * @property labelMap - The enum-like object mapping class names to indices.
 * @property preprocessorConfig - Optional preprocessing parameters.
 * @property preprocessorConfig.normMean - Per-channel mean values for input normalization.
 * @property preprocessorConfig.normStd - Per-channel standard deviation values for input normalization.
 *
 * @category Types
 */
export type SemanticSegmentationConfig<T extends LabelEnum> = {
  labelMap: T;
  preprocessorConfig?: { normMean?: Triple<number>; normStd?: Triple<number> };
};

/**
 * Per-model config for {@link SemanticSegmentationModule.fromModelName}.
 * Each model name maps to its required fields.
 * Add new union members here when a model needs extra sources or options.
 *
 * @category Types
 */
export type SemanticSegmentationModelSources =
  | { modelName: 'deeplab-v3-resnet50'; modelSource: ResourceSource }
  | { modelName: 'deeplab-v3-resnet101'; modelSource: ResourceSource }
  | { modelName: 'deeplab-v3-mobilenet-v3-large'; modelSource: ResourceSource }
  | { modelName: 'lraspp-mobilenet-v3-large'; modelSource: ResourceSource }
  | { modelName: 'fcn-resnet50'; modelSource: ResourceSource }
  | { modelName: 'fcn-resnet101'; modelSource: ResourceSource }
  | { modelName: 'deeplab-v3-resnet50-quantized'; modelSource: ResourceSource }
  | { modelName: 'deeplab-v3-resnet101-quantized'; modelSource: ResourceSource }
  | {
      modelName: 'deeplab-v3-mobilenet-v3-large-quantized';
      modelSource: ResourceSource;
    }
  | {
      modelName: 'lraspp-mobilenet-v3-large-quantized';
      modelSource: ResourceSource;
    }
  | { modelName: 'fcn-resnet50-quantized'; modelSource: ResourceSource }
  | { modelName: 'fcn-resnet101-quantized'; modelSource: ResourceSource }
  | { modelName: 'selfie-segmentation'; modelSource: ResourceSource };

/**
 * Union of all built-in semantic segmentation model names
 * (e.g. `'deeplab-v3-resnet50'`, `'selfie-segmentation'`).
 *
 * @category Types
 */
export type SemanticSegmentationModelName =
  SemanticSegmentationModelSources['modelName'];

/**
 * Extracts the model name from a {@link SemanticSegmentationModelSources} config object.
 *
 * @category Types
 */
export type ModelNameOf<C extends SemanticSegmentationModelSources> =
  C['modelName'];

/**
 * Labels used in the DeepLab semantic segmentation model.
 *
 * @category Types
 */
export enum DeeplabLabel {
  BACKGROUND,
  AEROPLANE,
  BICYCLE,
  BIRD,
  BOAT,
  BOTTLE,
  BUS,
  CAR,
  CAT,
  CHAIR,
  COW,
  DININGTABLE,
  DOG,
  HORSE,
  MOTORBIKE,
  PERSON,
  POTTEDPLANT,
  SHEEP,
  SOFA,
  TRAIN,
  TVMONITOR,
}

/**
 * Labels used in the selfie semantic segmentation model.
 *
 * @category Types
 */
export enum SelfieSegmentationLabel {
  SELFIE,
  BACKGROUND,
}

/**
 * Props for the `useSemanticSegmentation` hook.
 *
 * @typeParam C - A {@link SemanticSegmentationModelSources} config specifying which built-in model to load.
 * @property model - The model config containing `modelName` and `modelSource`.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 *
 * @category Types
 */
export interface SemanticSegmentationProps<
  C extends SemanticSegmentationModelSources,
> {
  model: C;
  preventLoad?: boolean;
}

/**
 * Return type for the `useSemanticSegmentation` hook.
 * Manages the state and operations for semantic segmentation models.
 *
 * @typeParam L - The {@link LabelEnum} representing the model's class labels.
 *
 * @category Types
 */
export interface SemanticSegmentationType<L extends LabelEnum> {
  /**
   * Contains the error object if the model failed to load, download, or encountered a runtime error during segmentation.
   */
  error: RnExecutorchError | null;

  /**
   * Indicates whether the segmentation model is loaded and ready to process images.
   */
  isReady: boolean;

  /**
   * Indicates whether the model is currently processing an image.
   */
  isGenerating: boolean;

  /**
   * Represents the download progress of the model binary as a value between 0 and 1.
   */
  downloadProgress: number;

  /**
   * Executes the model's forward pass to perform semantic segmentation on the provided image.
   * @param imageSource - A string representing the image source (e.g., a file path, URI, or base64 string) to be processed.
   * @param classesOfInterest - An optional array of label keys indicating which per-class probability masks to include in the output. `ARGMAX` is always returned regardless.
   * @param resizeToInput - Whether to resize the output masks to the original input image dimensions. If `false`, returns the raw model output dimensions. Defaults to `true`.
   * @returns A Promise resolving to an object with an `'ARGMAX'` `Int32Array` of per-pixel class indices, and each requested class label mapped to a `Float32Array` of per-pixel probabilities.
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another image.
   */
  forward: <K extends keyof L>(
    imageSource: string,
    classesOfInterest?: K[],
    resizeToInput?: boolean
  ) => Promise<Record<'ARGMAX', Int32Array> & Record<K, Float32Array>>;
}
