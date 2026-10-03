/**
 * Low-level ExecuTorch model loading, execution, and lifetime management.
 *
 * Provides direct access to compiled `.pte` models in native C++ memory. Loaded
 * models expose synchronous method execution (`execute`) with pre-allocated
 * output buffers and manual native memory cleanup (`dispose`).
 */

import { rnexecutorchJsi } from '../native/bridge';
import type { Tensor } from './tensor';
import type { ModelSpec, ConcreteDim } from './schema';

declare const modelBrand: unique symbol;

/**
 * A value that can be passed as an input to a model's `execute` method.
 * @category Core / Types
 */
export type ModelInput = Tensor | number | boolean | null;

/**
 * A value returned from a model's `execute` method.
 * @category Core / Types
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
 * is no longer needed, call {@link Model.dispose} to release native memory.
 * @category Core / Types
 */
export type Model = {
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
   * @throws {RnExecuTorchError} Thrown with code `EXECUTION_FAILED` if
   * inference fails, `SCHEMA_MISMATCH` if runtime constraints fail,
   * `RESOURCE_BUSY` if the model or a tensor is in use, `RESOURCE_DISPOSED` if
   * disposed, or `INVALID_ARGUMENT` if inputs or output placeholders are
   * invalid.
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
};

/**
 * Configuration options for loading an ExecuTorch model into native memory.
 * @category Core / Types
 */
export type LoadModelOptions = {
  /**
   * Whether to eagerly load and compile all model methods and delegate subgraphs
   * during initialization.
   *
   * When `true` (the default), all exported methods are fully loaded and backend
   * delegates (such as CoreML or Vulkan) are compiled into memory upfront,
   * guaranteeing instantaneous first-inference latency.
   *
   * Set to `false` to lazily load and compile methods on their first execution.
   * @default true
   */
  readonly eagerLoadMethods?: boolean;
};

/**
 * Loads and compiles an ExecuTorch `.pte` model from the local filesystem.
 *
 * The model is loaded synchronously into native memory. Prefer calling this
 * inside a worklet runtime thread (via {@link wrapAsync}) to avoid blocking the
 * JS thread during compilation.
 * @category Core / Functions
 * @param modelPath The absolute local path to the `.pte` model file.
 * @param options Optional loading configuration. See {@link LoadModelOptions}.
 * @returns The compiled {@link Model} instance, ready for execution.
 * @throws {RnExecuTorchError} Thrown with code `LOAD_FAILED` if the model file
 * cannot be opened, has an invalid format, or fails native initialization.
 * @see {@link wrapAsync}
 * @example
 * ```typescript
 * const model = loadModel('/path/to/model.pte');
 * const input = tensor('float32', [1, 3, 224, 224]);
 * const output = tensor('float32', [1, 1000]);
 * try {
 *   model.execute('forward', [input], [output]);
 *   // ...
 * } finally {
 *   input.dispose();
 *   output.dispose();
 *   model.dispose();
 * }
 * ```
 */
export function loadModel(modelPath: string, options?: LoadModelOptions): Model {
  'worklet';
  return rnexecutorchJsi.loadModel(modelPath, options) as Model;
}
