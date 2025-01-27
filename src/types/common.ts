import {
  _ClassificationModule,
  _StyleTransferModule,
  _ObjectDetectionModule,
  ETModule,
} from '../native/RnExecutorchModules';

export type ResourceSource = string | number;

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

export const getTypeIdentifier = (arr: ETInput): number => {
  if (arr instanceof Int8Array) return 0;
  if (arr instanceof Int32Array) return 1;
  if (arr instanceof BigInt64Array) return 2;
  if (arr instanceof Float32Array) return 3;
  if (arr instanceof Float64Array) return 4;

  return -1;
};

export type Module =
  | _ClassificationModule
  | _StyleTransferModule
  | _ObjectDetectionModule
  | typeof ETModule;
