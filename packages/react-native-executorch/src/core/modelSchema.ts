import type { DType } from './tensor';
import type { Model, ExecuTorchTag, ModelMethodMeta, TensorMeta } from './model';

/**
 * A named symbolic dimension that acts as a wildcard during shape matching.
 * @category Types
 */
export type StaticDim = { readonly kind: 'static'; readonly symbol: string };

/**
 * A dynamic dimension that additionally requires a companion method to be exported.
 * @category Types
 */
export type DynamicDim = { readonly kind: 'dynamic'; readonly symbol: string };

/**
 * A fixed concrete dimension value.
 * @category Types
 */
export type ConstantDim = { readonly kind: 'constant'; readonly value: number };

/**
 * A symbolic shape as a list of typed dimension constraints.
 * @category Types
 */
export type TypedShape = readonly (StaticDim | DynamicDim | ConstantDim)[];

/**
 * Creates a {@link StaticDim} — a named symbolic dimension that matches any
 * concrete value and resolves consistently within a shape.
 * @category Typescript API
 * @param symbol The symbolic name (e.g. `'H'`, `'W'`, `'N'`).
 * @returns A {@link StaticDim}.
 */
export const Static = (symbol: string): StaticDim => ({ kind: 'static', symbol });

/**
 * Creates a {@link DynamicDim} — like {@link Static} but additionally asserts
 * that the model exports a companion method declaring the runtime-enforced
 * range of this dimension. See {@link validateModelSchema}.
 * @category Typescript API
 * @param symbol The symbolic name for this dynamic dimension.
 * @returns A {@link DynamicDim}.
 */
export const Dynamic = (symbol: string): DynamicDim => ({ kind: 'dynamic', symbol });

/**
 * Creates a {@link ConstantDim} — a fixed dimension that must match exactly.
 * @category Typescript API
 * @param value The exact dimension size.
 * @returns A {@link ConstantDim}.
 */
export const Constant = (value: number): ConstantDim => ({ kind: 'constant', value });

/**
 * A dimension in any accepted format — plain numbers, strings, or typed
 * dimension objects. Used by {@link SymbolicTensor} and {@link matchShape}.
 * @category Types
 */
export type SymbolicDim = number | string | StaticDim | DynamicDim | ConstantDim;

/**
 * A shape that can mix plain numbers, strings, and typed dimension objects.
 * @category Types
 */
export type SymbolicShape = readonly SymbolicDim[];

const toTypedShape = (shape: SymbolicShape): TypedShape =>
  shape.map((dim) => {
    if (typeof dim === 'number') return Constant(dim);
    if (typeof dim === 'string') return Static(dim);
    return dim;
  });

/**
 * A constraint on the dtype and/or shape of a tensor input or output slot.
 * @category Types
 */
export type TensorConstraint = {
  readonly kind: 'tensor';
  readonly dtype?: DType;
  readonly shapes?: readonly TypedShape[];
};

/**
 * A constraint describing an expected input or output slot of a model method.
 * @category Types
 */
export type ValueConstraint =
  | { readonly kind: 'null'; tags: ['None'] }
  | { readonly kind: 'number'; tags: ['Int', 'Double'] }
  | { readonly kind: 'boolean'; tags: ['Bool'] }
  | TensorConstraint;

/**
 * Convenience constructor for a {@link TensorConstraint}.
 *
 * ```ts
 * SymbolicTensor('float32', [1, 3, 'H', 'W'], [3, 'H', 'W'])
 * SymbolicTensor(undefined, [1, 'N'])
 * SymbolicTensor('int64', [1, Dynamic('L')])
 * ```
 * @category Typescript API
 * @param dtype Optional dtype requirement. Pass `undefined` to skip dtype checking.
 * @param shapes One or more acceptable symbolic shapes (plain or typed).
 * @returns A {@link TensorConstraint} object.
 */
export const SymbolicTensor = (
  dtype?: DType,
  ...shapes: readonly SymbolicShape[]
): TensorConstraint => ({ kind: 'tensor', dtype, shapes: shapes.map(toTypedShape) });

/**
 * Checks whether a concrete tensor shape matches at least one of the provided
 * symbolic shapes.
 * @category Typescript API
 * @param actual The concrete shape array to test (e.g. `[1, 3, 224, 224]`).
 * @param expected One or more symbolic shapes to match against.
 * @returns `true` if `actual` matches at least one of the `expected` shapes.
 */
