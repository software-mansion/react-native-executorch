import {
  ConstantDim,
  DynamicDim,
  EnumDim,
  RangeDim,
  StaticDim,
  constr,
  f32,
  i64,
  method,
  validateSpec,
} from '../../src/core/schema';
import { exported } from '../support/fixtures';

// A dimension reference helper, since constraints are written by hand here.
const inputDim = (tensorIdx: number, dimIdx: number) =>
  ({ paramSide: 'input', tensorIdx, dimIdx }) as const;
const outputDim = (tensorIdx: number, dimIdx: number) =>
  ({ paramSide: 'output', tensorIdx, dimIdx }) as const;

describe('dimension constructors', () => {
  it.each([0, -1, 1.5, NaN])('ConstantDim rejects %p', (value) => {
    expect(() => ConstantDim(value)).toThrow(/positive integer/);
  });

  it.each([0, -1, 2.5])('EnumDim rejects the choice %p', (value) => {
    expect(() => EnumDim([1, value])).toThrow(/positive integer/);
  });

  it('RangeDim rejects a non-positive minimum', () => {
    expect(() => RangeDim(0, 10)).toThrow(/range min/);
  });

  it('RangeDim rejects a maximum below the minimum', () => {
    expect(() => RangeDim(10, 5)).toThrow(/max cannot be less than min/);
  });

  it('RangeDim rejects a non-positive step', () => {
    expect(() => RangeDim(1, 10, 0)).toThrow(/range step/);
  });

  it('RangeDim defaults the step to 1', () => {
    expect(RangeDim(1, 10)).toEqual({ kind: 'range', range: { min: 1, max: 10, step: 1 } });
  });

  it('accepts a degenerate range where max equals min', () => {
    expect(RangeDim(4, 4)).toEqual({ kind: 'range', range: { min: 4, max: 4, step: 1 } });
  });
});

describe('SymbolicTensor shorthand', () => {
  it('turns numbers into constants and strings into static symbols', () => {
    expect(f32(1, 'H')).toEqual({
      kind: 'Tensor',
      dtype: 'float32',
      shape: [
        { kind: 'constant', value: 1 },
        { kind: 'static', symbol: 'H' },
      ],
    });
  });

  it('passes explicit dimension objects through unchanged', () => {
    const dim = RangeDim(1, 8);
    expect(f32(dim).shape[0]).toBe(dim);
  });
});

describe('validateSpec — matching', () => {
  it('binds static symbols to the exported constants', () => {
    const match = validateSpec(exported(method('forward', [f32(1, 3, 224, 224)], [f32(1, 1000)])), {
      only: method('forward', [f32(1, 3, 'H', 'W')], [f32(1, 'N')]),
    });

    expect(match.variant).toBe('only');
    expect(match.dims.constant('N', 'H', 'W')).toEqual([1000, 224, 224]);
  });

  it('returns the first variant that matches, not the best one', () => {
    const match = validateSpec(exported(method('forward', [f32(3, 8, 8)], [f32(4)])), {
      batched: method('forward', [f32(1, 3, 'H', 'W')], [f32(1, 'N')]),
      unbatched: method('forward', [f32(3, 'H', 'W')], [f32('N')]),
    });

    expect(match.variant).toBe('unbatched');
  });

  it('reports every variant that failed, with its reason', () => {
    expect(() =>
      validateSpec(exported(method('forward', [f32(3, 8, 8)], [f32(4, 4)])), {
        batched: method('forward', [f32(1, 3, 'H', 'W')], [f32(1, 'N')]),
        unbatched: method('forward', [f32(3, 'H', 'W')], [f32('N')]),
      })
    ).toThrow(/Variant 'batched'[\s\S]*Variant 'unbatched'/);
  });

  it('rejects a dtype mismatch', () => {
    expect(() =>
      validateSpec(exported(method('forward', [i64(4)], [f32(4)])), {
        only: method('forward', [f32(4)], [f32(4)]),
      })
    ).toThrow(/DType mismatch/);
  });

  it('rejects a rank mismatch', () => {
    expect(() =>
      validateSpec(exported(method('forward', [f32(1, 4)], [f32(4)])), {
        only: method('forward', [f32(4)], [f32(4)]),
      })
    ).toThrow(/Rank mismatch/);
  });

  it('rejects a differing input count', () => {
    expect(() =>
      validateSpec(exported(method('forward', [f32(4), f32(4)], [f32(4)])), {
        only: method('forward', [f32(4)], [f32(4)]),
      })
    ).toThrow(/Input count mismatch/);
  });

  it('rejects a differing output count', () => {
    expect(() =>
      validateSpec(exported(method('forward', [f32(4)], [f32(4), f32(4)])), {
        only: method('forward', [f32(4)], [f32(4)]),
      })
    ).toThrow(/Output count mismatch/);
  });

  it('rejects a method the exported model does not have', () => {
    expect(() =>
      validateSpec(exported(method('forward', [f32(4)], [f32(4)])), {
        only: method('encode', [f32(4)], [f32(4)]),
      })
    ).toThrow(/Method 'encode' not found/);
  });

  it('ignores exported methods the allowed spec does not mention', () => {
    const spec = exported({
      ...method('forward', [f32(4)], [f32(4)]),
      ...method('reset', [], []),
    });

    expect(validateSpec(spec, { only: method('forward', [f32(4)], [f32(4)]) }).variant).toBe(
      'only'
    );
  });

  it('rejects a primitive slot matched against a tensor slot', () => {
    expect(() =>
      validateSpec(
        exported({ forward: { inputs: [{ kind: 'Int' }], outputs: [], runtimeConstraints: [] } }),
        {
          only: method('forward', [f32(4)], []),
        }
      )
    ).toThrow(/kind mismatch/);
  });
});

