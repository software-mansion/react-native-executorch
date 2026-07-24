/**
 * Model specs and spec validation.
 *
 * A model spec is a structural contract describing a model's methods: the
 * parameter specs of every input and output (primitive tags, tensor data
 * types, and per-dimension domains) and the runtime constraints the method
 * declares over its tensor dimensions. A spec is either:
 * - **allowed** (`SymbolicDim`) — written by a pipeline to state which models
 *   it can work with. Dimensions may be named symbols: `static` symbols bind
 *   to constant dimensions, `dynamic` symbols to ranges or enums, and reusing
 *   a symbol requires every occurrence to bind to the same domain (nothing
 *   more — symbol reuse implies no runtime relation). Several allowed specs
 *   can be passed as variants; matching any one of them is enough.
 * - **exported** (`ConcreteDim`) — derived from an exported model's metadata,
 *   stating what the model actually provides.
 *
 * Two different validations must not be confused:
 * - **Spec validation** (this module, {@link validateSpec}) — a static,
 *   load-time check that an exported spec satisfies an allowed spec. Dimension
 *   domains must match exactly (symbol binding), and the exported spec must
 *   declare exactly the allowed spec's runtime constraints. Constraints are
 *   matched as declarations only: whether they actually hold is not, and
 *   cannot be, checked here.
 * - **Runtime validation** (the native runtime, not this module) — at
 *   execution time the runtime checks the shapes of concrete tensors against
 *   the dimensions and enforces the declared runtime constraints.
 *
 * Note that only equality constraints on static dimensions are fully decided
 * by spec validation: a constant dimension has exactly one possible value,
 * so equal constants are equal at runtime — no enforcement left. Linear
 * constraints, in contrast, are never evaluated against dimensions here —
 * they are matched as declarations even between constants, so checking them
 * always remains with the runtime.
 * @packageDocumentation
 */
import type { DType } from './tensor';
import type { ExecuTorchTag } from './model';

// ========================================================
// Parameter specs
// ========================================================

/**
 * Inclusive integer domain of a single dynamic dimension — values from `min`
 * to `max` in increments of `step`.
 * @category Types
 */
export type Range = { min: number; max: number; step: number };

/**
 * A single dimension with a fully known domain:
 * - `constant` — exactly `value`.
 * - `range` — any value of a {@link Range}.
 * - `enum` — one of the listed `choices`.
 * @category Types
 */
export type ConcreteDim =
  | { readonly kind: 'constant'; readonly value: number }
  | { readonly kind: 'range'; readonly range: Range }
  | { readonly kind: 'enum'; readonly choices: readonly number[] };

/**
 * A single dimension of an allowed model spec. On top of {@link ConcreteDim}
 * domains, a named symbol binds to the exported spec's dimension at
 * validation: `static` symbols bind to constants, `dynamic` symbols to ranges
 * or enums. Reusing a symbol requires every occurrence to bind to the same
 * domain — it does NOT imply any runtime relation between the dimensions.
 * @category Types
 */
export type SymbolicDim =
  | ConcreteDim
  | { readonly kind: 'static'; readonly symbol: string }
  | { readonly kind: 'dynamic'; readonly symbol: string };

/**
 * Spec of a tensor parameter: the expected element `dtype` and one
 * dimension spec per axis.
 * @category Types
 */
export type TensorSpec<Dim extends SymbolicDim> = {
  readonly kind: 'Tensor';
  readonly dtype: DType;
  readonly shape: readonly Dim[];
};

/**
 * Spec of a single input or output parameter of a method — either a
 * {@link TensorSpec} or a primitive ExecuTorch value tag (`Int`, `Bool`, ...).
 * @category Types
 */
export type ParamSpec<Dim extends SymbolicDim> =
  | TensorSpec<Dim>
  | { readonly kind: Exclude<ExecuTorchTag, 'Tensor'> };

// ========================================================
// Runtime constraints
// ========================================================

/**
 * Reference to a single tensor dimension of a method's input or output.
 * `tensorIdx` counts only tensor parameters (skipping primitives), consistent
 * with ExecuTorch's `inputTensorMeta` / `outputTensorMeta` ordering.
 * @category Types
 */
export type DimRef = {
  readonly io: 'input' | 'output';
  readonly tensorIdx: number;
  readonly dimIdx: number;
};

/**
 * Runtime constraint declaring that all referenced dimensions must be equal
 * to each other in any given execution of the method.
 * @category Types
 */
