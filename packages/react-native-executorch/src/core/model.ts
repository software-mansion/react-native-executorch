import { rnexecutorchJsi } from '../native/bridge';
import type { DType, Tensor } from './tensor';
import type { ExecuTorchTag, ModelSpec, ConcreteDim } from './schema';

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
  readonly name: string;
  /** The number of dimensions. */
  readonly ndim: number;
  /** The total byte size of the tensor buffer. */
  readonly nbytes: number;
  /** The element data type. */
  readonly dtype: DType;
  /** The concrete size of each dimension (e.g. `[1, 3, 224, 224]`). */
  readonly shape: number[];
};

/**
 * Metadata describing a single exported method of an ExecuTorch model.
 * @category Types
 */
export type ModelMethodMeta = {
  /** The exported method name (e.g. `'forward'`). */
  readonly name: string;
  /** The total number of input arguments the method accepts. */
  readonly numInputs: number;
  /** The total number of output values the method returns. */
  readonly numOutputs: number;
  /** Runtime value-tags for each input slot, in order. */
  readonly inputTags: readonly ExecuTorchTag[];
  /** Runtime value-tags for each output slot, in order. */
  readonly outputTags: readonly ExecuTorchTag[];
  /**
   * A map from backend name to a boolean indicating whether this method
   * delegates to that backend.
   */
  readonly usesBackend: Record<string, boolean>;
  /** Detailed tensor metadata for every input tensor slot, in order. */
  readonly inputTensorMeta: readonly TensorMeta[];
  /** Detailed tensor metadata for every output tensor slot, in order. */
  readonly outputTensorMeta: readonly TensorMeta[];
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
  /** The exported spec of this model. */
  readonly spec: ModelSpec<ConcreteDim>;

  /**
   * Returns the list of exported method names available on this model (e.g.
   * `['forward']`).
   */
  getMethodNames(): readonly string[];

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
