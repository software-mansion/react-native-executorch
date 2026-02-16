import { RnExecutorchError } from '../errors/errorUtils';
import { ResourceSource } from './common';

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
 * COCO 91-class labels used by RF-DETR segmentation models.
 * Indices match the model's 91 output channels.
 *
 * @category Types
 */
export enum CocoLabel {
  BACKGROUND = 0,
  PERSON = 1,
  BICYCLE = 2,
  CAR = 3,
  MOTORCYCLE = 4,
  AIRPLANE = 5,
  BUS = 6,
  TRAIN = 7,
  TRUCK = 8,
  BOAT = 9,
  TRAFFIC_LIGHT = 10,
  FIRE_HYDRANT = 11,
  _RESERVED_12 = 12,
  STOP_SIGN = 13,
  PARKING_METER = 14,
  BENCH = 15,
  BIRD = 16,
  CAT = 17,
  DOG = 18,
  HORSE = 19,
  SHEEP = 20,
  COW = 21,
  ELEPHANT = 22,
  BEAR = 23,
  ZEBRA = 24,
  GIRAFFE = 25,
  _RESERVED_26 = 26,
  BACKPACK = 27,
  UMBRELLA = 28,
  _RESERVED_29 = 29,
  _RESERVED_30 = 30,
  HANDBAG = 31,
  TIE = 32,
  SUITCASE = 33,
  FRISBEE = 34,
  SKIS = 35,
  SNOWBOARD = 36,
  SPORTS_BALL = 37,
  KITE = 38,
  BASEBALL_BAT = 39,
  BASEBALL_GLOVE = 40,
  SKATEBOARD = 41,
  SURFBOARD = 42,
  TENNIS_RACKET = 43,
  BOTTLE = 44,
  _RESERVED_45 = 45,
  WINE_GLASS = 46,
  CUP = 47,
  FORK = 48,
  KNIFE = 49,
  SPOON = 50,
  BOWL = 51,
  BANANA = 52,
  APPLE = 53,
  SANDWICH = 54,
  ORANGE = 55,
  BROCCOLI = 56,
  CARROT = 57,
  HOT_DOG = 58,
  PIZZA = 59,
  DONUT = 60,
  CAKE = 61,
  CHAIR = 62,
  COUCH = 63,
  POTTED_PLANT = 64,
  BED = 65,
  _RESERVED_66 = 66,
  DINING_TABLE = 67,
  _RESERVED_68 = 68,
  _RESERVED_69 = 69,
  TOILET = 70,
  _RESERVED_71 = 71,
  TV = 72,
  LAPTOP = 73,
  MOUSE = 74,
  REMOTE = 75,
  KEYBOARD = 76,
  CELL_PHONE = 77,
  MICROWAVE = 78,
  OVEN = 79,
  TOASTER = 80,
  SINK = 81,
  REFRIGERATOR = 82,
  _RESERVED_83 = 83,
  BOOK = 84,
  CLOCK = 85,
  VASE = 86,
  SCISSORS = 87,
  TEDDY_BEAR = 88,
  HAIR_DRIER = 89,
  TOOTHBRUSH = 90,
}

/**
 * Props for the `useImageSegmentation` hook.
 *
 * @property {Object} model - An object containing the model source.
 * @property {ResourceSource} model.modelSource - The source of the image segmentation model binary.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 *
 * @category Types
 */
export interface ImageSegmentationProps {
  model: { modelSource: ResourceSource };
  preventLoad?: boolean;
}

/**
 * Return type for the `useImageSegmentation` hook.
 * Manages the state and operations for Computer Vision image segmentation (e.g., DeepLab).
 *
 * @category Types
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
   * @param resizeToInput - an optional boolean to indicate whether the output should be resized to the original input image dimensions. If `false`, returns the model output without any resizing (see section "Running the model"). Defaults to `true`.
   * @returns A Promise that resolves to an object mapping each detected `DeeplabLabel` to its corresponding segmentation mask (represented as a flattened array of numbers).
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another image.
   */
  forward: (
    imageSource: string,
    classesOfInterest?: DeeplabLabel[],
    resizeToInput?: boolean
  ) => Promise<Partial<Record<DeeplabLabel, number[]>>>;
}
