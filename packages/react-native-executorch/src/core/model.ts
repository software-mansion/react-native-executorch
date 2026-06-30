import { rnexecutorchJsi } from '../native/bridge';
import type { DType, Tensor } from './tensor';

declare const modelBrand: unique symbol;

/**
 * A value that can be passed as an input to a model's `execute` method.
 * @category Types
 */
export type ModelInput = Tensor | number | boolean | null;

/**
 * A value returned from a model's `execute` method.
 * @category Types
 */
export type ModelOutput = Tensor | number | boolean | null;

/**
 * Metadata describing a single tensor slot (input or output) of a model method.
 * @category Types
 */
export type TensorMeta = {
  /** The name associated with this tensor slot (may be empty). */
  name: string;
  /** The number of dimensions. */
  ndim: number;
  /** The total byte size of the tensor buffer. */
  nbytes: number;
  /** The element data type. */
  dtype: DType;
  /** The concrete size of each dimension (e.g. `[1, 3, 224, 224]`). */
  shape: number[];
};

/**
 * The ExecuTorch value-tag that classifies the runtime type of a model input or
 * output slot.
 * @category Types
 */
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

/**
 * Metadata describing a single exported method of an ExecuTorch model.
 * @category Types
 */
export type ModelMethodMeta = {
  /** The exported method name (e.g. `'forward'`). */
  name: string;
  /** The total number of input arguments the method accepts. */
  numInputs: number;
  /** The total number of output values the method returns. */
  numOutputs: number;
  /** Runtime value-tags for each input slot, in order. */
  inputTags: ExecuTorchTag[];
  /** Runtime value-tags for each output slot, in order. */
  outputTags: ExecuTorchTag[];
  /**
   * A map from backend name to a boolean indicating whether this method
   * delegates to that backend.
   */
  usesBackend: Record<string, boolean>;
  /** Detailed tensor metadata for every input tensor slot, in order. */
  inputTensorMeta: TensorMeta[];
  /** Detailed tensor metadata for every output tensor slot, in order. */
  outputTensorMeta: TensorMeta[];
};

/**
 * A compiled, ready-to-run ExecuTorch model loaded into native memory.
 *
 * A `Model` exposes the raw ExecuTorch execution interface. It is intentionally
 * low-level and domain-agnostic; higher-level task pipelines build on top of
 * this interface.
 *
 * Obtain a `Model` instance via the {@link loadModel} function. When the model
 * is no longer needed call {@link Model.dispose} to release native memory.
 * @category Types
 */
export interface Model {
  /** The local filesystem path of the `.pte` model file. */
  readonly path: string;

  /**
   * Returns the list of exported method names available on this model (e.g.
   * `['forward']`).
   */
  getMethodNames(): string[];

  /**
   * Returns detailed metadata for the specified exported method, including
   * input/output tags, tensor shapes, dtype, and backend delegation info.
   * @param methodName The name of the exported method to inspect.
   * @returns The {@link ModelMethodMeta} for the requested method.
   */
  getMethodMeta(methodName: string): ModelMethodMeta;

  /**
   * Executes a named model method synchronously.
   *
   * Inputs are provided in the same order as the method's input slots. Output
   * tensors must be pre-allocated and passed in `outputTensors`; the runtime
   * writes results into them in-place and also returns them as the function
   * result.
   * @param methodName The exported method to run (e.g. `'forward'`).
   * @param inputs The list of input values to pass to the method, in order.
   * @param outputTensors Pre-allocated tensors for the method to write outputs
   * into, in order.
   * @returns The list of output values produced by the method, in order.
   */
  execute(methodName: string, inputs: ModelInput[], outputTensors: Tensor[]): ModelOutput[];

  /**
   * Unloads a single previously-executed method, freeing its memory-planned
   * activation arena (and, on graph-compiling backends like CoreML, its
   * compiled graph). The method transparently reloads on its next `execute`.
   *
   * Use this to bound native memory when many distinct methods are executed
   * over a session — e.g. bucketed OCR, where each `detect_<S>`/`recognize_<W>`
   * size that is ever run would otherwise stay resident for the model's
   * lifetime.
   * @param methodName The exported method to unload.
   * @returns `true` if a loaded method was freed, `false` if it was not loaded
   * (a harmless no-op).
   */
  unloadMethod(methodName: string): boolean;

  /**
   * Releases the native ExecuTorch model and frees all associated resources.
   *
   * After calling `dispose`, this model instance must not be used again.
   */
  dispose(): void;

  /**
   * Prevents plain JS objects from being cast as Models.
   * @internal
   */
  readonly [modelBrand]: never;
}

/**
 * Loads and compiles an ExecuTorch `.pte` model from the local filesystem.
 *
 * The model is loaded synchronously into native memory. Prefer calling this
 * inside a worklet runtime thread (via {@link wrapAsync}) to avoid blocking the
 * JS thread during compilation.
 * @category Typescript API
 * @param modelPath The absolute local path to the `.pte` model file.
 * @returns The compiled {@link Model} instance, ready for execution.
 */
export function loadModel(modelPath: string): Model {
  'worklet';
  return rnexecutorchJsi.loadModel(modelPath) as Model;
}
