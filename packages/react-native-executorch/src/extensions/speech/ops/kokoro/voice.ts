import { rnexecutorchJsi } from '../../../../native/bridge';
import type { Tensor } from '../../../../core/tensor';

/**
 * Loads a voice embedding binary file directly into the output tensor's buffer.
 * The file is a [rows x 256] matrix of float32 values.
 * @param path - Absolute path to the voice embedding binary file.
 * @param outputTensor - A float32 tensor with enough capacity for the entire
 *   file and a compatible shape (1-D or [rows, 256]).
 */
export function loadVoiceEmbedding(path: string, outputTensor: Tensor): void {
  'worklet';
  rnexecutorchJsi.speech.kokoro.loadVoiceEmbedding(path, outputTensor);
}