describe('validateSpec — symbol binding', () => {
  it('requires repeated static symbols to bind to the same value', () => {
    expect(() =>
      validateSpec(exported(method('forward', [f32(8, 16)], [f32(4)])), {
        only: method('forward', [f32('S', 'S')], [f32(4)]),
      })
    ).toThrow(/inconsistent bindings/);
  });

  it('accepts repeated static symbols that agree', () => {
    const match = validateSpec(exported(method('forward', [f32(8, 8)], [f32(8)])), {
      only: method('forward', [f32('S', 'S')], [f32('S')]),
    });
    expect(match.dim('S', 'constant')).toBe(8);
  });

  it('binds dynamic symbols to ranges', () => {
    const match = validateSpec(exported(method('forward', [f32(RangeDim(1, 64, 2))], [f32(4)])), {
      only: method('forward', [f32(DynamicDim('L'))], [f32(4)]),
    });
    expect(match.dim('L', 'range')).toEqual({ min: 1, max: 64, step: 2 });
  });

  it('binds dynamic symbols to enums', () => {
    const match = validateSpec(exported(method('forward', [f32(EnumDim([2, 4, 8]))], [f32(4)])), {
      only: method('forward', [f32(DynamicDim('L'))], [f32(4)]),
    });
    expect([...match.dim('L', 'enum')]).toEqual([2, 4, 8]);
  });

  it('treats enum choices as a set, not a sequence', () => {
    const match = validateSpec(exported(method('forward', [f32(EnumDim([8, 2, 4]))], [f32(4)])), {
      only: method('forward', [f32(EnumDim([2, 4, 8]))], [f32(4)]),
    });
    expect(match.variant).toBe('only');
  });

  it('rejects a dynamic symbol bound to a constant', () => {
    expect(() =>
      validateSpec(exported(method('forward', [f32(8)], [f32(4)])), {
        only: method('forward', [f32(DynamicDim('L'))], [f32(4)]),
      })
    ).toThrow(/Cannot match symbolic 'dynamic' with concrete 'constant'/);
  });

  it('rejects a static symbol bound to a range', () => {
    expect(() =>
      validateSpec(exported(method('forward', [f32(RangeDim(1, 8))], [f32(4)])), {
        only: method('forward', [f32(StaticDim('S'))], [f32(4)]),
      })
    ).toThrow(/Cannot match symbolic 'static' with concrete 'range'/);
  });

  it('rejects a range whose bounds differ from the exported ones', () => {
    expect(() =>
      validateSpec(exported(method('forward', [f32(RangeDim(1, 8))], [f32(4)])), {
        only: method('forward', [f32(RangeDim(1, 16))], [f32(4)]),
      })
    ).toThrow(/Range dimension mismatch/);
  });

  it('rejects a symbol used as both static and dynamic', () => {
    expect(() =>
      validateSpec(exported(method('forward', [f32(8), f32(RangeDim(1, 8))], [f32(4)])), {
        only: method('forward', [f32(StaticDim('S')), f32(DynamicDim('S'))], [f32(4)]),
      })
    ).toThrow(/used as both 'static' and 'dynamic'/);
  });

  it('binds symbols across methods of the same spec', () => {
    const spec = exported({
      ...method('encode', [f32(4)], [f32(1, 512)]),
      ...method('decode', [f32(1, 512)], [f32(10)]),
    });

    const match = validateSpec(spec, {
      only: {
        ...method('encode', [f32(4)], [f32(1, 'D')]),
        ...method('decode', [f32(1, 'D')], [f32(10)]),
      },
    });
    expect(match.dim('D', 'constant')).toBe(512);
  });
});

