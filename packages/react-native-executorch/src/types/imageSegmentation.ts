import { RnExecutorchError } from "../errors/errorUtils";
import { ResourceSource } from "./common";

/* eslint-disable @cspell/spellchecker */
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
  ARGMAX, // Additional label not present in the model
}

/**
 * Props for the `useImageSegmentation` hook.
 * 
 * @property {Object} model - An object containing the model source.
 * @property {ResourceSource} model.modelSource - The source of the image segmentation model binary.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 */
export interface ImageSegmentationProps {
  model: { modelSource: ResourceSource };
  preventLoad?: boolean;
}

/**
 * Return type for the `useImageSegmentation` hook.
 * Manages the state and operations for Computer Vision image segmentation (e.g., DeepLab).
 */
export interface ImageSegmentationType {
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
   * @param classesOfInterest - An optional array of `DeeplabLabel` enums. If provided, the model will only return segmentation masks for these specific classes.
   * @param resize - An optional boolean indicating whether the output segmentation masks should be resized to match the original image dimensions. Defaults to standard model behavior if undefined.
   * @returns A Promise that resolves to an object mapping each detected `DeeplabLabel` to its corresponding segmentation mask (represented as a flattened array of numbers).
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another image.
   */
  forward: (
    imageSource: string,
    classesOfInterest?: DeeplabLabel[],
    resize?: boolean
  ) => Promise<Partial<Record<DeeplabLabel, number[]>>>;
}

