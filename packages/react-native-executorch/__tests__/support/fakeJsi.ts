/**
 * The fake `__rnexecutorch_jsi__` global.
 *
 * Everything in `src/` bottoms out here, so the depth of this object decides
 * what the TypeScript suites can actually exercise. Rather than stubbing each
 * call per test — which would only ever assert against the stub — this
 * implements the native contract in JavaScript: tensors hold real data, the
 * operators compute real values, and `loadModel` returns a program a test has
 * described (its schema, and optionally what `execute` writes into the output
 * tensors). Task pipelines therefore run end to end.
 *
 * The C++ side of the same contract is covered by the GoogleTest suites under
 * `cpp/tests/`; what these suites own is the TypeScript above it.
 */
import type { ConcreteDim, ModelSpec } from '../../src/core/schema';
import type { DType } from '../../src/core/tensor';
import { FakeTensor, tensorTracker } from './fakeTensor';
import { cv, math, speech } from './fakeOps';

// ============================================================================
// Models
// ============================================================================

/** What `execute` does: reads the inputs and fills the pre-allocated outputs. */
export type FakeExecute = (
  methodName: string,
  inputs: readonly unknown[],
  outputs: readonly FakeTensor[]
) => void;

/** A program `loadModel` can return. */
export type FakeProgram = {
  /** The exported schema, as the native loader would derive it. */
  schema: ModelSpec<ConcreteDim>;
  /** Per-method backends. Defaults to `XnnpackBackend` for every method. */
  backends?: Record<string, readonly string[]>;
  /** Output producer. Defaults to leaving the output tensors untouched. */
  execute?: FakeExecute;
};

const programs = new Map<string, FakeProgram>();
const liveModels = new Set<string>();
const executions: { path: string; methodName: string }[] = [];

class FakeModel {
  readonly path: string;
  readonly schema: ModelSpec<ConcreteDim>;
  readonly backends: Record<string, readonly string[]>;
  private readonly program: FakeProgram;
  private disposed = false;

  constructor(path: string, program: FakeProgram) {
    this.path = path;
    this.program = program;
    this.schema = program.schema;
    this.backends =
      program.backends ??
      Object.fromEntries(Object.keys(program.schema).map((m) => [m, ['XnnpackBackend']]));
    liveModels.add(path);
  }

  execute(methodName: string, inputs: unknown[], outputTensors: FakeTensor[]): unknown[] {
    if (this.disposed) throw new Error(`execute: model '${this.path}' has been disposed`);
    if (!this.schema[methodName]) {
      throw new Error(`execute: method '${methodName}' is not exported by '${this.path}'`);
    }
    executions.push({ path: this.path, methodName });
    this.program.execute?.(methodName, inputs, outputTensors);
    return outputTensors;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    liveModels.delete(this.path);
  }
}

// ============================================================================
// Tokenizers
// ============================================================================

/** A tokenizer `loadTokenizer` can return. */
export type FakeVocabulary = {
  /** Token strings, indexed by id. */
  tokens: readonly string[];
  /** Ids prepended to every `encode` result (e.g. a BOS token). */
  prefix?: readonly number[];
  /** Ids appended to every `encode` result (e.g. an EOS token). */
  suffix?: readonly number[];
  /** Ids skipped by `decode` when `skipSpecialTokens` is set. */
  specialIds?: readonly number[];
};

const vocabularies = new Map<string, FakeVocabulary>();
const liveTokenizers = new Set<string>();

/**
 * Builds a fake tokenizer.
 *
 * The methods are closures rather than prototype methods on purpose: a native
 * JSI host object's properties are self-contained `jsi::Function`s that capture
 * the tokenizer, so they keep working when detached — and the library relies on
 * that (`createTokenizer` passes `tokenizer.encode` straight to `wrapAsync`).
 * Prototype methods would lose `this` and fail on a contract the real object
 * honors.
 * @param path The tokenizer path.
 * @param vocabulary The vocabulary to serve.
 * @returns The fake tokenizer.
 */
