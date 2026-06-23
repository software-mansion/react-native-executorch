// Hooks — primary API for app developers
export * from './hooks/useClassifier';
export * from './hooks/useTokenizer';
export * from './hooks/useResourceDownload';
export * from './hooks/useModel';

// Constants
export { models } from './models';
export * as constants from './constants';

// Task APIs — for developers needing manual lifetime/disposal control
export * from './extensions/cv/tasks/classification';
export * from './extensions/nlp/tasks/tokenization';

// Core primitives — for library builders and power users
export { tensor } from './core/tensor';
export type { DType, Tensor } from './core/tensor';

export { loadModel } from './core/model';
export type {
  Model,
  ModelInput,
  ModelOutput,
  TensorMeta,
  ModelMethodMeta,
  ExecuTorchTag,
} from './core/model';

export { validateModelSchema, SymbolicTensor, matchShape } from './core/modelSchema';
export type { ValueConstraint, TensorConstraint, SymbolicShape } from './core/modelSchema';

export { defaultWorkletRuntime, wrapAsync } from './core/runtime';

export * as math from './extensions/math';
export * as cv from './extensions/cv';
export * as nlp from './extensions/nlp';

// Utils
export * from './utils';
