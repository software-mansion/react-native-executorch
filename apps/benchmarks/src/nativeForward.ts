/**
 * The schema-driven raw-execute pass.
 *
 * A task pipeline's timing folds together three things an ExecuTorch bump can
 * move independently: preprocessing (image resize, tokenization, mel framing),
 * `model.execute` itself, and post-processing (softmax, NMS, colormapping).
 * Only the middle one is ExecuTorch's. This pass isolates it by loading the
 * `.pte` through `loadModel` and calling `execute` directly, with input and
 * output tensors derived from the model's own exported schema — no task code,
 * no pre- or post-processing, no pipeline in between.
 *
 * Deriving the shapes from `model.schema` rather than hard-coding them per model
 * means this works for any `.pte` the registry grows, including every method a
 * multi-method program exports (a Whisper `encode` and `decode` get separate
 * numbers). Where a schema cannot be pinned down to concrete shapes the method
 * is reported as skipped, with the reason, rather than silently dropped.
 */

import { runOnRuntimeAsync } from 'react-native-worklets';
import {
  loadModel,
  tensor,
  defaultWorkletRuntime,
  type ConcreteDim,
  type DimRef,
  type DType,
  type MethodSpec,
  type Model,
  type ModelInput,
  type ParamSpec,
  type Tensor,
  type TensorSpec,
} from 'react-native-executorch';

import { summarize, type Stats } from './stats';
import { timeInWorklet } from './time';

/** Companion method carrying the schema JSON; it runs no compute worth timing. */
const SCHEMA_METHOD = 'get_model_schema';

// Dynamic dimensions are resolved to the largest value their domain allows, so
// the measurement covers the worst case a model can be asked for. These caps
// stop that from turning into an out-of-memory crash on a model whose declared
// maximum is far larger than anything a real caller would pass — an LLM logits
// output at max sequence length is tens of gigabytes.
const MAX_TENSOR_ELEMENTS = 32 * 1024 * 1024;
const MAX_METHOD_ELEMENTS = 128 * 1024 * 1024;

/** Outcome of benchmarking one exported method. */
export interface NativeMethodResult {
  readonly method: string;
  readonly status: 'ok' | 'skipped' | 'error';
  /** Why the method was skipped or how it failed. Absent when `status` is ok. */
  readonly reason?: string;
  /** Resolved input shapes, in slot order; `null` marks a primitive slot. */
  readonly inputShapes?: (readonly number[] | null)[];
  /** Resolved output tensor shapes, in order. */
  readonly outputShapes?: (readonly number[])[];
  /** Per-iteration `execute` timings in milliseconds. */
  readonly stats?: Stats;
}

export interface NativeResult {
  /** Median of {@link NativeResult.load}, kept for readability of the report. */
  readonly loadMs: number;
  /** `loadModel` timings across repeated load/dispose cycles. */
  readonly load: Stats;
  /** ExecuTorch backends the program resolved, keyed by method. */
  readonly backends: Record<string, readonly string[]>;
  readonly methods: NativeMethodResult[];
}

const isTensorSpec = <D extends ConcreteDim>(spec: ParamSpec<D>): spec is TensorSpec<D> =>
  spec.kind === 'Tensor';

/**
 * Takes a dimension at the top of its domain.
 * @param dim The exported dimension domain.
 * @returns The largest value the domain permits.
 */
function resolveDim(dim: ConcreteDim): number {
  switch (dim.kind) {
    case 'constant':
      return dim.value;
    case 'range':
      return dim.range.max;
    case 'enum':
      return dim.choices.reduce((max, choice) => Math.max(max, choice), 1);
  }
}

interface ResolvedShapes {
  readonly input: number[][];
  readonly output: number[][];
}

const dimSlot = (shapes: ResolvedShapes, ref: DimRef): number[] | undefined =>
  (ref.paramSide === 'input' ? shapes.input : shapes.output)[ref.tensorIdx];