export type EqualityConstraint = {
  readonly kind: 'equality';
  readonly dims: readonly DimRef[];
};

/**
 * Runtime constraint declaring that two dimensions must satisfy
 * `dimLhs = coefficients[0] * dimRhs + coefficients[1]` (integer
 * coefficients) in any given execution of the method.
 * @category Types
 */
export type LinearConstraint = {
  readonly kind: 'linear';
  readonly dimLhs: DimRef;
  readonly dimRhs: DimRef;
  readonly coefficients: [number, number];
};

/**
 * A requirement on the runtime values of a method's tensor dimensions: the
 * concrete tensors passed to and produced by the method must satisfy it in
 * any given execution. Matched as a declaration during spec validation.
 * @category Types
 */
export type RuntimeConstraint = LinearConstraint | EqualityConstraint;

// ========================================================
// Model specs
// ========================================================

/**
 * Spec of a single model method: the ordered input and output parameter specs
 * and the runtime constraints the method declares over its tensor dimensions.
 * @category Types
 */
export type MethodSpec<Dim extends SymbolicDim> = {
  inputs: readonly ParamSpec<Dim>[];
  outputs: readonly ParamSpec<Dim>[];
  runtimeConstraints: readonly RuntimeConstraint[];
};

/**
 * Spec of a whole model, mapping method names to their {@link MethodSpec}.
 * A `SymbolicDim` spec describes allowed models; a `ConcreteDim` spec
 * describes an exported model.
 * @category Types
 */
export type ModelSpec<Dim extends SymbolicDim> = Record<string, MethodSpec<Dim>>;

/**
 * Shape notation accepted by {@link SymbolicTensor}: numbers become
 * {@link ConstantDim}, strings become {@link StaticDim}, and
 * {@link SymbolicDim} values are used as-is.
 * @category Types
 */
export type SymbolicShape = readonly (number | string | SymbolicDim)[];

// ========================================================
// Dim helper functions
// ========================================================

/**
 * Creates a static symbolic dimension. Static symbols bind to constant
 * dimensions of the exported spec; repeated uses must bind to the same value.
 * @category Typescript API
 * @param symbol The symbol name.
 * @returns The symbolic dimension.
 */
export const StaticDim = (symbol: string): SymbolicDim => {
  return { kind: 'static', symbol };
};

/**
 * Creates a dynamic symbolic dimension. Dynamic symbols bind to range or enum
 * dimensions of the exported spec; repeated uses must bind to the same domain.
 * @category Typescript API
 * @param symbol The symbol name.
 * @returns The symbolic dimension.
 */
export const DynamicDim = (symbol: string): SymbolicDim => {
  return { kind: 'dynamic', symbol };
};

/**
 * Creates a constant dimension matching exactly `value`.
 * @category Typescript API
 * @param value The required dimension size.
 * @returns The concrete dimension.
 * @throws {Error} If `value` is not a positive integer.
 */
export const ConstantDim = (value: number): ConcreteDim => {
  if (value <= 0 || !Number.isInteger(value)) {
    throw new Error(`Invalid value (${value}): must be a positive integer.`);
  }
  return { kind: 'constant', value };
};

/**
 * Creates an enumerated dimension matching one of `choices`.
 * @category Typescript API
 * @param choices The allowed dimension sizes.
 * @returns The concrete dimension.
 * @throws {Error} If any choice is not a positive integer.
 */
export const EnumDim = (choices: readonly number[]): ConcreteDim => {
  if (choices.some((dim) => dim <= 0 || !Number.isInteger(dim))) {
    throw new Error(`Invalid enum choice: must be a positive integer`);
  }
  return { kind: 'enum', choices };
};

/**
 * Creates a range dimension matching values from `min` to `max` in increments
 * of `step`.
 * @category Typescript API
 * @param min The smallest allowed dimension size.
 * @param max The largest allowed dimension size.
 * @param step The increment between allowed sizes. Defaults to 1.
 * @returns The concrete dimension.
 * @throws {Error} If the range bounds or step are not valid positive integers.
 */
export const RangeDim = (min: number, max: number, step?: number): ConcreteDim => {
  if (min < 0 || !Number.isInteger(min)) {
    throw new Error(`Invalid range min (${min}): must be a non-negative integer.`);
  }
  if (max < min) {
    throw new Error(`Invalid range [${min}, ${max}]: max cannot be less than min.`);
  }
  if (!Number.isInteger(max)) {
    throw new Error(`Invalid range max (${max}): must be a non-negative integer.`);
  }
  if (step && (step <= 0 || !Number.isInteger(step))) {
    throw new Error(`Invalid range step (${step}): must be a positive integer.`);
  }
  return { kind: 'range', range: { min, max, step: step ?? 1 } };
};

