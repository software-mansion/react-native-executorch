import type { DType } from './tensor';
import type { ExecuTorchTag } from './model';

export type Range = { min: number; max: number; step: number };

export type ConcreteDim =
  | { readonly kind: 'constant'; readonly value: number }
  | { readonly kind: 'range'; readonly range: Range };

export type SymbolicDim =
  | ConcreteDim
  | { readonly kind: 'static'; readonly symbol: string }
  | { readonly kind: 'dynamic'; readonly symbol: string };

export type TensorConstraint<D extends SymbolicDim> = {
  readonly kind: 'Tensor';
  readonly dtype: DType;
  readonly shape: readonly D[];
};

export type ValueConstraint<D extends SymbolicDim> =
  | TensorConstraint<D>
  | { readonly kind: Exclude<ExecuTorchTag, 'Tensor'> };

export type MethodSignature<D extends SymbolicDim> = {
  inputs: ValueConstraint<D>[];
  outputs: ValueConstraint<D>[];
};

export type MethodOverloads<D extends SymbolicDim> = readonly MethodSignature<D>[];

export type ModelSchema<D extends SymbolicDim> = Record<string, MethodOverloads<D>>;

export type SymbolicShape = readonly (number | string | SymbolicDim)[];

export const S = (symbol: string): SymbolicDim => {
  return { kind: 'static', symbol };
};

export const D = (symbol: string): SymbolicDim => {
  return { kind: 'dynamic', symbol };
};

export const C = (value: number): ConcreteDim => {
  if (value <= 0 || !Number.isInteger(value)) {
    throw new Error(`Invalid value (${value}): must be a positive integer.`);
  }
  return { kind: 'constant', value };
};

export const R = (range: Range): ConcreteDim => {
  if (range.min < 0) {
    throw new Error(`Invalid range: dimension minimum cannot be negative.`);
  }
  if (range.max < range.min) {
    throw new Error(`Invalid range [${range.min}, ${range.max}]: max cannot be less than min.`);
  }
  if (!Number.isInteger(range.min)) {
    throw new Error(`Invalid range min (${range.min}): must be a non-negative integer.`);
  }
  if (!Number.isInteger(range.max)) {
    throw new Error(`Invalid range max (${range.max}): must be a non-negative integer.`);
  }
  if (range.step <= 0 || !Number.isInteger(range.step)) {
    throw new Error(`Invalid range step (${range.step}): must be a positive integer.`);
  }
  return { kind: 'range', range };
};

export const SymbolicTensor = (dtype: DType, shape: SymbolicShape) => {
  const typedShape = shape.map((dim) => {
    if (typeof dim === 'string') return S(dim);
    if (typeof dim === 'number') return C(dim);
    return dim;
  });
  return { kind: 'Tensor', dtype, shape: typedShape } as TensorConstraint<SymbolicDim>;
};

type SymbolBinding = { symbolic: Exclude<SymbolicDim, ConcreteDim>; concrete: ConcreteDim };
type SymbolBindings = readonly SymbolBinding[];
type MatchResult =
  | { readonly ok: true; readonly bindings: SymbolBindings }
  | { readonly ok: false; readonly error: string };

const ok = (bindings: SymbolBindings): MatchResult => ({ ok: true, bindings });
const err = (error: string): MatchResult => ({ ok: false, error });
const rangesEqual = (r1: Range, r2: Range): boolean => {
  return r1.min === r2.min && r1.max === r2.max && r1.step === r2.step;
};

function matchDim(
  sDim: SymbolicDim,
  cDim: ConcreteDim,
  bindings: SymbolBindings,
  ctx: string
): MatchResult {
  if ('symbol' in sDim) {
    if (bindings.some((b) => b.symbolic.symbol === sDim.symbol && b.symbolic.kind !== sDim.kind)) {
      // returning err(...) here would treat a self-contradictory schema as a
      // simple match failure and move on to the next variant.
      throw new Error(
        `Invalid schema ${ctx}: ${sDim.symbol} is used as both 'static' and 'dynamic'`
      );
    }
  }

  if (sDim.kind === 'constant' && cDim.kind === 'constant') {
    if (sDim.value !== cDim.value) {
      return err(`${ctx}: Constant dimension value mismatch.`);
    }
    return ok(bindings);
  }

  if (sDim.kind === 'range' && cDim.kind === 'range') {
    if (!rangesEqual(sDim.range, cDim.range)) {
      return err(`${ctx}: Range dimension mismatch`);
    }
    return ok(bindings);
  }

  if (sDim.kind === 'static' && cDim.kind === 'constant') {
    const existing = bindings.find((binding) => binding.symbolic.symbol === sDim.symbol);
    if (existing) {
      if (existing.concrete.kind !== 'constant') {
        throw new Error(`Matcher error ${ctx}: 'static' was matched to 'range'`);
      }
      if (cDim.value !== existing.concrete.value) {
        return err(`${ctx}: Symbol '${sDim.symbol}' has inconsistent bindings`);
      }
      return ok(bindings);
    }
    return ok([...bindings, { symbolic: sDim, concrete: cDim }]);
  }

  if (sDim.kind === 'dynamic' && cDim.kind === 'range') {
    const existing = bindings.find((binding) => binding.symbolic.symbol === sDim.symbol);
    if (existing) {
      if (existing.concrete.kind !== 'range') {
        throw new Error(`Matcher error ${ctx}: 'dynamic' was matched to 'constant'`);
      }
      if (!rangesEqual(cDim.range, existing.concrete.range)) {
        return err(`${ctx}: Symbol '${sDim.symbol}' has inconsistent bindings`);
      }
      return ok(bindings);
    }
    return ok([...bindings, { symbolic: sDim, concrete: cDim }]);
  }

  return err(`${ctx}: Cannot match symbolic ${sDim.kind} with concrete ${cDim.kind}.`);
}

