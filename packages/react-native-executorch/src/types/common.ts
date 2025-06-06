export const getTypeIdentifier = (input: ETInput): number => {
  if (input instanceof Int8Array) return 1;
  if (input instanceof Int32Array) return 3;
  if (input instanceof BigInt64Array) return 4;
  if (input instanceof Float32Array) return 6;
  if (input instanceof Float64Array) return 7;
  return -1;
};

export type ResourceSource = string | number | object;

export type ETInput =
  | Int8Array
  | Int32Array
  | BigInt64Array
  | Float32Array
  | Float64Array;

export enum ScalarType {
  BYTE = 0,
  CHAR = 1,
  SHORT = 2,
  INT = 3,
  LONG = 4,
  HALF = 5,
  FLOAT = 6,
  DOUBLE = 7,
  BOOL = 11,
  QINT8 = 12,
  QUINT8 = 13,
  QINT32 = 14,
  QUINT4X2 = 16,
  QUINT2X4 = 17,
  BITS16 = 22,
  FLOAT8E5M2 = 23,
  FLOAT8E4M3FN = 24,
  FLOAT8E5M2FNUZ = 25,
  FLOAT8E4M3FNUZ = 26,
  UINT16 = 27,
  UINT32 = 28,
  UINT64 = 29,
}

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

export interface TensorPtr {
  data: TensorBuffer;
  shape: number[];
  scalarType: ScalarType;
}