/**
 * Creates a {@link TensorSpec} from a dtype and a {@link SymbolicShape}:
 * numbers become {@link ConstantDim}, strings become {@link StaticDim}.
 * @category Typescript API
 * @param dtype The expected element data type.
 * @param shape The per-dimension specs.
 * @returns The tensor spec.
 */
export const SymbolicTensor = (dtype: DType, shape: SymbolicShape) => {
  const typedShape = shape.map((dim) => {
    if (typeof dim === 'string') return StaticDim(dim);
    if (typeof dim === 'number') return ConstantDim(dim);
    return dim;
  });
  return { kind: 'Tensor', dtype, shape: typedShape } as TensorSpec<SymbolicDim>;
};

// ========================================================
// Parameter spec validation
// ========================================================

type SymbolBindings = Map<string, ConcreteDim>;

function rangesEqual(r1: Range, r2: Range): boolean {
  return r1.min === r2.min && r1.max === r2.max && r1.step === r2.step;
}

function choicesEqual(c1: readonly number[], c2: readonly number[]): boolean {
  const s1 = new Set(c1);
  const s2 = new Set(c2);
  return s1.size === s2.size && [...s1].every((elem) => s2.has(elem));
}

function matchDim(
  sDim: SymbolicDim,
  cDim: ConcreteDim,
  bindings: SymbolBindings,
  ctx: string
): void {
  if (sDim.kind === 'constant' && cDim.kind === 'constant') {
    if (sDim.value !== cDim.value) {
      throw new Error(`${ctx}: Constant dimension mismatch.`);
    }
    return;
  }

  if (sDim.kind === 'range' && cDim.kind === 'range') {
    if (!rangesEqual(sDim.range, cDim.range)) {
      throw new Error(`${ctx}: Range dimension mismatch.`);
    }
    return;
  }

  if (sDim.kind === 'enum' && cDim.kind === 'enum') {
    if (!choicesEqual(sDim.choices, cDim.choices)) {
      throw new Error(`${ctx}: Enum dimension mismatch.`);
    }
    return;
  }

  if (sDim.kind === 'static' && cDim.kind === 'constant') {
    const bind = bindings.get(sDim.symbol);
    if (bind) {
      if (bind.kind !== 'constant' || bind.value !== cDim.value) {
        throw new Error(`${ctx}: Symbol '${sDim.symbol}' has inconsistent bindings.`);
      }
      return;
    }
    bindings.set(sDim.symbol, cDim);
    return;
  }

  if (sDim.kind === 'dynamic' && (cDim.kind === 'range' || cDim.kind === 'enum')) {
    const bind = bindings.get(sDim.symbol);
    if (bind) {
      const consistentRange =
        bind.kind === 'range' && cDim.kind === 'range' && rangesEqual(bind.range, cDim.range);
      const consistentEnum =
        bind.kind === 'enum' && cDim.kind === 'enum' && choicesEqual(bind.choices, cDim.choices);
      if (!consistentRange && !consistentEnum) {
        throw new Error(`${ctx}: Symbol '${sDim.symbol}' has inconsistent bindings.`);
      }
      return;
    }
    bindings.set(sDim.symbol, cDim);
    return;
  }

  throw new Error(`${ctx}: Cannot match symbolic '${sDim.kind}' with concrete '${cDim.kind}'.`);
}

