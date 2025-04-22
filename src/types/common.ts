export const getTypeIdentifier = (input: ETInput): number => {
  if (input instanceof Int8Array) return 1;
  if (input instanceof Int32Array) return 3;
  if (input instanceof BigInt64Array) return 4;
  if (input instanceof Float32Array) return 6;
  if (input instanceof Float64Array) return 7;
  return -1;
};

export type ResourceSource = string | number | object;

export interface Model {
  generate: (input: string) => Promise<void>;
  response: string;
  downloadProgress: number;
  error: string | null;
  isModelGenerating: boolean;
  isGenerating: boolean;
  isModelReady: boolean;
  isReady: boolean;
  interrupt: () => void;
}

export type ETInput =
  | Int8Array
  | Int32Array
  | BigInt64Array
  | Float32Array
  | Float64Array;

export interface MessageType {
  role: 'user' | 'assistant';
  content: string;
}
