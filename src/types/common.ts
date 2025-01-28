import {
  _ClassificationModule,
  _StyleTransferModule,
  _ObjectDetectionModule,
  ETModule,
  _ETModule,
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
  forward: (inputs: ETInput[] | ETInput, shapes: number[][]) => ReturnType<_ETModule['forward']>
  loadMethod: (methodName: string) => Promise<void>;
  loadForward: () => Promise<void>;
}

export type Module =
  | _ClassificationModule
  | _StyleTransferModule
  | _ObjectDetectionModule
  | typeof ETModule;
