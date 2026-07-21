import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor, Dynamic } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';

import { loadTokenizer } from '../tokenizer';

/**
 * Model configuration required to instantiate a text embedder task runner.
 * @category Types
 */
export type TextEmbedderModel = {
  readonly modelPath: string;
  readonly tokenizerPath: string;
  readonly defaultPrompt?: string;
};

/**
 * Creates a text embedder for executing local Text Embedding models
 * (e.g. sentence-transformers like all-MiniLM-L6-v2).
 *
 * It loads the tokenizer and model, validates the model input and output
 * requirements, pre-allocates the static execution tensors, and registers clean
 * disposal hooks to clear all native memory. The input text is tokenized and fed
 * at its exact token length (no padding), truncated only when it exceeds the
 * model's maximum sequence length; the attention mask is all ones. Pooling and
 * normalization are baked into the exported `.pte`; this runner runs the forward
 * pass and returns the raw embedding vector.
 * @category Typescript API
 * @param config Text embedder task configuration containing the model and
 * tokenizer paths.
 * @param runtime Optional worklet runtime thread on which to run the model
 * execution.
 * @returns A promise resolving to an object containing the embedding and
 * disposal controls.
 */
export async function createTextEmbedder(
  config: TextEmbedderModel,
  runtime?: WorkletRuntime
): Promise<{
  /**
   * Releases all allocated native resources.
   */
  dispose: () => void;
  /**
   * Asynchronously computes the embedding vector for the given input text.
   * Inputs longer than the model's maximum sequence length are truncated.
   * @param input The input text to embed.
   * @param prompt Optional prompt prefix overriding the model's configured
   * `defaultPrompt` for this call.
   * @returns A promise resolving to the embedding vector.
   */
  embed: (input: string, prompt?: string) => Promise<Float32Array>;
  /**
   * Synchronous version of {@link embed} to be executed directly on the
   * caller or worklet thread.
   */
  embedWorklet: (input: string, prompt?: string) => Float32Array;
}> {
  const { modelPath, tokenizerPath, defaultPrompt } = config;
  const [model, tokenizer] = await Promise.all([
    wrapAsync(loadModel, runtime)(modelPath),
    wrapAsync(loadTokenizer, runtime)(tokenizerPath),
  ]);

  // Text embedding models take two int64 inputs: the token ids and the
  // attention mask, both of shape [1, sequence_length].
  const meta = validateModelSchema(
    model,
    'forward',
    [SymbolicTensor('int64', [1, Dynamic('L')]), SymbolicTensor('int64', [1, Dynamic('L')])],
    [SymbolicTensor('float32', [1, 'D'], ['D'])]
  );
  // The models are exported with a dynamic sequence dimension; the declared size
  // is the upper bound, used only to truncate over-long inputs.
  const maxSeqLen = meta.inputTensorMeta[0]!.shape[1]!;
  const outShape = meta.outputTensorMeta[0]!.shape;

  const tensors = [tensor('float32', outShape)] as const;
  const [tEmbedding] = tensors;

  const dispose = () => {
    tensors.forEach((t) => t.dispose());
    tokenizer.dispose();
    model.dispose();
  };

  const embedWorklet = (input: string, prompt?: string): Float32Array => {
    'worklet';
    const text = (prompt ?? defaultPrompt ?? '') + input;
    const ids = tokenizer.encode(text);
    if (ids.length === 0) {
      throw new Error('createTextEmbedder: input tokenized to zero tokens');
    }
    const len = Math.min(ids.length, maxSeqLen);

    const idsData = new BigInt64Array(len);
    const maskData = new BigInt64Array(len);
    for (let i = 0; i < len; i++) {
      idsData[i] = BigInt(ids[i]!);
      maskData[i] = 1n;
    }

    const tTokenIds = tensor('int64', [1, len], idsData);
    const tAttentionMask = tensor('int64', [1, len], maskData);
    try {
      model.execute('forward', [tTokenIds, tAttentionMask], [tEmbedding]);
      return tEmbedding.getData(new Float32Array(tEmbedding.numel));
    } finally {
      tTokenIds.dispose();
      tAttentionMask.dispose();
    }
  };

  const embed = wrapAsync(embedWorklet, runtime);

  return { embed, embedWorklet, dispose };
}
