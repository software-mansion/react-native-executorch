import { type DType } from './tensor';
import { type Model, type ExecuTorchTag, type ModelMethodMeta, type TensorMeta } from './model';

/**
 * A single dimension in a symbolic tensor shape.
 *
 * - A **number** matches only that exact dimension size (e.g. `1`, `3`).
 * - A **string** is a symbolic variable that can match any integer and is
 *   resolved consistently within the same tensor shape (e.g. `'N'`, `'H'`,
 *   `'W'`).
 * @category Types
 */
export type SymbolicShape = readonly (number | string)[];

/**
 * A constraint on the dtype and/or shape of a tensor input or output slot.
 *
 * Both fields are optional; omitting `dtype` skips dtype checking, and omitting
 * `shapes` (or providing an empty array) skips shape checking.
 * @category Types
 */
export type TensorConstraint = {
  /** If set, the tensor's dtype must match exactly. */
  readonly dtype?: DType;
  /**
   * One or more acceptable symbolic shapes. The tensor passes validation if
   * its concrete shape matches **at least one** of the listed shapes.
   */
  readonly shapes?: readonly SymbolicShape[];
};

/**
 * Convenience constructor for a {@link TensorConstraint}.
 *
 * ```ts
 * // Accepts a float32 tensor with shape [1, 3, H, W] or [3, H, W]
 * SymbolicTensor('float32', [1, 3, 'H', 'W'], [3, 'H', 'W'])
 *
 * // Accepts any tensor of shape [1, N]
 * SymbolicTensor(undefined, [1, 'N'])
 * ```
 * @category Typescript API
 * @param dtype Optional dtype requirement. Pass `undefined` to skip dtype
 * checking.
 * @param shapes Zero or more acceptable symbolic shapes. An empty list skips
 * shape checking.
 * @returns A {@link TensorConstraint} object.
 */
export function SymbolicTensor(
  dtype?: DType,
  ...shapes: readonly SymbolicShape[]
): TensorConstraint {
  return { dtype, shapes };
}

const primitiveTagMap = {
  number: ['Int', 'Double'] as ExecuTorchTag[],
  boolean: ['Bool'] as ExecuTorchTag[],
  null: ['None'] as ExecuTorchTag[],
} as const;

/**
 * A constraint describing an expected input or output slot of a model method.
 *
 * - `'number'` — the slot must carry an integer or double primitive value.
 * - `'boolean'` — the slot must carry a boolean primitive value.
 * - `'null'` — the slot must carry a `None` value.
 * - {@link TensorConstraint} — the slot must carry a tensor, optionally with a
 *   constrained dtype and/or shape.
 * @category Types
 */
export type ValueConstraint = keyof typeof primitiveTagMap | TensorConstraint;

/**
 * Checks whether a concrete tensor shape matches at least one of the provided
 * symbolic shapes.
 *
 * Symbolic dimensions (strings) act as named wildcards: within a single shape
 * candidate they must resolve to the same integer value every time they appear,
 * but they are not enforced consistently across different tensor slots.
 * @category Typescript API
 * @param actual The concrete shape array to test (e.g. `[1, 3, 224, 224]`).
 * @param expected One or more symbolic shapes to match against.
 * @returns `true` if `actual` matches at least one of the `expected` shapes.
 */
export function matchShape(actual: number[], ...expected: readonly SymbolicShape[]): boolean {
  return expected.some((shape) => {
    if (actual.length !== shape.length) return false;
    const symbolMap = new Map<string, number>();
    return shape.every((dim, i) => {
      const act = actual[i]!;
      if (typeof dim === 'number') return act === dim;
      if (symbolMap.has(dim)) return symbolMap.get(dim) === act;
      symbolMap.set(dim, act);
      return true;
    });
  });
}