function matchMethodSpecs(
  allowedMethodSpec: MethodSpec<SymbolicDim>,
  exportedMethodSpec: MethodSpec<ConcreteDim>,
  bindings: SymbolBindings,
  ctx: string
): void {
  if (allowedMethodSpec.inputs.length !== exportedMethodSpec.inputs.length) {
    throw new Error(`${ctx}: Input count mismatch.`);
  }
  if (allowedMethodSpec.outputs.length !== exportedMethodSpec.outputs.length) {
    throw new Error(`${ctx}: Output count mismatch.`);
  }

  const allowedParamSpecs = [...allowedMethodSpec.inputs, ...allowedMethodSpec.outputs];
  const exportedParamSpecs = [...exportedMethodSpec.inputs, ...exportedMethodSpec.outputs];

  for (let p = 0; p < allowedParamSpecs.length; ++p) {
    const isInput = p < allowedMethodSpec.inputs.length;
    const paramSpecIdx = isInput ? p : p - allowedMethodSpec.inputs.length;
    const paramSpecCtx = `${ctx} ${isInput ? 'input' : 'output'} #${paramSpecIdx}`;

    const allowedParamSpec = allowedParamSpecs[p]!;
    const exportedParamSpec = exportedParamSpecs[p]!;

    if (allowedParamSpec.kind !== exportedParamSpec.kind) {
      throw new Error(`${paramSpecCtx}: Param spec kind mismatch.`);
    }

    if (allowedParamSpec.kind !== 'Tensor') continue;

    const allowedTensorSpec = allowedParamSpec as TensorSpec<SymbolicDim>;
    const exportedTensorSpec = exportedParamSpec as TensorSpec<ConcreteDim>;

    if (allowedTensorSpec.dtype !== exportedTensorSpec.dtype) {
      throw new Error(`${paramSpecCtx}: DType mismatch.`);
    }

    if (allowedTensorSpec.shape.length !== exportedTensorSpec.shape.length) {
      throw new Error(`${paramSpecCtx}: Rank mismatch.`);
    }

    for (let d = 0; d < allowedTensorSpec.shape.length; ++d) {
      const dimCtx = `${paramSpecCtx} Tensor dim #${d}`;
      matchDim(allowedTensorSpec.shape[d]!, exportedTensorSpec.shape[d]!, bindings, dimCtx);
    }
  }
}

function matchModelSpecsSymbols(
  allowedModelSpec: ModelSpec<SymbolicDim>,
  exportedModelSpec: ModelSpec<ConcreteDim>,
  bindings: SymbolBindings
): void {
  for (const [methodName, allowedMethodSpec] of Object.entries(allowedModelSpec)) {
    const exportedMethodSpec = exportedModelSpec[methodName];
    if (!exportedMethodSpec) {
      throw new Error(`Method '${methodName}' not found in exported model spec.`);
    }
    matchMethodSpecs(allowedMethodSpec, exportedMethodSpec, bindings, `Method '${methodName}'`);
  }
}

// ========================================================
// Runtime constraints validation
// ========================================================

function refsEqual(r1: DimRef, r2: DimRef): boolean {
  return r1.io === r2.io && r1.tensorIdx === r2.tensorIdx && r1.dimIdx === r2.dimIdx;
}

function constraintsEqual(c1: RuntimeConstraint, c2: RuntimeConstraint): boolean {
  if (c1.kind === 'linear' && c2.kind === 'linear') {
    return (
      refsEqual(c1.dimLhs, c2.dimLhs) &&
      refsEqual(c1.dimRhs, c2.dimRhs) &&
      c1.coefficients[0] === c2.coefficients[0] &&
      c1.coefficients[1] === c2.coefficients[1]
    );
  }

  if (c1.kind === 'equality' && c2.kind === 'equality') {
    if (c1.dims.length !== c2.dims.length) {
      return false;
    }

    const unclaimed = [...c2.dims];
    for (const ref of c1.dims) {
      const idx = unclaimed.findIndex((r) => refsEqual(r, ref));
      if (idx === -1) return false;
      unclaimed.splice(idx, 1);
    }
    return true;
  }

  return false;
}

function resolveDim<D extends SymbolicDim>(methodSpec: MethodSpec<D>, ref: DimRef): D {
  let tensorSpecs: TensorSpec<D>[];
  switch (ref.io) {
    case 'input':
      tensorSpecs = methodSpec.inputs.filter((v): v is TensorSpec<D> => v.kind === 'Tensor');
      break;
    case 'output':
      tensorSpecs = methodSpec.outputs.filter((v): v is TensorSpec<D> => v.kind === 'Tensor');
      break;
  }

  const tensorSpec = tensorSpecs[ref.tensorIdx];
  if (!tensorSpec) {
    throw new Error(`Invalid DimRef (${JSON.stringify(ref)}): tensor index out of range.`);
  }

  const dim = tensorSpec.shape[ref.dimIdx];
  if (!dim) {
    throw new Error(`Invalid DimRef (${JSON.stringify(ref)}): dimension index out of range.`);
  }

  return dim;
}

