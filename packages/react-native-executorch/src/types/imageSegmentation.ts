import { RnExecutorchError } from '../errors/errorUtils';
import { LabelEnum, Triple, ResourceSource, PixelData, Frame } from './common';

/**
 * Configuration for a custom segmentation model.
 *
 * @typeParam T - The {@link LabelEnum} type for the model.
 * @property labelMap - The enum-like object mapping class names to indices.
 * @property preprocessorConfig - Optional preprocessing parameters.
 * @property preprocessorConfig.normMean - Per-channel mean values for input normalization.
 * @property preprocessorConfig.normStd - Per-channel standard deviation values for input normalization.
 *
 * @category Types
 */
export type SegmentationConfig<T extends LabelEnum> = {
  labelMap: T;
  preprocessorConfig?: { normMean?: Triple<number>; normStd?: Triple<number> };
};

/**
 * Per-model config for {@link ImageSegmentationModule.fromModelName}.
 * Each model name maps to its required fields.
 * Add new union members here when a model needs extra sources or options.
 *
 * @category Types
 */
export type ModelSources =
  | { modelName: 'deeplab-v3'; modelSource: ResourceSource }
  | { modelName: 'selfie-segmentation'; modelSource: ResourceSource };

/**
 * Union of all built-in segmentation model names
 * (e.g. `'deeplab-v3'`, `'selfie-segmentation'`).
 *
 * @category Types
 */
export type SegmentationModelName = ModelSources['modelName'];

/**
 * Extracts the model name from a {@link ModelSources} config object.
 *
 * @category Types
 */
export type ModelNameOf<C extends ModelSources> = C['modelName'];

/**
 * Labels used in the DeepLab image segmentation model.
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
 * Labels used in the selfie image segmentation model.
 *
 * @category Types
 */
export enum SelfieSegmentationLabel {
  SELFIE,
  BACKGROUND,
}

/**
 * Props for the `useImageSegmentation` hook.
 *
 * @typeParam C - A {@link ModelSources} config specifying which built-in model to load.
 * @property model - The model config containing `modelName` and `modelSource`.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 *
 * @category Types
 */
export interface ImageSegmentationProps<C extends ModelSources> {
  model: C;
  preventLoad?: boolean;
}

/**
 * Return type for the `useImageSegmentation` hook.
 * Manages the state and operations for image segmentation models.
 *
 * @typeParam L - The {@link LabelEnum} representing the model's class labels.
 *
 * @category Types
 */
export interface ImageSegmentationType<L extends LabelEnum> {
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
   *
   * Supports two input types:
   * 1. **String path/URI**: File path, URL, or Base64-encoded string
   * 2. **PixelData**: Raw pixel data from image libraries (e.g., NitroImage)
   *
   * **Note**: For VisionCamera frame processing, use `runOnFrame` instead.
   *
   * @param input - Image source (string or PixelData object)
   * @param classesOfInterest - An optional array of label keys indicating which per-class probability masks to include in the output. `ARGMAX` is always returned regardless.
   * @param resizeToInput - Whether to resize the output masks to the original input image dimensions. If `false`, returns the raw model output dimensions. Defaults to `true`.
   * @returns A Promise resolving to an object with an `'ARGMAX'` `Int32Array` of per-pixel class indices, and each requested class label mapped to a `Float32Array` of per-pixel probabilities.
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another image.
   */
  forward: <K extends keyof L>(
    input: string | PixelData,
    classesOfInterest?: K[],
    resizeToInput?: boolean
  ) => Promise<Record<'ARGMAX', Int32Array> & Record<K, Float32Array>>;

  /**
   * Synchronous worklet function for real-time VisionCamera frame processing.
   * Automatically handles native buffer extraction and cleanup.
   *
   * **Use this for VisionCamera frame processing in worklets.**
   * For async processing, use `forward()` instead.
   *
   * Available after model is loaded (`isReady: true`).
   *
   * @param frame - VisionCamera Frame object
   * @param classesOfInterest - Labels for which to return per-class probability masks.
   * @param resizeToInput - Whether to resize masks to original frame dimensions. Defaults to `true`.
   * @returns Object with `ARGMAX` Int32Array and per-class Float32Array masks.
   */
  runOnFrame:
    | ((
        frame: Frame,
        classesOfInterest?: string[],
        resizeToInput?: boolean
      ) => Record<'ARGMAX', Int32Array> & Record<string, Float32Array>)
    | null;
}
