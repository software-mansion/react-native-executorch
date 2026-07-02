import { rnexecutorchJsi } from '../native/bridge';

declare const tensorBrand: unique symbol;

/**
 * Element data type of a {@link Tensor}.
 * @category Types
 */
export type DType = 'float32' | 'uint8' | 'int32' | 'int64';

/**
 * A native ExecuTorch tensor allocated in C++ memory.
 *
 * Tensors are the fundamental data containers used throughout the lower-level
 * API. They carry a fixed data type, an immutable shape, and reside in native
 * heap memory — they must be explicitly released by calling
 * {@link Tensor.dispose} when no longer needed to avoid native memory leaks.
 *
 * Create tensors with the {@link tensor} factory function.
 * @category Types
 */
export type Tensor = {
  /** The element data type of the tensor. */
  readonly dtype: DType;
  /** The concrete size of each dimension (e.g., `[1, 3, 224, 224]`). */
  readonly shape: readonly number[];
  /** The total number of elements stored in the tensor. */
  readonly numel: number;

  /**
   * Copies this tensor's data into another tensor.
   * @param dst The destination tensor to copy data into.
   * @param options Optional configuration for the copy operation.
   * @param options.offset The start offset in elements in the source tensor.
   * Defaults to `0`.
   * @param options.length The number of elements to copy. Defaults to
   * `numel - offset`, i.e. copies from `offset` to the end of the source
   * tensor.
   * @returns The destination tensor `dst`.
   */
  copyTo(dst: Tensor, options?: { offset?: number; length?: number }): Tensor;

  /**
   * Releases the underlying native C++ memory held by this tensor.
   *
   * After calling `dispose`, the tensor must not be used again.
   */
  dispose(): void;

  /**
   * Writes data from a typed array into this tensor's native buffer.
   * @param src The source typed array. Its size in bytes must match the
   * tensor's size. Use a `BigInt64Array` for `int64` tensors.
   * @returns `this` tensor.
   */
  setData(src: Float32Array | Uint8Array | Int32Array | BigInt64Array): Tensor;

  /**
   * Copies data out of this tensor's native buffer into a typed array.
   * @typeParam T The concrete typed-array type to fill.
   * @param dst The destination typed array. Its size in bytes must match
   * tensor's size.
   * @returns The same `dst` array, now filled with tensor data.
   */
  getData<T extends Float32Array | Uint8Array | Int32Array | BigInt64Array>(dst: T): T;

  /**
   * Passes `this` tensor as the first argument to `fn` and returns the result.
   * @typeParam R The return type of `fn`.
   * @typeParam Args The types of any additional arguments forwarded to `fn`.
   * @param fn The function to invoke with `(this, ...args)`.
   * @param args Additional arguments forwarded to `fn`.
   * @returns The return value of `fn`.
   */
  through<R, Args extends any[]>(fn: (t: Tensor, ...args: Args) => R, ...args: Args): R;

  /**
   * Conditionally applies `fn` to `this` tensor when `pred` is `true`,
   * otherwise returns `this` unchanged.
   * @typeParam Args The types of any additional arguments forwarded to `fn`.
   * @param pred When `true`, calls `fn(this, ...args)` and returns the result.
   * When `false`, returns `this` unchanged.
   * @param fn The function to invoke when `pred` is `true`.
   * @param args Additional arguments forwarded to `fn`.
   * @returns The result of `fn` when `pred` is `true`, or `this` otherwise.
   */
  throughIf<Args extends any[]>(
    pred: boolean,
    fn: (t: Tensor, ...args: Args) => Tensor,
    ...args: Args
  ): Tensor;

  /**
   * Prevents plain JS objects from being cast as Tensors. Tensors should only
   * be created via the `tensor` function exported from this module.
   * @internal
   */
  readonly [tensorBrand]: never;
};

/**
 * Allocates a new native tensor with the specified data type and shape.
 *
 * Optionally initializes the tensor's buffer from a typed array `src`. When
 * `src` is omitted the buffer contents are undefined. The returned tensor
 * resides in native C++ memory; call {@link Tensor.dispose} when the tensor is
 * no longer needed.
 * @category Typescript API
 * @param dtype The element data type of the tensor.
 * @param shape An array of dimension sizes (e.g. `[1, 3, 224, 224]`).
 * @param src Optional typed array used to initialize the tensor's data. Its
 * size in bytes must match tensor's size.
 * @returns A newly allocated native tensor.
 */
export function tensor(
  dtype: DType,
  shape: number[],
  src?: Float32Array | Uint8Array | Int32Array | BigInt64Array
): Tensor {
  'worklet';
  const t: Tensor = rnexecutorchJsi.createTensor(shape, dtype);
  if (src) t.setData(src);
  return t;
}
