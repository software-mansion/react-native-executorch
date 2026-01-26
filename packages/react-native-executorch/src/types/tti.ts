import { RnExecutorchError } from '../errors/errorUtils';
import { ResourceSource } from '../types/common';

/**
 * Configuration properties for the `useTextToImage` hook.
 */
export interface TextToImageParams {
  /**
   * Object containing the required model sources for the diffusion pipeline.
   */
  model: {
    /** Source for the text tokenizer binary/config. */
    tokenizerSource: ResourceSource;
    /** Source for the diffusion scheduler binary/config. */
    schedulerSource: ResourceSource;
    /** Source for the text encoder model binary. */
    encoderSource: ResourceSource;
    /** Source for the UNet (noise predictor) model binary. */
    unetSource: ResourceSource;
    /** Source for the VAE decoder model binary, used to decode the final image. */
    decoderSource: ResourceSource;
  };

  /**
   * Optional callback function that is triggered after each diffusion inference step.
   * Useful for updating a progress bar during image generation.
   * @param stepIdx - The index of the current inference step.
   */
  inferenceCallback?: (stepIdx: number) => void;

  /**
   * Boolean that can prevent automatic model loading (and downloading the data if loaded for the first time) after running the hook.
   * Defaults to `false`.
   */
  preventLoad?: boolean;
}

/**
 * Return type for the `useTextToImage` hook.
 * Manages the state and operations for generating images from text prompts using a diffusion model pipeline.
 */
export interface TextToImageType {
  /**
   * Contains the error object if any of the pipeline models failed to load, download, or encountered a runtime error.
   */
  error: RnExecutorchError | null;

  /**
   * Indicates whether the entire diffusion pipeline is loaded into memory and ready for generation.
   */
  isReady: boolean;

  /**
   * Indicates whether the model is currently generating an image.
   */
  isGenerating: boolean;

  /**
   * Represents the total download progress of all the model binaries combined, as a value between 0 and 1.
   */
  downloadProgress: number;

  /**
   * Runs the diffusion pipeline to generate an image from the provided text prompt.
   * @param input - The text prompt describing the desired image.
   * @param [imageSize] - Optional. The target width and height of the generated image (e.g., 512 for 512x512). Defaults to the model's standard size if omitted.
   * @param [numSteps] - Optional. The number of denoising steps for the diffusion process. More steps generally yield higher quality at the cost of generation time.
   * @param [seed] - Optional. A random seed for reproducible generation.
   * @returns A Promise that resolves to a string representing the generated image (e.g., base64 string or file URI).
   * @throws {RnExecutorchError} If the model is not loaded or is currently generating another image.
   */
  generate: (
    input: string,
    imageSize?: number,
    numSteps?: number,
    seed?: number
  ) => Promise<string>;

  /**
   * Interrupts the currently active image generation process at the next available inference step.
   */
  interrupt: () => void;
}