function matchSignature(
  symbolicSgn: MethodSignature<SymbolicDim>,
  concreteSgn: MethodSignature<ConcreteDim>,
  bindings: SymbolBindings,
  ctx: string
): MatchResult {
  if (symbolicSgn.inputs.length !== concreteSgn.inputs.length) {
    return err(`${ctx}: Input count mismatch.`);
  }
  if (symbolicSgn.outputs.length !== concreteSgn.outputs.length) {
    return err(`${ctx}: Output count mismatch.`);
  }

  const symbolicConstraints = [...symbolicSgn.inputs, ...symbolicSgn.outputs];
  const concreteConstraints = [...concreteSgn.inputs, ...concreteSgn.outputs];
  const numConstraints = symbolicConstraints.length;

  let currentBindings = bindings;

  for (let c = 0; c < numConstraints; ++c) {
    const isInput = c < symbolicSgn.inputs.length;
    const constraintIdx = isInput ? c : c - concreteSgn.inputs.length;
    const constraintCtx = `${ctx} ${isInput ? 'input' : 'output'} #${constraintIdx}`;

    const symbolicConstr = symbolicConstraints[c]!;
    const concreteConstr = concreteConstraints[c]!;

    if (symbolicConstr.kind !== concreteConstr.kind) {
      return err(`${constraintCtx}: Constraint kind mismatch.`);
    }

    if (symbolicConstr.kind !== 'Tensor' && concreteConstr.kind !== 'Tensor') continue;

    const symbolicTensor = symbolicConstr as TensorConstraint<SymbolicDim>;
    const concreteTensor = concreteConstr as TensorConstraint<ConcreteDim>;

    if (symbolicTensor.dtype !== concreteTensor.dtype) {
      return err(`${constraintCtx}: DType mismatch.`);
    }

    if (symbolicTensor.shape.length !== concreteTensor.shape.length) {
      return err(`${constraintCtx}: Rank mismatch.`);
    }

    const rank = symbolicTensor.shape.length;

    for (let d = 0; d < rank; ++d) {
      const sDim = symbolicTensor.shape[d]!;
      const cDim = concreteTensor.shape[d]!;
      const dimCtx = `${constraintCtx} Tensor dim #${d}`;

      const result = matchDim(sDim, cDim, currentBindings, dimCtx);
      if (!result.ok) return result;
      currentBindings = result.bindings;
    }
  }

  return ok(currentBindings);
}

function matchSchema(
  symbolicSchema: ModelSchema<SymbolicDim>,
  concreteSchema: ModelSchema<ConcreteDim>,
  ctx: string
): MatchResult {
  const methodNames = Object.keys(symbolicSchema);
  for (const methodName of methodNames) {
    if (!concreteSchema[methodName]) {
      return err(`${ctx}: Method '${methodName}' not found in actual schema.`);
    }
  }

  const match = (nameIdx: number, sOverloadIdx: number, bindings: SymbolBindings): MatchResult => {
    if (nameIdx >= methodNames.length) {
      return ok(bindings);
    }

    const methodName = methodNames[nameIdx]!;
    const sOverloads = symbolicSchema[methodName]!;

    if (sOverloadIdx >= sOverloads.length) {
      return match(nameIdx + 1, 0, bindings);
    }

    const cOverloads = concreteSchema[methodName]!;
    const sOverload = sOverloads[sOverloadIdx]!;

    const errors: string[] = [];

    for (const [idx, cOverload] of cOverloads.entries()) {
      const overloadCtx = `${ctx}: Method '${methodName}' (symbolic overload #${sOverloadIdx}, concrete overload #${idx})`;

      const sgnResult = matchSignature(sOverload, cOverload, bindings, overloadCtx);
      if (!sgnResult.ok) {
        errors.push(sgnResult.error);
        continue;
      }

      const matchResult = match(nameIdx, sOverloadIdx + 1, sgnResult.bindings);
      if (!matchResult.ok) {
        errors.push(matchResult.error);
        continue;
      }

      return matchResult;
    }

    return err(`${ctx}: Method '${methodName}' failed matching:\n  - ` + errors.join('\n  - '));
  };

  return match(0, 0, []);
}

export function validateSchema(
  symbolicVariants: ModelSchema<SymbolicDim>[],
  concreteSchema: ModelSchema<ConcreteDim>
): Map<string, number | Range> {
  const errors: string[] = [];

  for (const [idx, symbolicSchema] of symbolicVariants.entries()) {
    const result = matchSchema(symbolicSchema, concreteSchema, `Variant ${idx}`);
    if (!result.ok) {
      errors.push(result.error);
      continue;
    }
    return new Map<string, number | Range>(
      result.bindings.map((binding) => {
        switch (binding.concrete.kind) {
          case 'constant':
            return [binding.symbolic.symbol, binding.concrete.value];
          case 'range':
            return [binding.symbolic.symbol, binding.concrete.range];
        }
      })
    );
  }

  throw new Error(`Model schema doesn't match any of the provided variants:\n` + errors.join('\n'));
}
