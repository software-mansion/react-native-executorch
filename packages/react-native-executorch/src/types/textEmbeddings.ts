import { RnExecutorchError } from '../errors/errorUtils';
import { ResourceSource } from '../types/common';

/**
 * Union of all built-in text embeddings model names.
 * @category Types
 */
export type TextEmbeddingsModelName =
  | 'all-minilm-l6-v2'
  | 'all-mpnet-base-v2'
  | 'multi-qa-minilm-l6-cos-v1'
  | 'multi-qa-mpnet-base-dot-v1'
  | 'distiluse-base-multilingual-cased-v2-8da4w'
  | 'distiluse-base-multilingual-cased-v2-coreml'
  | 'paraphrase-multilingual-minilm-l12-v2'
  | 'paraphrase-multilingual-minilm-l12-v2-8da4w'
  | 'paraphrase-multilingual-minilm-l12-v2-coreml'
  | 'paraphrase-multilingual-minilm-l12-v2-coreml-fp16'
  | 'clip-vit-base-patch32-text';

/**
 * Props for the useTextEmbeddings hook.
 * @category Types
 * @property {object} model - An object containing the model configuration.
 * @property {TextEmbeddingsModelName} model.modelName - Unique name identifying the model.
 * @property {ResourceSource} model.modelSource - The source of the text embeddings model binary.
 * @property {ResourceSource} model.tokenizerSource - The source of the tokenizer JSON file.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 */
export interface TextEmbeddingsProps {
  model: {
    /**
     * The unique name of the text embeddings model.
     */
    modelName: TextEmbeddingsModelName;
    /**
     * The source of the text embeddings model binary.
     */
    modelSource: ResourceSource;
    /**
     * The source of the tokenizer JSON file.
     */
    tokenizerSource: ResourceSource;
  };
  preventLoad?: boolean;
}

/**
 * React hook state and methods for managing a Text Embeddings model instance.
 * @category Types
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
   * @param input - The text string to embed.
   * @returns A promise resolving to a Float32Array containing the vector embeddings.
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another request.
   */
  forward(input: string): Promise<Float32Array>;
}