describe('validateSpec — SpecMatch accessors', () => {
  const spec = exported(
    method('forward', [f32(2, RangeDim(1, 8)), f32(EnumDim([16, 32]))], [f32(4)])
  );
  const allowed = {
    only: method('forward', [f32('B', DynamicDim('L')), f32(DynamicDim('E'))], [f32(4)]),
  };

  it('exposes the raw dim when no kind is requested', () => {
    expect(validateSpec(spec, allowed).dim('B')).toEqual({ kind: 'constant', value: 2 });
  });

  it('throws when a symbol is asked for as the wrong kind', () => {
    expect(() => validateSpec(spec, allowed).dim('B', 'range')).toThrow(
      /is 'constant', expected 'range'/
    );
  });

  it("treats 'dynamic' as either range or enum", () => {
    const match = validateSpec(spec, allowed);
    expect(match.dim('L', 'dynamic').kind).toBe('range');
    expect(match.dim('E', 'dynamic').kind).toBe('enum');
    expect(() => match.dim('B', 'dynamic')).toThrow(/is 'constant', expected 'dynamic'/);
  });

  it('throws for a symbol that was never bound', () => {
    expect(() => validateSpec(spec, allowed).dim('nope')).toThrow(/not found in bindings/);
  });

  it('returns batch accessors as tuples in the requested order', () => {
    const match = validateSpec(spec, allowed);
    expect(match.dims.constant('B')).toEqual([2]);
    expect(match.dims.range('L')).toEqual([{ min: 1, max: 8, step: 1 }]);
    expect(match.dims.enum('E').map((choices) => [...choices])).toEqual([[16, 32]]);
    expect(match.dims.any('B', 'E')).toEqual([
      { kind: 'constant', value: 2 },
      { kind: 'enum', choices: [16, 32] },
    ]);
  });
});

