import { type DType } from './tensor';

export type Range = { min: number; max: number; step?: number };

export type TypedDim =
  | { readonly kind: 'static'; readonly symbol: string }
  | { readonly kind: 'dynamic'; readonly symbol: string; readonly range?: Range }
  | { readonly kind: 'constant'; readonly value: number };

export type TypedShape = readonly TypedDim[];

export type TensorConstraint = {
  readonly kind: 'Tensor';
  readonly dtype?: DType;
  readonly shapes?: readonly TypedShape[];
};

export type ValueConstraint =
  | TensorConstraint
  | { readonly kind: 'None' }
  | { readonly kind: 'Int' }
  | { readonly kind: 'Double' }
  | { readonly kind: 'Bool' }
  | { readonly kind: 'String' };

export type MethodSchema = {
  inputs: ValueConstraint[];
  outputs: ValueConstraint[];
};

export type SymbolicShape = readonly (number | string | TypedDim)[];

export const SymbolicTensor = (dtype?: DType, ...shapes: readonly SymbolicShape[]) => {
  const toTypedShape = (shape: SymbolicShape): TypedShape => {
    return shape.map((dim) => {
      if (typeof dim === 'number') return { kind: 'constant', value: dim } as TypedDim;
      if (typeof dim === 'string') return { kind: 'static', symbol: dim } as TypedDim;
      return dim;
    });
  };
  return { kind: 'Tensor', dtype, shapes: shapes.map(toTypedShape) };
};

type SymbolMap = Map<string, string | number>;

function isRangeCovered(expRange?: Range, actRange?: Range): boolean {
  // Expected takes whatever range actual offers
  if (!expRange) return true;
  // Expected requires a specific range, but actual range is unknown
  if (!actRange) return false;
  // Range containment check
  if (actRange.min > expRange.min || actRange.max < expRange.max) return false;
  // Step and grid alignment
  if (actRange.step !== undefined) {
    if (expRange.step === undefined) return false;
    if (expRange.step % actRange.step !== 0) return false;
    if (Math.abs(expRange.min - actRange.min) % actRange.step !== 0) return false;
  }
  return true;
}

export function matchDim(exp: TypedDim, act: TypedDim, env: SymbolMap): SymbolMap | null {
  const bindSymbol = (key: string, value: string | number) => {
    if (env.has(key)) return env.get(key) === value ? env : null;
    return new Map(env).set(key, value);
  };

  if (exp.kind === 'constant' && act.kind === 'constant') {
    return exp.value === act.value ? env : null;
  }

  if (exp.kind === 'constant' && act.kind === 'dynamic') {
    if (!act.range) return null; // Unknown model range cannot guarantee exp.value

    if (exp.value < act.range.min || exp.value > act.range.max) return null;

    if (act.range.step !== undefined) {
      if (Math.abs(exp.value - act.range.min) % act.range.step !== 0) return null;
    }

    return env;
  }

  if (exp.kind === 'static' && act.kind === 'constant') {
    return bindSymbol(exp.symbol, act.value);
  }

  if (exp.kind === 'static' && act.kind === 'static') {
    return bindSymbol(exp.symbol, act.symbol);
  }

  if (exp.kind === 'dynamic' && act.kind === 'dynamic') {
    if (!isRangeCovered(exp.range, act.range)) return null;
    return bindSymbol(exp.symbol, act.symbol);
  }

  // All remaining combinations fail
  return null;
}

function constraintToString(constraint: ValueConstraint): string {
  if (constraint.kind !== 'Tensor') {
    return constraint.kind;
  }

  const dimToString = (dim: TypedDim) => {
    if (dim.kind === 'constant') return `${dim.value}`;
    if (dim.kind === 'static') return dim.symbol;
    if (dim.range) {
      const stepStr = dim.range.step !== undefined ? `:${dim.range.step}` : '';
      return `${dim.symbol}[${dim.range.min}..${dim.range.max}${stepStr}]`;
    }
    return `Dynamic(${dim.symbol})`;
  };

  const parts: string[] = [];
  if (constraint.dtype !== undefined) {
    parts.push(`dtype=${constraint.dtype}`);
  }
  if (constraint.shapes && constraint.shapes.length > 0) {
    const shapesStr = constraint.shapes
      .map((shape) => `[${shape.map(dimToString).join(', ')}]`)
      .join(' | ');
    parts.push(`shapes=${shapesStr}`);
  }

  return parts.length > 0 ? `Tensor(${parts.join(', ')})` : 'Tensor';
}

export function schemaToString(schema: MethodSchema): string {
  const inputsStr = schema.inputs.map(constraintToString).join(', ');
  const outputsStr = schema.outputs.map(constraintToString).join(', ');
  return `(${inputsStr}) -> (${outputsStr})`;
}

export function validateSchema(expected: MethodSchema, actual: MethodSchema) {
  const formatError = (msg: string) =>
    `${msg}\n` +
    `Expected schema: ${schemaToString(expected)}\n` +
    `Actual schema  : ${schemaToString(actual)}`;

  if (expected.inputs.length !== actual.inputs.length) {
    throw new Error(formatError('Number of inputs does not match!'));
  }
  if (expected.outputs.length !== actual.outputs.length) {
    throw new Error(formatError('Number of outputs does not match!'));
  }

  const expList = [...expected.inputs, ...expected.outputs];
  const actList = [...actual.inputs, ...actual.outputs];

  const match = (index: number, map: SymbolMap): boolean => {
    if (index === expList.length) return true;

    const exp = expList[index]!;
    const act = actList[index]!;

    if (exp.kind !== act.kind) return false;
    if (exp.kind !== 'Tensor') return match(index + 1, map);

    const expTensor = exp as TensorConstraint;
    const actTensor = act as TensorConstraint;

    // DType Sub-typing
    if (expTensor.dtype !== undefined && actTensor.dtype !== expTensor.dtype) {
      return false;
    }

    // Shape Sub-typing
    if (expTensor.shapes && expTensor.shapes.length > 0) {
      if (!actTensor.shapes || actTensor.shapes.length === 0) {
        return false;
      }

      for (const expShape of expTensor.shapes) {
        for (const actShape of actTensor.shapes) {
          if (expShape.length !== actShape.length) continue;

          let currentMap: SymbolMap | null = map;
          for (let dim = 0; dim < expShape.length; dim++) {
            currentMap = matchDim(expShape[dim]!, actShape[dim]!, currentMap);
            if (!currentMap) break;
          }

          if (currentMap && match(index + 1, currentMap)) {
            return true; // Found a globally consistent path!
          }
        }
      }

      return false; // No shape overload satisfied constraints
    }

    // Expected doesn't restrict shapes; any actual shape is valid
    return match(index + 1, map);
  };

  if (!match(0, new Map())) {
    throw new Error(formatError('No possible consistent matching!'));
  }

  return actual;
}