function matchRuntimeConstraints(
  allowedModelSpec: ModelSpec<SymbolicDim>,
  exportedModelSpec: ModelSpec<ConcreteDim>
): void {
  for (const [methodName, allowedMethodSpec] of Object.entries(allowedModelSpec)) {
    const exportedMethodSpec = exportedModelSpec[methodName];
    if (!exportedMethodSpec) {
      throw new Error(`Method '${methodName}' not found in exported model spec.`);
    }

    const unclaimed = [...exportedMethodSpec.runtimeConstraints];

    for (const [idx, constraint] of allowedMethodSpec.runtimeConstraints.entries()) {
      const find = unclaimed.findIndex((c) => constraintsEqual(c, constraint));
      if (find === -1) {
        throw new Error(`Constraint ${idx}: Not declared by the exported model spec.`);
      }
      unclaimed.splice(find, 1);
    }

    if (unclaimed.length > 0) {
      throw new Error(`'${methodName}': Exported spec declares unexpected runtime constraints`);
    }
  }
}

// ========================================================
// Spec validation
// ========================================================

function verifySymbolKindConsistency(modelSpec: ModelSpec<SymbolicDim>): void {
  const symbolKinds = new Map<string, 'static' | 'dynamic'>();

  for (const methodSpec of Object.values(modelSpec)) {
    for (const paramSpec of [...methodSpec.inputs, ...methodSpec.outputs]) {
      if (paramSpec.kind !== 'Tensor') continue;

      for (const dim of paramSpec.shape) {
        if (!('symbol' in dim)) continue;

        const existing = symbolKinds.get(dim.symbol);
        if (existing && existing !== dim.kind) {
          throw new Error(`Invalid spec: '${dim.symbol}' is used as both 'static' and 'dynamic'.`);
        }
        symbolKinds.set(dim.symbol, dim.kind);
      }
    }
  }
}

function verifyConstraintCorrectness(modelSpec: ModelSpec<SymbolicDim>): void {
  for (const [methodName, methodSpec] of Object.entries(modelSpec)) {
    for (const [idx, constraint] of methodSpec.runtimeConstraints.entries()) {
      const ctx = `Method '${methodName}' constraint ${idx}`;

      if (constraint.kind === 'linear') {
        const [A, B] = constraint.coefficients;
        if (!Number.isInteger(A) || !Number.isInteger(B)) {
          throw new Error(`${ctx}: Coefficients must be integers.`);
        }
        resolveDim(methodSpec, constraint.dimLhs);
        resolveDim(methodSpec, constraint.dimRhs);
      }

      if (constraint.kind === 'equality') {
        if (constraint.dims.length < 2) {
          throw new Error(`${ctx}: Equality requires at least two dimensions.`);
        }
        constraint.dims.forEach((ref) => resolveDim(methodSpec, ref));
      }
    }
  }
}

/**
 * Validates that an exported (concrete) model spec satisfies at least one of
 * the allowed (symbolic) model specs — variants are tried in order and the
 * first match wins. For a variant to match:
 * - Every method exists in the exported spec and its signature matches,
 *   binding each symbol to a constant value (static) or a range/enum
 *   (dynamic). Repeated symbols must bind consistently across the whole spec.
 * - The exported spec declares exactly the same runtime constraints per
 *   method (1-to-1, no missing, no extras). Constraints are matched as
 *   declarations only; whether they hold at runtime is the model's guarantee.
 *
 * Authoring bugs in an allowed spec (conflicting symbol kinds, invalid
 * constraint coefficients or references) throw immediately, before matching.
 * @param allowedModelSpecs The allowed model spec variants to try in order.
 * @param exportedModelSpec The exported model spec to validate against.
 * @returns The symbol bindings of the first matching variant.
 * @throws {Error} A human-readable description of why every variant failed.
 */
export function validateSpec(
  allowedModelSpecs: readonly ModelSpec<SymbolicDim>[],
  exportedModelSpec: ModelSpec<ConcreteDim>
): SymbolBindings {
  allowedModelSpecs.forEach(verifySymbolKindConsistency);
  allowedModelSpecs.forEach(verifyConstraintCorrectness);

  const errors: string[] = [];

  for (const [idx, allowedModelSpec] of allowedModelSpecs.entries()) {
    try {
      const bindings: SymbolBindings = new Map();
      matchModelSpecsSymbols(allowedModelSpec, exportedModelSpec, bindings);
      matchRuntimeConstraints(allowedModelSpec, exportedModelSpec);
      return bindings;
    } catch (e: any) {
      errors.push(`Variant ${idx}: ${e.message}`);
      continue;
    }
  }

  throw new Error(`Spec doesn't match any of the provided variants:\n - ${errors.join('\n - ')}`);
}
