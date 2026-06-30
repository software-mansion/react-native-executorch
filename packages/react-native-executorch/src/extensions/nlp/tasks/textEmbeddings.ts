import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';

import { loadTokenizer } from '../tokenizer';

/**
 * Model configuration required to instantiate a text embeddings task runner.
 * @category Types
 */
export type TextEmbeddingsModel = {
  readonly modelPath: string;
  readonly tokenizerPath: string;
};

/**
 * Creates a text embeddings runner for executing local Text Embedding models
 * (e.g. sentence-transformers like all-MiniLM-L6-v2).
 *
 * It loads the tokenizer and model, validates the model input and output
 * requirements, pre-allocates the static execution tensors, and registers clean
 * disposal hooks to clear all native memory. The input text is tokenized, then
 * padded/truncated to the model's fixed sequence length with an accompanying
 * attention mask. Pooling and normalization are baked into the exported `.pte`;
 * this runner runs the forward pass and returns the raw embedding vector.
 * @category Typescript API
 * @param config Text embeddings task configuration containing the model and
 * tokenizer paths.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to an object containing the embedding and
 * disposal controls.
 */
export async function createTextEmbeddings(
  config: TextEmbeddingsModel,
  runtime?: WorkletRuntime
): Promise<{
  /**
   * Releases all allocated native resources.
   */
  dispose: () => void;
  /**
   * Asynchronously computes the embedding vector for the given input text.
   * @param input The input text to embed.
   * @returns A promise resolving to the embedding vector.
   */
  forward: (input: string) => Promise<Float32Array>;
  /**
   * Synchronous version of {@link forward} to be executed directly on the
   * caller or worklet thread.
   */
  forwardWorklet: (input: string) => Float32Array;
}> {
  const { modelPath, tokenizerPath } = config;
  const [model, tokenizer] = await Promise.all([
    wrapAsync(loadModel, runtime)(modelPath),
    wrapAsync(loadTokenizer, runtime)(tokenizerPath),
  ]);

  // Text embedding models take two int64 inputs: the token ids and the
  // attention mask, both of shape [1, sequence_length].
  const meta = validateModelSchema(
    model,
    'forward',
    [SymbolicTensor('int64', [1, 'L']), SymbolicTensor('int64', [1, 'L'])],
    [SymbolicTensor('float32', [1, 'D'], ['D'])]
  );
  const seqLen = meta.inputTensorMeta[0]!.shape[1]!;
  const outShape = meta.outputTensorMeta[0]!.shape;

  const tokenIds = tensor('int64', [1, seqLen]);
  const attentionMask = tensor('int64', [1, seqLen]);
  const tEmbedding = tensor('float32', outShape);

  const dispose = () => {
    tokenIds.dispose();
    attentionMask.dispose();
    tEmbedding.dispose();
    tokenizer.dispose();
    model.dispose();
  };

  const forwardWorklet = (input: string): Float32Array => {
    'worklet';
    const ids = tokenizer.encode(input);
    const len = Math.min(ids.length, seqLen);

    // Padding entries default to 0 (the [PAD] token) with a zero attention
    // mask, so the pooling baked into the model ignores them.
    const idsData = new BigInt64Array(seqLen);
    const maskData = new BigInt64Array(seqLen);
    for (let i = 0; i < len; i++) {
      idsData[i] = BigInt(ids[i]!);
      maskData[i] = 1n;
    }

    tokenIds.setData(idsData);
    attentionMask.setData(maskData);
    model.execute('forward', [tokenIds, attentionMask], [tEmbedding]);

    return tEmbedding.getData(new Float32Array(tEmbedding.numel));
  };

  const forward = wrapAsync(forwardWorklet, runtime);

  return { forward, forwardWorklet, dispose };
}
