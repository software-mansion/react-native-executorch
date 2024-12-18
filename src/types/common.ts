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

export interface ExecutorchModule {
  error: string | null;
  isReady: boolean;
  isGenerating: boolean;
  forward: (input: ETInput, shape: number[]) => Promise<number[][]>;
  loadMethod: (methodName: string) => Promise<void>;
  loadForward: () => Promise<void>;
}

export type module =
  | _ClassificationModule
  | _StyleTransferModule
  | _ObjectDetectionModule
  | typeof ETModule;
