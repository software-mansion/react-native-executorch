import { rnexecutorchJsi } from '../native/bridge';
import type { Tensor } from './tensor';
import type { ModelSpec, ConcreteDim } from './schema';

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
export type ModelOutput = Tensor | number | boolean | string | null;

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
  /** The exported schema of this model. */
  readonly schema: ModelSpec<ConcreteDim>;
  /** ExecuTorch backends used by a given method. */
  readonly backends: Record<string, readonly string[]>;

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
