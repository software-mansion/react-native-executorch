import { ResourceSource, TensorPtr } from '../types/common';
import { RnExecutorchError } from '../errors/errorUtils';

/**
 * Props for the `useExecutorchModule` hook.
 * 
 * @property {ResourceSource} modelSource - The source of the ExecuTorch model binary.
 * @property {boolean} [preventLoad] - Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
 */
export interface ExecutorchModuleProps {
  modelSource: ResourceSource;
  preventLoad?: boolean;
}

/**
 * Return type for the `useExecutorchModule` hook.
 * Manages the state and core execution methods for a general ExecuTorch model.
 */
export interface ExecutorchModuleType {
  /**
   * Contains the error object if the model failed to load, download, or encountered a runtime error.
   */
  error: RnExecutorchError | null;

  /**
   * Indicates whether the ExecuTorch model binary has successfully loaded into memory and is ready for inference.
   */
  isReady: boolean;

  /**
   * Indicates whether the model is currently processing a forward pass.
   */
  isGenerating: boolean;

  /**
   * Represents the download progress of the model binary as a value between 0 and 1.
   */
  downloadProgress: number;

  /**
   * Executes the model's forward pass with the provided input tensors.
   * @param inputTensor - An array of `TensorPtr` objects representing the input tensors required by the model.
   * @returns A Promise that resolves to an array of output `TensorPtr` objects resulting from the model's inference.
   * @throws {RnExecutorchError} If the model is not loaded or is currently processing another request.
   */
  forward: (inputTensor: TensorPtr[]) => Promise<TensorPtr[]>;
}