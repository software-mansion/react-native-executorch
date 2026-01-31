/**
 * Common types used across the React Native Executorch package.
 */

/**
 * Represents a source of a resource, which can be a string (e.g., URL or file path), a number (e.g., resource ID), or an object (e.g., binary data).
 *
 * @category Types
 */
export type ResourceSource = string | number | object;

/**
 * Enum representing the scalar types of tensors.
 *
 * @category Types
 */
export enum ScalarType {
  /**
   * Byte type (8-bit unsigned integer).
   */
  BYTE = 0,
  /**
   * Character type (8-bit signed integer).
   */
  CHAR = 1,
  /**
   * Short integer type (16-bit signed integer).
   */
  SHORT = 2,
  /**
   * Integer type (32-bit signed integer).
   */
  INT = 3,
  /**
   * Long integer type (64-bit signed integer).
   */
  LONG = 4,
  /**
   * Half-precision floating point type (16-bit).
   */
  HALF = 5,
  /**
   * Single-precision floating point type (32-bit).
   */
  FLOAT = 6,
  /**
   * Double-precision floating point type (64-bit).
   */
  DOUBLE = 7,
  /**
   * Boolean type.
   */
  BOOL = 11,
  /**
   * Quantized 8-bit signed integer type.
   */
  QINT8 = 12,
  /**
   * Quantized 8-bit unsigned integer type.
   */
  QUINT8 = 13,
  /**
   * Quantized 32-bit signed integer type.
   */
  QINT32 = 14,
  /**
   * Packed Quantized Unsigned 4-bit Integers type (2 number in 1 byte).
   */
  QUINT4X2 = 16,
  /**
   * Packed Quantized Unsigned 2-bit Integer type (4 numbers in 1 byte).
   */
  QUINT2X4 = 17,
  /**
   * Raw Bits type.
   */
  BITS16 = 22,
  /**
   * Quantized 8-bit floating point type: Sign bit, 5 Exponent bits, 2 Mantissa bits.
   */
  FLOAT8E5M2 = 23,
  /**
   * Quantized 8-bit floating point type: Sign bit, 4 Exponent bits, 3 Mantissa bits.
   */
  FLOAT8E4M3FN = 24,
  /**
   * Quantized 8-bit floating point type with No Unsigned Zero (NUZ): Sign bit, 5 Exponent bits, 2 Mantissa bits.
   */
  FLOAT8E5M2FNUZ = 25,
  /**
   * Quantized 8-bit floating point type with No Unsigned Zero (NUZ): Sign bit, 4 Exponent bits, 3 Mantissa bits.
   */
  FLOAT8E4M3FNUZ = 26,
  /**
   * Unsigned 16-bit integer type.
   */
  UINT16 = 27,
  /**
   * Unsigned 32-bit integer type.
   */
  UINT32 = 28,
  /**
   * Unsigned 64-bit integer type.
   */
  UINT64 = 29,
}

/**
 * Represents the data buffer of a tensor, which can be one of several typed array formats.
 *
 * @category Types
 */
export type TensorBuffer =
  | ArrayBuffer
  | Float32Array
  | Float64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | BigInt64Array
  | BigUint64Array;

/**
 * Represents a pointer to a tensor, including its data buffer, size dimensions, and scalar type.
 *
 * @category Types
 * @property {TensorBuffer} dataPtr - The data buffer of the tensor.
 * @property {number[]} sizes - An array representing the size of each dimension of the tensor.
 * @property {ScalarType} scalarType - The scalar type of the tensor, as defined in the `ScalarType` enum.
 */
export interface TensorPtr {
  dataPtr: TensorBuffer;
  sizes: number[];
  scalarType: ScalarType;
}
