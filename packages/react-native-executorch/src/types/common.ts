export type ResourceSource = string | number | object;

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
  dataPtr: TensorBuffer;
  sizes: number[];
  scalarType: ScalarType;
}
