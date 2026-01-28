import { symbols } from '../constants/ocr/symbols';
import { RnExecutorchError } from '../errors/errorUtils';
import { ResourceSource } from './common';

/**
 * OCRDetection represents a single detected text instance in an image,
 * including its bounding box, recognized text, and confidence score.
 * 
 * @category Types
 * @property {Point[]} bbox - An array of points defining the bounding box around the detected text.
 * @property {string} text - The recognized text within the bounding box.
 * @property {number} score - The confidence score of the OCR detection, ranging from 0 to 1.
 */
export interface OCRDetection {
  bbox: Point[];
  text: string;
  score: number;
}

/**
 * Point represents a coordinate in 2D space.
 * 
 * @category Types
 * @property {number} x - The x-coordinate of the point.
 * @property {number} y - The y-coordinate of the point.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Configuration properties for the `useOCR` hook.
 * 
 * @category Types
 */
export interface OCRProps {
  /**
   * Object containing the necessary model sources and configuration for the OCR pipeline.
   */
  model: {
    /**
     * `ResourceSource` that specifies the location of the text detector model binary.
     */
    detectorSource: ResourceSource;

    /**
     * `ResourceSource` that specifies the location of the text recognizer model binary.
     */
    recognizerSource: ResourceSource;

    /**
     * The language configuration enum for the OCR model (e.g., English, Polish, etc.).
     */
    language: OCRLanguage;
  };

  /**
   * Boolean that can prevent automatic model loading (and downloading the data if loaded for the first time) after running the hook.
   * Defaults to `false`.
   */
  preventLoad?: boolean;
}

/**
 * Configuration properties for the `useVerticalOCR` hook.
 * 
 * @category Types
 */
export interface VerticalOCRProps extends OCRProps {
  /**
   * Boolean indicating whether to treat each character independently during recognition.
   * Defaults to `false`.
   */
  independentCharacters?: boolean;
};

/**
 * Return type for the `useOCR` hook.
 * Manages the state and operations for Optical Character Recognition (OCR).
 * 
 * @category Types
 */
export interface OCRType {
  /**
   * Contains the error object if the models failed to load, download, or encountered a runtime error during recognition.
   */
  error: RnExecutorchError | null;

  /**
   * Indicates whether both detector and recognizer models are loaded and ready to process images.
   */
  isReady: boolean;

  /**
   * Indicates whether the model is currently processing an image.
   */
  isGenerating: boolean;

  /**
   * Represents the total download progress of the model binaries as a value between 0 and 1.
   */
  downloadProgress: number;

  /**
   * Executes the OCR pipeline (detection and recognition) on the provided image.
   * @param imageSource - A string representing the image source (e.g., a file path, URI, or base64 string) to be processed.
   * @returns A Promise that resolves to the OCR results (typically containing the recognized text strings and their bounding boxes).
   * @throws {RnExecutorchError} If the models are not loaded or are currently processing another image.
   */
  forward: (imageSource: string) => Promise<OCRDetection[]>;
}

/**
 * Enumeration of supported OCR languages based on available symbol sets.
 * 
 * @category Types
 */
export type OCRLanguage = keyof typeof symbols;
