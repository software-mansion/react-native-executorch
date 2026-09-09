/**
 * Tightening `ArrayBufferView`s before they cross a worklet runtime boundary.
 *
 * `react-native-worklets` below 0.10.0 rebuilds a view on the target runtime as
 * `new Ctor(buffer)`, which spans the whole backing buffer and loses
 * `byteOffset` and `length` (reanimated #9475 replaced that with a native call
 * carrying both). Measured on a simulator, `new Uint8Array(buffer, 64, 16)`
 * arrives with `length` 1024 on worklets 0.8.3 and 16 on 0.10.4.
 *
 * `src/core/serialization.ts` closes that by copying any non-tight view before
 * the hop, in both directions, so a caller can pass a window into a bigger
 * buffer on any supported worklets version. These suites pin the two halves of
 * that contract: what gets copied, and what must not be.
 */
import { tightenArrayBufferViews } from '../../src/core/serialization';

describe('tightenArrayBufferViews', () => {
  it('copies a view that does not start at zero', () => {
    const buffer = new ArrayBuffer(1024);
    new Uint8Array(buffer).fill(7);
    const window = new Uint8Array(buffer, 64, 16);

    const tightened = tightenArrayBufferViews(window);

    expect(tightened).not.toBe(window);
    expect(tightened.byteOffset).toBe(0);
    expect(tightened.length).toBe(16);
    expect(tightened.buffer.byteLength).toBe(16);
    expect([...tightened]).toEqual([...window]);
  });

  it('copies a view that starts at zero but stops short of the buffer', () => {
    // `subarray(0, n)` is the shape Kokoro trims its audio to, and it is just
    // as wrong on the old serializer as an offset one: the rebuilt view runs to
    // the end of the buffer and picks up whatever follows.
    const source = new Float32Array(64).fill(0.5);
    const head = source.subarray(0, 8);

    const tightened = tightenArrayBufferViews(head);

    expect(tightened).not.toBe(head);
    expect(tightened.length).toBe(8);
    expect(tightened.buffer.byteLength).toBe(8 * Float32Array.BYTES_PER_ELEMENT);
  });

  it('returns a view that already spans its buffer unchanged', () => {
    // The common case, and the one that must not allocate: every buffer coming
    // back from native is tight already.
    const tight = new Uint8Array(32);
    expect(tightenArrayBufferViews(tight)).toBe(tight);
  });

  it('preserves the view type', () => {
    const buffer = new ArrayBuffer(64);
    const view = new Int32Array(buffer, 8, 4);

    const tightened = tightenArrayBufferViews(view);

    expect(tightened).toBeInstanceOf(Int32Array);
    expect(tightened.length).toBe(4);
  });

  it('tightens a DataView', () => {
    const buffer = new ArrayBuffer(64);
    new DataView(buffer).setUint16(16, 0xbeef);
    const view = new DataView(buffer, 16, 2);

    const tightened = tightenArrayBufferViews(view);

    expect(tightened).toBeInstanceOf(DataView);
    expect(tightened.byteOffset).toBe(0);
    expect(tightened.byteLength).toBe(2);
    expect(tightened.getUint16(0)).toBe(0xbeef);
  });

  it('reaches a view nested in an object, as an ImageBuffer carries one', () => {
    const frame = new Uint8Array(new ArrayBuffer(4096), 1024, 12);
    const image = { data: frame, width: 2, height: 2, format: 'rgb' };

    const tightened = tightenArrayBufferViews(image);

    expect(tightened).not.toBe(image);
    expect(tightened.data.length).toBe(12);
    expect(tightened.data.byteOffset).toBe(0);
    expect(tightened.width).toBe(2);
    expect(tightened.format).toBe('rgb');
  });

  it('reaches a view nested in an array, as an args tuple is', () => {
    const window = new Float32Array(new ArrayBuffer(256), 32, 4);

    const [tightened, options] = tightenArrayBufferViews([window, { topk: 3 }]);

    expect(tightened.length).toBe(4);
    expect(options).toEqual({ topk: 3 });
  });

  it('leaves a value alone when nothing inside it needs tightening', () => {
    // Identity, not just equality: an untouched value is never re-allocated,
    // which is what keeps the walk free on the hot path.
    const value = { data: new Uint8Array(8), labels: ['cat', 'dog'], topk: 2 };
    expect(tightenArrayBufferViews(value)).toBe(value);
  });

  it('passes class instances through untouched', () => {
    // A native handle or a Synchronizable must cross as itself; copying it
    // would strip the prototype the other side calls methods on.
    class NativeHandle {
      constructor(public readonly id: number) {}
      dispose() {}
    }
    const handle = new NativeHandle(1);

    const tightened = tightenArrayBufferViews({ handle });

    expect(tightened.handle).toBe(handle);
  });

  it('passes primitives and null through', () => {
    expect(tightenArrayBufferViews(null)).toBeNull();
    expect(tightenArrayBufferViews(undefined)).toBeUndefined();
    expect(tightenArrayBufferViews(42)).toBe(42);
    expect(tightenArrayBufferViews('frame')).toBe('frame');
  });

  it('terminates on a cyclic value', () => {
    const cyclic: Record<string, unknown> = { depth: 0 };
    cyclic.self = cyclic;
    expect(() => tightenArrayBufferViews(cyclic)).not.toThrow();
  });
});