/**
 * Resolves every tensor dimension of a method to a concrete size.
 *
 * Dimensions are first taken at their domain maximum, then reconciled against
 * the method's declared runtime constraints — the runtime enforces those at
 * execute time, so shapes that ignore them would simply be rejected. Equality
 * groups collapse to their smallest member (the largest value that stays inside
 * every member's own domain); linear constraints are solved for their left-hand
 * side.
 * @param spec The exported method spec.
 * @returns The resolved input and output tensor shapes.
 */
function resolveShapes(spec: MethodSpec<ConcreteDim>): ResolvedShapes {
  const shapes: ResolvedShapes = {
    input: spec.inputs.filter(isTensorSpec).map((param) => param.shape.map(resolveDim)),
    output: spec.outputs.filter(isTensorSpec).map((param) => param.shape.map(resolveDim)),
  };

  for (const constraint of spec.runtimeConstraints) {
    if (constraint.kind !== 'equality') continue;

    const refs = constraint.dims.filter((ref) => dimSlot(shapes, ref)?.[ref.dimIdx] !== undefined);
    if (refs.length === 0) continue;

    const agreed = refs.reduce(
      (min, ref) => Math.min(min, dimSlot(shapes, ref)![ref.dimIdx]!),
      Number.POSITIVE_INFINITY
    );
    for (const ref of refs) dimSlot(shapes, ref)![ref.dimIdx] = agreed;
  }

  for (const constraint of spec.runtimeConstraints) {
    if (constraint.kind !== 'linear') continue;

    const lhs = dimSlot(shapes, constraint.dimLhs);
    const rhsValue = dimSlot(shapes, constraint.dimRhs)?.[constraint.dimRhs.dimIdx];
    if (!lhs || rhsValue === undefined) continue;

    const [scale, offset] = constraint.coefficients;
    lhs[constraint.dimLhs.dimIdx] = scale * rhsValue + offset;
  }

  return shapes;
}

const numel = (shape: readonly number[]): number =>
  shape.reduce((product, size) => product * size, 1);

/**
 * Decides whether a method can be driven from its schema alone.
 * @param spec The exported method spec.
 * @param shapes The shapes resolved for it.
 * @returns The reason it cannot be benchmarked, or `null` when it can.
 */
function rejectMethod(spec: MethodSpec<ConcreteDim>, shapes: ResolvedShapes): string | null {
  for (const param of spec.inputs) {
    if (isTensorSpec(param)) continue;
    // A primitive slot is filled with a neutral value below. Strings and lists
    // have no neutral value guaranteed to be in-domain for the model.
    if (param.kind !== 'Int' && param.kind !== 'Double' && param.kind !== 'Bool') {
      return `unsupported input slot kind '${param.kind}'`;
    }
  }

  const all = [...shapes.input, ...shapes.output];
  if (all.some((shape) => shape.some((size) => !Number.isInteger(size) || size <= 0))) {
    return 'schema resolved to a non-positive dimension';
  }

  const oversized = all.find((shape) => numel(shape) > MAX_TENSOR_ELEMENTS);
  if (oversized) {
    return `tensor [${oversized.join(', ')}] exceeds the ${MAX_TENSOR_ELEMENTS} element cap`;
  }

  const total = all.reduce((sum, shape) => sum + numel(shape), 0);
  if (total > MAX_METHOD_ELEMENTS) {
    return `method allocates ${total} elements, over the ${MAX_METHOD_ELEMENTS} cap`;
  }

  return null;
}

/**
 * Picks a neutral value for a non-tensor input slot.
 * @param kind The slot's ExecuTorch value tag.
 * @returns `false` for a boolean slot, `0` for a numeric one.
 */
const primitiveFor = (kind: ParamSpec<ConcreteDim>['kind']): ModelInput =>
  kind === 'Bool' ? false : 0;

/**
 * Zeroes a tensor's buffer.
 *
 * Freshly allocated native memory is uninitialized, and the bit patterns it
 * happens to hold are frequently denormal floats — which some CPUs handle in
 * microcode, at a slowdown large enough to swamp whatever the benchmark is
 * trying to detect.
 * @param target The tensor to clear.
 * @param dtype Its element type, which decides the typed array used.
 */
