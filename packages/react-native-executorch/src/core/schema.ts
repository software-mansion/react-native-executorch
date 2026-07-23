import { type DType } from './tensor';

export type Range = { min: number; max: number; step: number };

export type TypedDim =
  | { readonly kind: 'static'; readonly symbol: string }
  | { readonly kind: 'dynamic'; readonly symbol: string; readonly range?: Range }
  | { readonly kind: 'constant'; readonly value: number };

export type TensorConstraint = {
  readonly kind: 'Tensor';
  readonly dtype?: DType;
  readonly shape?: readonly TypedDim[];
};

export type ValueConstraint =
  | TensorConstraint
  | { readonly kind: 'None' }
  | { readonly kind: 'Int' }
  | { readonly kind: 'Double' }
  | { readonly kind: 'Bool' }
  | { readonly kind: 'String' };

export type MethodSignature = { inputs: ValueConstraint[]; outputs: ValueConstraint[] };

export type MethodOverloads = MethodSignature[];

export type ModelSchema = Record<string, MethodOverloads>;

export type SymbolicShape = readonly (number | string | TypedDim)[];

export type SymbolBinding = {
  readonly exp: Exclude<TypedDim, { kind: 'constant' }>;
  readonly act: TypedDim;
};

export type SymbolBindings = readonly SymbolBinding[];

export type MatchResult =
  | { readonly ok: true; readonly bindings: SymbolBindings }
  | { readonly ok: false; readonly error: string };

const ok = (bindings: SymbolBindings): MatchResult => ({ ok: true, bindings });
const err = (error: string): MatchResult => ({ ok: false, error });

function validateRange(range: Range): void {
  if (range.min < 0) {
    throw new Error(`Invalid range min (${range.min}): dimension minimum cannot be negative.`);
  }
  if (range.max < range.min) {
    throw new Error(`Invalid range [${range.min}, ${range.max}]: max cannot be less than min.`);
  }
  if (range.step <= 0) {
    throw new Error(`Invalid range step (${range.step}): step must be a positive integer.`);
  }
}

export const StaticDim = (symbol: string) => {
  return { kind: 'static', symbol } as TypedDim;
};

export const DynamicDim = (symbol: string, range?: Range) => {
  if (range) validateRange(range);
  return { kind: 'dynamic', symbol, range } as TypedDim;
};

export const ConstantDim = (value: number) => {
  if (value <= 0 || !Number.isInteger(value)) {
    throw new Error(`Invalid value (${value}): must be a positive integer.`);
  }
  return { kind: 'constant', value } as TypedDim;
};

export const SymbolicTensor = (dtype?: DType, shape?: SymbolicShape) => {
  const typedShape = shape?.map((dim) => {
    if (typeof dim === 'string') return StaticDim(dim);
    if (typeof dim === 'number') return ConstantDim(dim);
    return dim;
  });
  return { kind: 'Tensor', dtype, shape: typedShape } as TensorConstraint;
};

function rangesEqual(range1?: Range, range2?: Range): boolean {
  if (range1 === range2) return true;
  if (!range1 || !range2) return false;
  return range1.min === range2.min && range1.max === range2.max && range1.step === range2.step;
}

function dimsEqual(dim1: TypedDim, dim2: TypedDim): boolean {
  if (dim1.kind === 'static' && dim2.kind === 'static') {
    return dim1.symbol === dim2.symbol;
  }
  if (dim1.kind === 'dynamic' && dim2.kind === 'dynamic') {
    return dim1.symbol === dim2.symbol && rangesEqual(dim1.range, dim2.range);
  }
  if (dim1.kind === 'constant' && dim2.kind === 'constant') {
    return dim1.value === dim2.value;
  }
  return false;
}

function matchDim(exp: TypedDim, act: TypedDim, bindings: SymbolBindings, ctx: string) {
  if ('symbol' in act) {
    for (const b of bindings) {
      if ('symbol' in b.act && act.symbol === b.act.symbol && !dimsEqual(act, b.act)) {
        return err(`${ctx}: Actual '${act.symbol}' is used inconsistently across signatures.`);
      }
    }
  }

  if ('symbol' in exp) {
    for (const b of bindings) {
      if (exp.symbol === b.exp.symbol && !dimsEqual(exp, b.exp)) {
        return err(`${ctx}: Expected '${exp.symbol}' is used inconsistently across signatures.`);
      }
    }
  }

  // [constant, constant]
  if (exp.kind === 'constant' && act.kind === 'constant') {
    if (exp.value !== act.value) {
      return err(`${ctx}: Constant dimension value mismatch.`);
    }
    return ok(bindings);
  }

  // [static, *]
  if (exp.kind === 'static') {
    const existing = bindings.find((b) => b.exp.symbol === exp.symbol);
    if (existing) {
      if (!dimsEqual(existing.act, act)) {
        return err(`${ctx}: Static '${exp.symbol}' has inconsistent bindings.`);
      }
      return ok(bindings);
    }
    return ok([...bindings, { exp, act }]);
  }

  // [constant, dynamic]
  if (exp.kind === 'constant' && act.kind === 'dynamic') {
    if (!act.range) {
      return err(`${ctx}: Actual dynamic dimension '${act.symbol}' has an unspecified range.`);
    }
    if (exp.value < act.range.min || act.range.max < exp.value) {
      return err(`${ctx}: Constant ${exp.value} falls outside dynamic range.`);
    }
    if ((exp.value - act.range.min) % act.range.step !== 0) {
      return err(`${ctx}: Constant ${exp.value} does not align with range step.`);
    }
    return ok(bindings);
  }

  // [dynamic, dynamic]
  if (exp.kind === 'dynamic' && act.kind === 'dynamic') {
    const existing = bindings.find((b) => b.exp.symbol === exp.symbol);
    if (existing) {
      if (!dimsEqual(existing.act, act)) {
        return err(`${ctx}: Dynamic '${exp.symbol}' has inconsistent bindings.`);
      }
      return ok(bindings);
    }

    if (exp.range) {
      if (!act.range) {
        return err(`${ctx}: Actual dynamic '${act.symbol}' has an unspecified range.`);
      }
      if (exp.range.min < act.range.min || exp.range.max > act.range.max) {
        return err(`${ctx}: Expected range exceeds accepted actual range.`);
      }
      if ((exp.range.min - act.range.min) % act.range.step !== 0) {
        return err(`${ctx}: Expected min does not align with actual range step.`);
      }
      if (exp.range.step % act.range.step !== 0) {
        return err(`${ctx}: Expected step is not a multiple of accepted step.`);
      }
    }

    return ok([...bindings, { exp, act }]);
  }

  return err(`${ctx}: cannot match expected ${exp.kind} with actual ${act.kind}.`);
}