// TODO: Implement cross-tensor symbol validation (e.g. enforcing that 'N' or
// 'H' has the same value across different input/output tensors). Note that a
// proper implementation will require backtracking/solving when multiple tensors
// have multiple alternative shapes. For now, we just check that each tensor
// individually matches at least one of its expected shapes, without enforcing
// consistency of symbolic dimensions across tensors, only within each tensor.
function validateTags(
  side: 'input' | 'output',
  expected: readonly ValueConstraint[],
  actualTags: ExecuTorchTag[],
  tensorMetas: TensorMeta[]
) {
  const numTensors = expected.filter((t) => typeof t === 'object').length;
  if (tensorMetas.length !== numTensors)
    throw new Error(
      `${side} tensor count mismatch: expected ${numTensors}, got ${tensorMetas.length}`
    );

  let tIdx = 0;
  expected.forEach((exp, i) => {
    const act = actualTags[i]!;
    if (typeof exp === 'string') {
      if (!primitiveTagMap[exp].includes(act)) {
        throw new Error(`${side}[${i}]: expected primitive '${exp}', got '${act}'`);
      }
    } else {
      if (act !== 'Tensor') {
        throw new Error(`${side}[${i}]: expected Tensor, got primitive '${act}'`);
      }
      const tMeta = tensorMetas[tIdx++]!;
      if (exp.dtype && tMeta.dtype !== exp.dtype) {
        throw new Error(
          `${side}[${i}]: dtype mismatch: expected '${exp.dtype}', got '${tMeta.dtype}'`
        );
      }
      if (exp.shapes?.length && !matchShape(tMeta.shape, ...exp.shapes)) {
        const expectedShapesStr = exp.shapes.map((s) => `[${s.join(',')}]`).join('|');
        throw new Error(
          `${side}[${i}]: shape mismatch: expected shape matching ${expectedShapesStr}, got [${tMeta.shape.join(',')}]`
        );
      }
    }
  });
}

/**
 * Validates that a compiled model's method signature matches the declared
 * input and output constraints, throwing a descriptive error on mismatch.
 *
 * The function checks:
 * - That the method exists on the model.
 * - That the number of input and output slots matches the expected counts.
 * - That the value-tag of each slot (tensor, int, bool, etc.) is compatible
 *   with its declared {@link ValueConstraint}.
 * - For tensor slots: that the dtype and shape (if specified) satisfy the
 *
 *   {@link TensorConstraint}.
 *
 * On success it returns the method's {@link ModelMethodMeta}, which can be used
 * to read concrete input/output tensor shapes for pre-allocating scratch
 * tensors.
 * @category Typescript API
 * @param model The compiled model to validate.
 * @param methodName The exported method name to validate (e.g. `'forward'`).
 * @param expectedInputs Ordered list of {@link ValueConstraint}s for each input
 * slot.
 * @param expectedOutputs Ordered list of {@link ValueConstraint}s for each
 * output slot.
 * @returns The {@link ModelMethodMeta} for the validated method.
 * @throws {Error} A human-readable description of which constraint failed.
 */
export function validateModelSchema(
  model: Model,
  methodName: string,
  expectedInputs: readonly ValueConstraint[],
  expectedOutputs: readonly ValueConstraint[]
): ModelMethodMeta {
  if (!model.getMethodNames().includes(methodName))
    throw new Error(`signature validation: '${methodName}' method not found`);

  const meta = model.getMethodMeta(methodName);

  const formatError = (errorMsg: string) => {
    return (
      `signature validation failed for '${methodName}': ${errorMsg}\n` +
      `  Expected: ${JSON.stringify(expectedInputs)} -> ${JSON.stringify(expectedOutputs)}\n` +
      `  Actual:   [${meta.inputTags.join(', ')}] -> [${meta.outputTags.join(', ')}] (metas: ${JSON.stringify(meta.inputTensorMeta)} -> ${JSON.stringify(meta.outputTensorMeta)})`
    );
  };

  if (meta.inputTags.length !== expectedInputs.length) {
    throw new Error(
      formatError(
        `input count mismatch: expected ${expectedInputs.length}, got ${meta.inputTags.length}`
      )
    );
  }
  if (meta.outputTags.length !== expectedOutputs.length) {
    throw new Error(
      formatError(
        `output count mismatch: expected ${expectedOutputs.length}, got ${meta.outputTags.length}`
      )
    );
  }

  try {
    validateTags('input', expectedInputs, meta.inputTags, meta.inputTensorMeta);
    validateTags('output', expectedOutputs, meta.outputTags, meta.outputTensorMeta);
  } catch (e: any) {
    throw new Error(formatError(e.message));
  }

  return meta;
}
