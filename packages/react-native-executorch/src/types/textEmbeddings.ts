import { RnExecutorchError } from '../errors/errorUtils';
import { ResourceSource } from '../types/common';

/**
 * React hook state and methods for managing a Text Embeddings model instance.
 */
export interface TextEmbeddingsType {
  /**
   * Contains the error message if the model failed to load or during inference.
   */
  error: null | RnExecutorchError;

  /**
   * Indicates whether the embeddings model has successfully loaded and is ready for inference.
   */
  isReady: boolean;

  /**
   * Indicates whether the model is currently generating embeddings.
   */
  isGenerating: boolean;

  /**
   * Tracks the progress of the model download process (value between 0 and 1).
   */
  downloadProgress: number;

  /**
   * Runs the text embeddings model on the provided input string.
   * * @param input - The text string to embed.
   * @returns A promise resolving to a Float32Array containing the vector embeddings.
   */
  forward(input: string): Promise<Float32Array>;
}

/**
 * Props for the useTextEmbeddings hook.
 */
export interface TextEmbeddingsProps {
  model: {
    /**
     * `ResourceSource` that specifies the location of the model binary.
     */
    modelSource: ResourceSource;

    /**
     * `ResourceSource` pointing to the JSON file which contains the tokenizer.
     */
    tokenizerSource: ResourceSource;
  };

  /**
   * Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
   */
  preventLoad?: boolean;
}