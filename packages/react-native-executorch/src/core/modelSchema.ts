import { type DType } from './tensor';
import { type Model, type ExecuTorchTag, type ModelMethodMeta, type TensorMeta } from './model';

export type SymbolicShape = readonly (number | string)[];
export type TensorConstraint = {
  readonly dtype?: DType;
  readonly shapes?: readonly SymbolicShape[];
};

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

export type ValueConstraint = keyof typeof primitiveTagMap | TensorConstraint;

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