function createFakeTokenizer(path: string, vocabulary: FakeVocabulary) {
  let disposed = false;
  liveTokenizers.add(path);

  const assertLive = (op: string): void => {
    if (disposed) throw new Error(`${op}: tokenizer '${path}' has been disposed`);
  };

  return {
    path,

    /**
     * Whitespace tokenization against the vocabulary; unknown words map to 0.
     */
    encode: (text: string): Int32Array => {
      assertLive('encode');
      const words = text.split(/\s+/).filter(Boolean);
      const ids = words.map((word) => Math.max(0, vocabulary.tokens.indexOf(word)));
      return Int32Array.from([...(vocabulary.prefix ?? []), ...ids, ...(vocabulary.suffix ?? [])]);
    },

    decode: (tokens: Int32Array, skipSpecialTokens = true): string => {
      assertLive('decode');
      const special = new Set(vocabulary.specialIds ?? []);
      return [...tokens]
        .filter((id) => !(skipSpecialTokens && special.has(id)))
        .map((id) => vocabulary.tokens[id] ?? '')
        .filter(Boolean)
        .join(' ');
    },

    getVocabSize: (): number => {
      assertLive('getVocabSize');
      return vocabulary.tokens.length;
    },

    idToToken: (id: number): string => {
      assertLive('idToToken');
      const token = vocabulary.tokens[id];
      if (token === undefined) throw new Error(`idToToken: id ${id} is out of range`);
      return token;
    },

    tokenToId: (token: string): number => {
      assertLive('tokenToId');
      const id = vocabulary.tokens.indexOf(token);
      if (id === -1) throw new Error(`tokenToId: token '${token}' is not in the vocabulary`);
      return id;
    },

    dispose: (): void => {
      if (disposed) return;
      disposed = true;
      liveTokenizers.delete(path);
    },
  };
}

// ============================================================================
// The global
// ============================================================================

let registeredBackends: string[] = ['XnnpackBackend', 'CoreMLBackend'];

const jsi = {
  isEmulator: false,

  createTensor: (shape: number[], dtype: DType) => new FakeTensor(dtype, shape),

  loadModel: (path: string) => {
    const program = programs.get(path);
    if (!program) {
      throw new Error(`loadModel: no program registered at '${path}' (register one via fakeJsi)`);
    }
    return new FakeModel(path, program);
  },

  getExecuTorchRegisteredBackends: () => [...registeredBackends],

  math,
  cv,
  speech,
  nlp: {
    loadTokenizer: (path: string) => {
      const vocabulary = vocabularies.get(path);
      if (!vocabulary) {
        throw new Error(`loadTokenizer: no vocabulary registered at '${path}'`);
      }
      return createFakeTokenizer(path, vocabulary);
    },
  },
};

/**
 * Installs the fake under its real global name. Called once from the Jest
 * setup file: `src/native/bridge.ts` captures `globalThis.__rnexecutorch_jsi__`
 * into a module-level `const` at import time, so the object identity must stay
 * stable for the whole run — `reset()` clears state in place rather than
 * swapping the global.
 */
export function installFakeJsi(): void {
  // eslint-disable-next-line camelcase
  (globalThis as Record<string, unknown>).__rnexecutorch_jsi__ = jsi;
}

export const fakeJsi = {
  /**
   * Makes `loadModel(path)` succeed and return `program`.
   * @param path The model path a pipeline will be pointed at.
   * @param program The schema, backends and `execute` behavior to serve.
   */
  registerModel(path: string, program: FakeProgram): void {
    programs.set(path, program);
  },

  /**
   * Makes `loadTokenizer(path)` succeed and return a tokenizer over `vocabulary`.
   * @param path The tokenizer path a pipeline will be pointed at.
   * @param vocabulary The vocabulary to serve.
   */
  registerTokenizer(path: string, vocabulary: FakeVocabulary): void {
    vocabularies.set(path, vocabulary);
  },

  /**
   * Overrides what `getRegisteredBackends()` reports.
   * @param backends The backend names to report.
   */
  setRegisteredBackends(backends: string[]): void {
    registeredBackends = backends;
  },

  /**
   * Sets the emulator flag the native installer would provide.
   * @param value Whether the fake reports running on an emulator.
   */
  setIsEmulator(value: boolean): void {
    jsi.isEmulator = value;
  },

  /** @returns Every `execute` call made so far, in order. */
  executions(): readonly { path: string; methodName: string }[] {
    return executions;
  },

  /** @returns Paths of models that were loaded and not disposed. */
  liveModels(): string[] {
    return [...liveModels].sort();
  },

  /** @returns Paths of tokenizers that were loaded and not disposed. */
  liveTokenizers(): string[] {
    return [...liveTokenizers].sort();
  },

  /** @returns How many tensors are allocated and not disposed. */
  liveTensors(): number {
    return tensorTracker.liveCount();
  },

  /** @returns A readable description of every tensor still allocated. */
  liveTensorDescriptions(): string[] {
    return tensorTracker.liveDescriptions();
  },

  /** Clears every registration and tracker. Runs automatically between tests. */
  reset(): void {
    programs.clear();
    vocabularies.clear();
    liveModels.clear();
    liveTokenizers.clear();
    executions.length = 0;
    registeredBackends = ['XnnpackBackend', 'CoreMLBackend'];
    jsi.isEmulator = false;
    tensorTracker.reset();
  },
};
