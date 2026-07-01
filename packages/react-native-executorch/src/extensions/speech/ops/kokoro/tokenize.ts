import { rnexecutorchJsi } from '../../../../native/bridge';
import type { Tensor } from '../../../../core/tensor';

/**
 * Tokenizes a phoneme string into the Kokoro vocab and writes the result
 * directly into the output tensor's buffer.
 * @param phonemes - The phoneme string in UTF-8.
 * @param outputTensor - An int64 tensor with enough capacity for the tokens
 *   (phoneme length + 2 pad tokens).
 */
export function tokenize(phonemes: string, outputTensor: Tensor): void {
  'worklet';
  rnexecutorchJsi.speech.kokoro.tokenize(phonemes, outputTensor);
}