function matchSignature(
  expSgn: MethodSignature,
  actSgn: MethodSignature,
  initialBindings: SymbolBindings = [],
  ctx: string = ''
): MatchResult {
  if (expSgn.inputs.length !== actSgn.inputs.length) {
    return err(`${ctx}: Input count mismatch.`);
  }
  if (expSgn.outputs.length !== actSgn.outputs.length) {
    return err(`${ctx}: Output count mismatch.`);
  }

  const expConstraints = [...expSgn.inputs, ...expSgn.outputs];
  const actConstraints = [...actSgn.inputs, ...actSgn.outputs];
  const numConstraints = expConstraints.length;

  let currentBindings = initialBindings;

  for (let c = 0; c < numConstraints; ++c) {
    const isInput = c < expSgn.inputs.length;
    const constraintIdx = isInput ? c : c - expSgn.inputs.length;
    const constraintCtx = `${ctx} ${isInput ? 'input' : 'output'} #${constraintIdx}`;

    const expConstr = expConstraints[c]!;
    const actConstr = actConstraints[c]!;

    if (expConstr.kind !== actConstr.kind) {
      return err(`${constraintCtx}: Constraint kind mismatch.`);
    }

    if (expConstr.kind !== 'Tensor' && actConstr.kind !== 'Tensor') continue;

    const expTensor = expConstr as TensorConstraint;
    const actTensor = actConstr as TensorConstraint;

    // Unspecified expTensor.dtype means "whatever dtype actual gives me"
    if (expTensor.dtype && expTensor.dtype !== actTensor.dtype) {
      return err(`${constraintCtx}: DType mismatch.`);
    }

    // Unspecified expTensor.shape means "whatever shape actual gives me"
    if (!expTensor.shape) continue;

    // Unspecified actTensor.shape means "we don't know", throws because there is no way to check it
    if (!actTensor.shape) {
      return err(`${constraintCtx}: Actual tensor shape is missing.`);
    }

    if (expTensor.shape.length !== actTensor.shape.length) {
      return err(`${constraintCtx}: Rank mismatch.`);
    }

    const rank = expTensor.shape.length;
    for (let d = 0; d < rank; ++d) {
      const expDim = expTensor.shape[d]!;
      const actDim = actTensor.shape[d]!;
      const dimCtx = `${constraintCtx} Tensor dim #${d}`;
      const dimResult = matchDim(expDim, actDim, currentBindings, dimCtx);
      if (!dimResult.ok) {
        return dimResult;
      }
      currentBindings = dimResult.bindings;
    }
  }

  return ok(currentBindings);
}

export function matchSchema(expectedSchema: ModelSchema, actualSchema: ModelSchema): MatchResult {
  for (const methodName in expectedSchema) {
    if (!actualSchema[methodName]) {
      return err(`Method '${methodName}' not found in actual schema.`);
    }
  }

  const methodNames = Object.keys(expectedSchema);

  const match = (idx: number, bindings: SymbolBindings): MatchResult => {
    if (idx >= methodNames.length) return ok(bindings);

    const methodName = methodNames[idx]!;
    const expOverloads = expectedSchema[methodName]!;
    const actOverloads = actualSchema[methodName]!;

    const errors: string[] = [];

    for (let e = 0; e < expOverloads.length; ++e) {
      for (let a = 0; a < actOverloads.length; ++a) {
        const sigCtx = `Method '${methodName}' (exp overload #${e}, act overload #${a})`;
        const sigResult = matchSignature(expOverloads[e]!, actOverloads[a]!, bindings, sigCtx);

        if (sigResult.ok) {
          const nextResult = match(idx + 1, sigResult.bindings);
          if (nextResult.ok) {
            return nextResult;
          }
          errors.push(nextResult.error);
        } else {
          errors.push(sigResult.error);
        }
      }
    }

    return err(`Method '${methodName}' failed overload matching:\n  - ` + errors.join('\n  - '));
  };

  return match(0, []);
}

export function validateSchema(expectedVariants: ModelSchema[], actualSchema: ModelSchema) {
  const errors: string[] = [];

  for (let i = 0; i < expectedVariants.length; ++i) {
    const result = matchSchema(expectedVariants[i]!, actualSchema);
    if (result.ok) {
      return actualSchema;
    }
    errors.push(`Variant ${i}:\n${result.error}`);
  }

  throw new Error(`Model schema doesn't match any of the provided variants:\n` + errors.join('\n'));
}