function zero(target: Tensor, dtype: DType): void {
  switch (dtype) {
    case 'uint8':
      target.setData(new Uint8Array(target.numel));
      return;
    case 'int32':
      target.setData(new Int32Array(target.numel));
      return;
    case 'int64':
      target.setData(new BigInt64Array(target.numel));
      return;
    case 'float32':
      target.setData(new Float32Array(target.numel));
  }
}

const loadOnRuntime = (modelPath: string): Promise<Model> =>
  runOnRuntimeAsync(
    defaultWorkletRuntime,
    (path: string) => {
      'worklet';
      return loadModel(path);
    },
    modelPath
  );

/**
 * Times `execute` on a single exported method.
 * @param model The loaded program.
 * @param name The method to run.
 * @param spec The method's exported spec, used to size its tensors.
 * @param iterations Timed iterations.
 * @param warmup Untimed iterations run first.
 * @returns The method's timings, or why it could not be run.
 */
async function benchmarkMethod(
  model: Model,
  name: string,
  spec: MethodSpec<ConcreteDim>,
  iterations: number,
  warmup: number
): Promise<NativeMethodResult> {
  const shapes = resolveShapes(spec);
  const rejection = rejectMethod(spec, shapes);
  if (rejection) return { method: name, status: 'skipped', reason: rejection };

  const allocated: Tensor[] = [];
  try {
    const inputSpecs = spec.inputs.filter(isTensorSpec);
    const inputTensors = inputSpecs.map((param, index) => {
      const allocation = tensor(param.dtype, shapes.input[index]!);
      allocated.push(allocation);
      zero(allocation, param.dtype);
      return allocation;
    });
    const outputTensors = spec.outputs.filter(isTensorSpec).map((param, index) => {
      const allocation = tensor(param.dtype, shapes.output[index]!);
      allocated.push(allocation);
      return allocation;
    });

    let tensorSlot = 0;
    const inputShapes: (readonly number[] | null)[] = [];
    const inputs: ModelInput[] = spec.inputs.map((param) => {
      if (!isTensorSpec(param)) {
        inputShapes.push(null);
        return primitiveFor(param.kind);
      }
      inputShapes.push(shapes.input[tensorSlot]!);
      return inputTensors[tensorSlot++]!;
    });

    const run = () => {
      'worklet';
      model.execute(name, inputs, outputTensors);
      return 1;
    };

    const timed = await timeInWorklet(defaultWorkletRuntime, run, iterations, warmup);
    return {
      method: name,
      status: 'ok',
      inputShapes,
      outputShapes: shapes.output,
      stats: summarize(timed.durations),
    };
  } catch (error) {
    return { method: name, status: 'error', reason: String(error) };
  } finally {
    allocated.forEach((allocation) => allocation.dispose());
  }
}

/**
 * Loads a `.pte` directly and times `execute` on every method it exports.
 * @param modelPath Local path to the `.pte` file.
 * @param iterations Timed iterations per method.
 * @param warmup Untimed iterations per method.
 * @param loadIterations Load/dispose cycles timed to produce a load median.
 * @returns Load timing, resolved backends, and one entry per exported method.
 */
export async function benchmarkNativeForward(
  modelPath: string,
  iterations: number,
  warmup: number,
  loadIterations: number
): Promise<NativeResult> {
  // Each cycle disposes the previous model before timing the next load, so no
  // two loaded copies are ever alive at once and the last one survives the loop
  // for the execute pass below.
  const loadSamples: number[] = [];
  let model: Model | null = null;
  for (let cycle = 0; cycle < Math.max(1, loadIterations); cycle++) {
    model?.dispose();
    const started = performance.now();
    model = await loadOnRuntime(modelPath);
    loadSamples.push(performance.now() - started);
  }

  const load = summarize(loadSamples);
  const loaded = model!;

  try {
    const methods: NativeMethodResult[] = [];
    for (const [name, spec] of Object.entries(loaded.schema)) {
      if (name === SCHEMA_METHOD) continue;
      methods.push(await benchmarkMethod(loaded, name, spec, iterations, warmup));
    }
    return { loadMs: load.median, load, backends: loaded.backends, methods };
  } finally {
    loaded.dispose();
  }
}
