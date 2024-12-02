export type ResourceSource = string | number;

export interface Model {
  generate: (input: string) => Promise<void>;
  response: string;
  downloadProgress: number;
  error: string | null;
  isModelGenerating: boolean;
  isModelReady: boolean;
  interrupt: () => void;
}

export type ETInput =
  | Int8Array
  | Int32Array
  | BigInt64Array
  | Float32Array
  | Float64Array;

export interface ExecutorchModule {
  error: string | null;
  isModelLoading: boolean;
  isModelRunning: boolean;
  forward: (input: ETInput, shape: number[]) => Promise<number[]>;
  loadMethod: (methodName: string) => Promise<void>;
  loadForward: () => Promise<void>;
}
