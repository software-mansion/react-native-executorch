import { tensor } from '../../src/core/tensor';

describe('tensor()', () => {
  it('allocates with the requested dtype and shape', () => {
    const t = tensor('float32', [2, 3, 4]);
    expect(t.dtype).toBe('float32');
    expect([...t.shape]).toEqual([2, 3, 4]);
    expect(t.numel).toBe(24);
    t.dispose();
  });

  it('initializes from a typed array when one is passed', () => {
    const t = tensor('float32', [2, 2], new Float32Array([1.5, -2.5, 3, 4.25]));
    expect([...t.getData(new Float32Array(4))]).toEqual([1.5, -2.5, 3, 4.25]);
    t.dispose();
  });

  it.each([
    ['float32', Float32Array, [1.5, -2.5]],
    ['int32', Int32Array, [7, -9]],
    ['uint8', Uint8Array, [3, 250]],
  ] as const)('round-trips %s data', (dtype, Ctor, values) => {
    const t = tensor(dtype, [2], new Ctor(values as unknown as number[]));
    expect([...t.getData(new Ctor(2))]).toEqual(values);
    t.dispose();
  });

  it('round-trips int64 data through a BigInt64Array', () => {
    const t = tensor('int64', [2], BigInt64Array.from([5n, -7n]));
    expect([...t.getData(new BigInt64Array(2))]).toEqual([5n, -7n]);
    t.dispose();
  });

  it('rejects a source whose byte size does not match', () => {
    const t = tensor('float32', [4]);
    expect(() => t.setData(new Float32Array(3))).toThrow(/bytes/);
    t.dispose();
  });

  it('rejects a destination whose byte size does not match', () => {
    const t = tensor('float32', [4]);
    expect(() => t.getData(new Float32Array(5))).toThrow(/bytes/);
    t.dispose();
  });
});

describe('Tensor.copyTo', () => {
  it('copies the whole tensor by default and returns the destination', () => {
    const src = tensor('float32', [4], new Float32Array([1, 2, 3, 4]));
    const dst = tensor('float32', [4]);

    expect(src.copyTo(dst)).toBe(dst);
    expect([...dst.getData(new Float32Array(4))]).toEqual([1, 2, 3, 4]);

    src.dispose();
    dst.dispose();
  });

  it('copies only the requested window', () => {
    const src = tensor('float32', [5], new Float32Array([1, 2, 3, 4, 5]));
    const dst = tensor('float32', [2]);

    src.copyTo(dst, { offset: 1, length: 2 });
    expect([...dst.getData(new Float32Array(2))]).toEqual([2, 3]);

    src.dispose();
    dst.dispose();
  });

  it('copies to the end of the source when only an offset is given', () => {
    const src = tensor('float32', [4], new Float32Array([1, 2, 3, 4]));
    const dst = tensor('float32', [4]);

    src.copyTo(dst, { offset: 2 });
    expect([...dst.getData(new Float32Array(4))].slice(0, 2)).toEqual([3, 4]);

    src.dispose();
    dst.dispose();
  });

  it('rejects a window that runs past the end of the source', () => {
    const src = tensor('float32', [4]);
    const dst = tensor('float32', [4]);

    expect(() => src.copyTo(dst, { offset: 3, length: 2 })).toThrow(/out of bounds/);

    src.dispose();
    dst.dispose();
  });

  it('flattens across ranks as long as the element count fits', () => {
    const src = tensor('float32', [1, 2, 2], new Float32Array([1, 2, 3, 4]));
    const dst = tensor('float32', [2, 2]);

    src.copyTo(dst);
    expect([...dst.getData(new Float32Array(4))]).toEqual([1, 2, 3, 4]);

    src.dispose();
    dst.dispose();
  });
});

describe('Tensor.through / throughIf', () => {
  it('passes the tensor as the first argument and forwards the rest', () => {
    const t = tensor('float32', [2]);
    const spy = jest.fn((_self: unknown, a: number, b: string) => `${a}${b}`);

    expect(t.through(spy, 1, 'x')).toBe('1x');
    expect(spy).toHaveBeenCalledWith(t, 1, 'x');

    t.dispose();
  });

  it('applies the function only when the predicate holds', () => {
    const t = tensor('float32', [2]);
    const other = tensor('float32', [2]);
    const fn = jest.fn(() => other);

    expect(t.throughIf(false, fn)).toBe(t);
    expect(fn).not.toHaveBeenCalled();

    expect(t.throughIf(true, fn)).toBe(other);
    expect(fn).toHaveBeenCalledTimes(1);

    t.dispose();
    other.dispose();
  });
});

describe('Tensor.dispose', () => {
  it('makes further use an error rather than a silent read of freed memory', () => {
    const t = tensor('float32', [2]);
    t.dispose();
    expect(() => t.getData(new Float32Array(2))).toThrow(/disposed/);
  });

  it('is idempotent', () => {
    const t = tensor('float32', [2]);
    t.dispose();
    expect(() => t.dispose()).not.toThrow();
  });
});
