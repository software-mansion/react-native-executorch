import {
  _ClassificationModule,
  _StyleTransferModule,
  _ObjectDetectionModule,
  ETModule,
  _ETModule,
} from '../native/RnExecutorchModules';

export const getTypeIdentifier = (input: ETInput): number => {
  if (input instanceof Int8Array) return 1;
  if (input instanceof Int32Array) return 3;
  if (input instanceof BigInt64Array) return 4;
  if (input instanceof Float32Array) return 6;
  if (input instanceof Float64Array) return 7;
  return -1;
};

export type ResourceSource = string | number;

export interface LLMType {
  generate: (input: string) => Promise<void>;
  response: string;
  downloadProgress: number;
  error: string | null;
  isModelReady: boolean;
  isReady: boolean;
  interrupt: () => void;
}

export interface ChatType extends LLMType {
  isModelGenerating: boolean;
  isGenerating: boolean;
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
  forward: (
    inputs: ETInput[] | ETInput,
    shapes: number[][]
  ) => ReturnType<_ETModule['forward']>;
  loadMethod: (methodName: string) => Promise<void>;
  loadForward: () => Promise<void>;
}

export type Module =
  | _ClassificationModule
  | _StyleTransferModule
  | _ObjectDetectionModule
  | typeof ETModule;

export type MessageRole = 'user' | 'assistant' | 'system';
export interface MessageType {
  role: MessageRole;
  content: string;
}