export function matchShape(actual: number[], ...expected: readonly SymbolicShape[]): boolean {
  for (const expShape of expected) {
    if (actual.length !== expShape.length) continue;

    const symbolMap = new Map<string, number>();
    const isMatch = toTypedShape(expShape).every((expDim, i) => {
      const actDim = actual[i]!;
      switch (expDim.kind) {
        case 'constant':
          return actDim === expDim.value;
        case 'static':
        case 'dynamic': {
          if (symbolMap.has(expDim.symbol)) {
            return symbolMap.get(expDim.symbol) === actDim;
          }
          symbolMap.set(expDim.symbol, actDim);
          return true;
        }
      }
    });

    if (isMatch) return true;
  }
  return false;
}

function validateTags(
  side: 'input' | 'output',
  expected: readonly ValueConstraint[],
  actualTags: ExecuTorchTag[],
  tensorMetas: TensorMeta[]
) {
  const numTensors = expected.filter((e) => e.kind === 'tensor').length;
  if (tensorMetas.length !== numTensors)
    throw new Error(
      `${side} tensor count mismatch: expected ${numTensors}, got ${tensorMetas.length}`
    );

  let tIdx = 0;
  expected.forEach((expectedTag, i) => {
    const actualTag = actualTags[i]!;
    switch (expectedTag.kind) {
      case 'null':
      case 'number':
      case 'boolean':
        if (!(expectedTag.tags as ExecuTorchTag[]).includes(actualTag)) {
          throw new Error(
            `${side}[${i}]: expected primitive '${expectedTag.kind}', got '${actualTag}'`
          );
        }
        break;
      case 'tensor':
        if (actualTag !== 'Tensor') {
          throw new Error(`${side}[${i}]: expected Tensor, got primitive '${actualTag}'`);
        }

        const tMeta = tensorMetas[tIdx++]!;
        if (expectedTag.dtype && tMeta.dtype !== expectedTag.dtype) {
          throw new Error(
            `${side}[${i}]: dtype mismatch: expected '${expectedTag.dtype}', got '${tMeta.dtype}'`
          );
        }

        if (expectedTag.shapes?.length && !matchShape(tMeta.shape, ...expectedTag.shapes)) {
          const expectedShapesStr = expectedTag.shapes.map((s) => `[${s.join(',')}]`).join('|');
          throw new Error(
            `${side}[${i}]: shape mismatch: expected shape matching ${expectedShapesStr}, got [${tMeta.shape.join(',')}]`
          );
        }
        break;
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
 *   {@link TensorConstraint}.
 * - That when any tensor input uses {@link Dynamic}, the target method has a
 *   companion method on the model (see below).
 *
 * Companion methods (one per target method, named by replacing `<method>` with
 * the actual method name):
 * - `get_dynamic_dims_<method>` — returns per-input `[rank, 3]` int32 tensors
 *   of `[min, max, step]` bounds.
 * - `get_enumerated_dims_<method>` — returns per-input `[num_shapes, rank]`
 *   int32 tensors of enumerated allowed shapes.
 *
 * On success it returns the method's {@link ModelMethodMeta}, which can be used
 * to read concrete input/output tensor shapes for pre-allocating scratch
 * tensors.
 * @remarks
 * A {@link Static} input dimension only relaxes *validation*. For a dimension
 * that must genuinely vary at runtime (e.g. sequence length), use
 * {@link Dynamic} to assert that the `.pte` was exported with a companion
 * method. Without it, the method only accepts the serialized upper bound.
 * The returned {@link ModelMethodMeta} only contains static upper bounds for
 * dynamic dimensions — the actual runtime range is validated by the C++ layer.
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
  const methodNames = model.getMethodNames();
  if (!methodNames.includes(methodName))
    throw new Error(`signature validation: '${methodName}' method not found`);

  const meta = model.getMethodMeta(methodName);

  const formatError = (errorMsg: string) => {
    return (
      `signature validation failed for '${methodName}': ${errorMsg}\n` +
      `  Expected: ${JSON.stringify(expectedInputs)} -> ${JSON.stringify(expectedOutputs)}\n` +
      `  Actual:   [${meta.inputTags.join(', ')}] -> [${meta.outputTags.join(', ')}]` +
      `  (metas: ${JSON.stringify(meta.inputTensorMeta)} -> ${JSON.stringify(meta.outputTensorMeta)})`
    );
  };

  const companionMethodNames = [
    `get_dynamic_dims_${methodName}`,
    `get_enumerated_dims_${methodName}`,
  ];

  expectedInputs
    .filter((e) => e.kind === 'tensor')
    .forEach((tensor, _) => {
      const hasCompanion = companionMethodNames.some((m) => methodNames.includes(m));
      const hasDynamic = tensor.shapes?.some((shape) =>
        shape.some((dim) => dim.kind === 'dynamic')
      );
      if (hasDynamic && !hasCompanion) {
        throw new Error(
          formatError(
            `'${methodName}' has Dynamic dimension(s) but no companion method` +
              ` ${companionMethodNames.map((m) => `'${m}'`).join(' or ')}`
          )
        );
      }
    });

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
