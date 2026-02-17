import { LabelEnum, Triple, ResourceSource } from './common';

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
  | { modelName: 'selfie-segmentation'; modelSource: ResourceSource }
  | { modelName: 'rfdetr'; modelSource: ResourceSource };

/**
 * Union of all built-in segmentation model names
 * (e.g. `'deeplab-v3'`, `'selfie-segmentation'`, `'rfdetr'`).
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
