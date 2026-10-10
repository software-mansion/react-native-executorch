/**
 * A scripted LLM `.pte` program for the fake runtime.
 *
 * The LLM runner is assembled in TypeScript on top of `loadModel`,
 * `loadTokenizer` and the native sampler, so the fake sits below it: this
 * registers a model exporting the text-runner methods and a tokenizer over an
 * open vocabulary, and the real runner drives them. Nothing about the runner
 * itself is faked.
 *
 * The model answers with scripted responses. Its `forward` emits one-hot
 * logits for the next token of the current response, and then for the eos
 * token once the response runs out. A `forward` that feeds back the token it
 * just asked for continues the response; any other input is a new prompt, and
 * a new prompt after a response has been (at least partly) emitted moves on to
 * the next scripted one — so prefilling the user message and the generation
 * prompt of the same turn does not skip a response.
 */
import type { ConcreteDim, ModelSpec } from '../../src/core/schema';
import { fakeJsi } from './fakeJsi';
import type { FakeTensor } from './fakeTensor';

/** How the model answers one generation. */
export type FakeGeneration = {
  /** The text produced, one token per whitespace-terminated word. */
  response: string;
};

export type FakeLLMProgram = {
  /** Largest chunk a single `forward` accepts. Defaults to `128`. */
  maxSeqLen?: number;
  /** KV cache capacity. Defaults to `1024`. */
  maxContextLen?: number;
  /** The token the model ends every response with. */
  eosToken: string;
  /**
   * Responses handed out in order, one per generation. A model that runs past
   * the end of the list repeats the last entry, so a test only has to script
   * the turns it cares about.
   */
  generations?: readonly FakeGeneration[];
};

/** A prompt the model read: the text of one prefill, and where it started. */
export type FakePromptRead = { text: string; startPos: number };

const VOCAB_SIZE = 4096;

/**
 * Registers a scripted LLM at `modelPath` and its tokenizer at `tokenizerPath`.
 * @param modelPath The `.pte` path the runner will load.
 * @param tokenizerPath The tokenizer path the runner will load.
 * @param program The context window and the responses to generate.
 * @returns Accessors for what the model was asked to read.
 */
export function registerFakeLLM(modelPath: string, tokenizerPath: string, program: FakeLLMProgram) {
  const { maxSeqLen = 128, maxContextLen = 1024, eosToken, generations = [] } = program;

  const tokens: string[] = [];
  const idOf = (token: string): number => {
    const id = tokens.indexOf(token);
    return id !== -1 ? id : tokens.push(token) - 1;
  };
  const eosId = idOf(eosToken);
  // `split` on a lookbehind keeps the whitespace on the token it follows, so
  // the decoded tokens concatenate back to the response verbatim.
  const responses = generations.map(({ response }) => [
    ...response
      .split(/(?<=\s)/)
      .filter(Boolean)
      .map(idOf),
    eosId,
  ]);

  let generation = 0;
  let step = 0;
  let emitted = false;
  const prompts: FakePromptRead[] = [];

  const current = (): readonly number[] =>
    responses[Math.min(generation, responses.length - 1)] ?? [eosId];

  const emit = (logits: FakeTensor, id: number): void => {
    for (let i = 0; i < logits.numel; i++) logits.setElement(i, i === id ? 1 : 0);
  };

  // The method names are the exported `.pte` method names.
  /* eslint-disable camelcase */
  const schema: ModelSpec<ConcreteDim> = {
    forward: {
      inputs: [
        {
          kind: 'Tensor',
          dtype: 'int64',
          shape: [
            { kind: 'constant', value: 1 },
            { kind: 'range', range: { min: 1, max: maxSeqLen, step: 1 } },
          ],
        },
        { kind: 'Tensor', dtype: 'int64', shape: [{ kind: 'constant', value: 1 }] },
      ],
      outputs: [
        {
          kind: 'Tensor',
          dtype: 'float32',
          shape: [
            { kind: 'constant', value: 1 },
            { kind: 'constant', value: VOCAB_SIZE },
          ],
        },
      ],
      runtimeConstraints: [],
    },
    get_max_seq_len: { inputs: [], outputs: [{ kind: 'Int' }], runtimeConstraints: [] },
    get_max_context_len: { inputs: [], outputs: [{ kind: 'Int' }], runtimeConstraints: [] },
    get_vocab_size: { inputs: [], outputs: [{ kind: 'Int' }], runtimeConstraints: [] },
    use_kv_cache: { inputs: [], outputs: [{ kind: 'Bool' }], runtimeConstraints: [] },
    enable_dynamic_shape: { inputs: [], outputs: [{ kind: 'Bool' }], runtimeConstraints: [] },
    get_eos_ids: { inputs: [], outputs: [{ kind: 'Int' }], runtimeConstraints: [] },
  } as ModelSpec<ConcreteDim>;
  /* eslint-enable camelcase */

  fakeJsi.registerModel(modelPath, {
    schema,
    execute: (methodName, inputs, outputs) => {
      switch (methodName) {
        case 'get_max_seq_len':
          return [maxSeqLen];
        case 'get_max_context_len':
          return [maxContextLen];
        case 'get_vocab_size':
          return [VOCAB_SIZE];
        case 'use_kv_cache':
        case 'enable_dynamic_shape':
          return [true];
        case 'get_eos_ids':
          return [eosId];
      }

      const [tTokens, tPos] = inputs as [FakeTensor, FakeTensor];
      const ids = Array.from({ length: tTokens.numel }, (_, i) => tTokens.getElement(i));
      const response = current();

      if (ids.length === 1 && ids[0] === response[step]) {
        emitted = true;
        step++;
      } else {
        if (emitted) generation++;
        emitted = false;
        step = 0;
        prompts.push({ text: ids.map((id) => tokens[id]).join(' '), startPos: tPos.getElement(0) });
      }

      emit(outputs[0]!, current()[step] ?? eosId);
      return undefined;
    },
  });

  fakeJsi.registerTokenizer(tokenizerPath, { tokens, open: true });

  return {
    /** @returns Every prompt the model read, prefill by prefill, in order. */
    prompts: (): readonly FakePromptRead[] => prompts,
  };
}
