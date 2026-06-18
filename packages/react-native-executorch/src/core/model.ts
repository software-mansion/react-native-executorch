import { rnexecutorchJsi } from '../native/bridge';
import type { DType, Tensor } from './tensor';

declare const modelBrand: unique symbol;

export type ModelInput = Tensor | number | boolean | null;
export type ModelOutput = Tensor | number | boolean | null;
export type TensorMeta = {
  name: string;
  ndim: number;
  nbytes: number;
  dtype: DType;
  shape: number[];
};

export type ExecuTorchTag =
  | 'None'
  | 'Tensor'
  | 'Int'
  | 'Double'
  | 'Bool'
  | 'String'
  | 'ListBool'
  | 'ListDouble'
  | 'ListInt'
  | 'ListTensor';

export type ModelMethodMeta = {
  name: string;
  numInputs: number;
  numOutputs: number;
  inputTags: ExecuTorchTag[];
  outputTags: ExecuTorchTag[];
  usesBackend: Record<string, boolean>;
  inputTensorMeta: TensorMeta[];
  outputTensorMeta: TensorMeta[];
};

export interface Model {
  readonly path: string;
  getMethodNames(): string[];
  getMethodMeta(methodName: string): ModelMethodMeta;
  execute(methodName: string, inputs: ModelInput[], outputTensors: Tensor[]): ModelOutput[];
  dispose(): void;

  /**
   * Prevents plain JS objects from being cast as Models.
   * @internal
   */
  readonly [modelBrand]: never;
}

export function loadModel(modelPath: string): Model {
  'worklet';
  return rnexecutorchJsi.loadModel(modelPath) as Model;
}