describe('validateSpec — runtime constraints', () => {
  const withConstraint = (constraints: Parameters<typeof method>[3]) =>
    exported(
      method(
        'forward',
        [i64(1, RangeDim(1, 128)), i64(1, RangeDim(1, 128))],
        [f32(1, 384)],
        constraints
      )
    );

  const equality = [constr.eq(inputDim(0, 1), inputDim(1, 1))];

  const allowed = (constraints: Parameters<typeof method>[3]) => ({
    only: method(
      'forward',
      [i64(1, DynamicDim('L')), i64(1, DynamicDim('L'))],
      [f32(1, 'D')],
      constraints
    ),
  });

  it('accepts a spec declaring exactly the required constraints', () => {
    expect(validateSpec(withConstraint(equality), allowed(equality)).variant).toBe('only');
  });

  it('rejects a spec missing a required constraint', () => {
    expect(() => validateSpec(withConstraint([]), allowed(equality))).toThrow(
      /Not declared by the exported model spec/
    );
  });

  it('rejects a spec declaring an extra constraint', () => {
    expect(() => validateSpec(withConstraint(equality), allowed([]))).toThrow(
      /unexpected runtime constraints/
    );
  });

  it('matches equality constraints regardless of the order of their dimensions', () => {
    const reversed = [constr.eq(inputDim(1, 1), inputDim(0, 1))];
    expect(validateSpec(withConstraint(reversed), allowed(equality)).variant).toBe('only');
  });

  it('rejects an equality constraint over a different set of dimensions', () => {
    const elsewhere = [constr.eq(inputDim(0, 1), outputDim(0, 1))];
    expect(() => validateSpec(withConstraint(elsewhere), allowed(equality))).toThrow(
      /Not declared by the exported model spec/
    );
  });

  it('matches linear constraints on their coefficients', () => {
    const spec = exported(
      method(
        'forward',
        [f32(RangeDim(1, 64))],
        [f32(RangeDim(1, 64))],
        [constr.linear(outputDim(0, 0), inputDim(0, 0), 2, 1)]
      )
    );

    const same = {
      only: method(
        'forward',
        [f32(DynamicDim('L'))],
        [f32(DynamicDim('L'))],
        [constr.linear(outputDim(0, 0), inputDim(0, 0), 2, 1)]
      ),
    };
    const different = {
      only: method(
        'forward',
        [f32(DynamicDim('L'))],
        [f32(DynamicDim('L'))],
        [constr.linear(outputDim(0, 0), inputDim(0, 0), 2, 0)]
      ),
    };

    expect(validateSpec(spec, same).variant).toBe('only');
    expect(() => validateSpec(spec, different)).toThrow(/Not declared/);
  });

  it('defaults the linear intercept to zero', () => {
    expect(constr.linear(outputDim(0, 0), inputDim(0, 0), 2).coefficients).toEqual([2, 0]);
  });
});

describe('validateSpec — authoring errors', () => {
  const anySpec = exported(method('forward', [f32(4)], [f32(4)]));

  it('rejects an equality constraint over fewer than two dimensions', () => {
    expect(() =>
      validateSpec(anySpec, {
        only: method('forward', [f32(4)], [f32(4)], [constr.eq(inputDim(0, 0))]),
      })
    ).toThrow(/at least two dimensions/);
  });

  it('rejects non-integer linear coefficients', () => {
    expect(() =>
      validateSpec(anySpec, {
        only: method(
          'forward',
          [f32(4)],
          [f32(4)],
          [constr.linear(outputDim(0, 0), inputDim(0, 0), 1.5)]
        ),
      })
    ).toThrow(/Coefficients must be integers/);
  });

  it('rejects a constraint referencing a tensor that does not exist', () => {
    expect(() =>
      validateSpec(anySpec, {
        only: method('forward', [f32(4)], [f32(4)], [constr.eq(inputDim(3, 0), outputDim(0, 0))]),
      })
    ).toThrow(/tensor index out of range/);
  });

  it('rejects a constraint referencing a dimension that does not exist', () => {
    expect(() =>
      validateSpec(anySpec, {
        only: method('forward', [f32(4)], [f32(4)], [constr.eq(inputDim(0, 5), outputDim(0, 0))]),
      })
    ).toThrow(/dimension index out of range/);
  });

  it('surfaces authoring errors before any variant is tried', () => {
    // The second variant would match, but the first one is malformed — a bug
    // in a pipeline's own spec must not be masked by a later variant.
    expect(() =>
      validateSpec(anySpec, {
        broken: method('forward', [f32(4)], [f32(4)], [constr.eq(inputDim(9, 0), outputDim(0, 0))]),
        fine: method('forward', [f32(4)], [f32(4)]),
      })
    ).toThrow(/tensor index out of range/);
  });

  it('rejects an exported spec carrying an invalid dimension domain', () => {
    const invalid = {
      forward: {
        inputs: [{ kind: 'Tensor', dtype: 'float32', shape: [{ kind: 'enum', choices: [] }] }],
        outputs: [],
        runtimeConstraints: [],
      },
    } as never;

    expect(() => validateSpec(invalid, { only: method('forward', [f32(4)], []) })).toThrow(
      /enum must have at least one choice/
    );
  });
});
