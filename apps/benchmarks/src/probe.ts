/**
 * The raw-output probe.
 *
 * The benchmark runner answers "how fast", and every number it produces is a
 * duration. This answers a different question: "what did the model actually
 * compute on this device". It exists because a class of defect is invisible
 * from the host — software-mansion/react-native-executorch#1406, where Core ML
 * fp16 draws shifted masks and boxes on an iPhone's ANE but is correct
 * everywhere a Mac can run it. A Mac cannot reproduce that at all: its ANE
 * compiler rejects the model outright and Core ML falls back to CPU/GPU without
 * saying so, which is why every host check passed.
 *
 * So the only place the wrong numbers exist is the phone, and the only way to
 * see them is to run the `.pte` there and send the tensors back.
 *
 * Two decisions keep the comparison honest:
 *
 * - **The input arrives as bytes, not as an image.** The host writes a raw
 *   tensor and serves it; the device feeds it verbatim. Nothing here resizes,
 *   normalises or decodes, so a difference in the output cannot be a difference
 *   in preprocessing — which is exactly the confound that would otherwise sit
 *   between a phone and a laptop.
 * - **Outputs go back as raw bytes too**, base64 of the tensor's own buffer,
 *   rather than as rounded JSON numbers. A shift of a fraction of a pixel is
 *   the signal being measured; serialising through decimal text would put noise
 *   of the same order on top of it.
 */

import { download, defaultWorkletRuntime, loadModel, tensor } from 'react-native-executorch';
import type { Model, ModelInput, Tensor, schema } from 'react-native-executorch';
import { runOnRuntimeAsync } from 'react-native-worklets';

import { config } from './config';

type ConcreteDim = schema.ConcreteDim;
type MethodSpec<D extends schema.SymbolicDim> = schema.MethodSpec<D>;
type ParamSpec<D extends schema.SymbolicDim> = schema.ParamSpec<D>;
type TensorSpec<D extends schema.SymbolicDim> = schema.TensorSpec<D>;
type DType = TensorSpec<ConcreteDim>['dtype'];

/** One model to run, as the host describes it. */
export interface ProbeTarget {
  /** Identifies the arm in the report, e.g. `fp16-ane`. */
  readonly id: string;
  /** Where to fetch the `.pte`. */
  readonly modelUrl: string;
  /** Where to fetch the raw input tensor, one file per input slot, in order. */
  readonly inputUrls: readonly string[];
  /** Method to run. Defaults to `forward`. */
  readonly method?: string;
}

/** One output tensor, as it left the device. */
export interface ProbeTensor {
  readonly name: string;
  readonly dtype: DType;
  readonly shape: readonly number[];
  /** Base64 of the tensor's raw little-endian buffer. */
  readonly base64: string;
}

/** What one arm produced. */
export interface ProbeResult {
  readonly id: string;
  readonly status: 'ok' | 'error';
  readonly error?: string;
  readonly backends?: Record<string, readonly string[]>;
  readonly inputShapes?: readonly (readonly number[])[];
  readonly outputs?: readonly ProbeTensor[];
}

const isTensorSpec = <D extends ConcreteDim>(spec: ParamSpec<D>): spec is TensorSpec<D> =>
  spec.kind === 'Tensor';

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Encodes bytes as base64 without depending on a global `btoa` or `Buffer`.
 *
 * Hermes has neither reliably, and a 2.4 MB mask tensor is not something to
 * route through a polyfill of unknown provenance when the whole point of the
 * exercise is that the bytes arrive unaltered.
 * @param bytes The buffer to encode.
 * @returns Standard base64 with padding.
 */
function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!;
    const b = i + 1 < bytes.length ? bytes[i + 1]! : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2]! : 0;
    out += BASE64_ALPHABET[a >> 2];
    out += BASE64_ALPHABET[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < bytes.length ? BASE64_ALPHABET[((b & 15) << 2) | (c >> 6)] : '=';
    out += i + 2 < bytes.length ? BASE64_ALPHABET[c & 63] : '=';
  }
  return out;
}

/** Bytes per element, so a downloaded buffer can be checked against its slot. */
const WIDTH: Record<DType, number> = {
  bool: 1,
  uint8: 1,
  int32: 4,
  int64: 8,
  float32: 4,
};

/**
 * Reads a tensor's contents into a typed array of the right kind.
 * @param source The tensor to read.
 * @param dtype Its element type.
 * @returns The tensor's bytes.
 */
function readBytes(source: Tensor, dtype: DType): Uint8Array {
  switch (dtype) {
    case 'bool':
    case 'uint8': {
      return source.getData(new Uint8Array(source.numel));
    }
    case 'int32': {
      const view = source.getData(new Int32Array(source.numel));
      return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    }
    case 'int64': {
      const view = source.getData(new BigInt64Array(source.numel));
      return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    }
    case 'float32': {
      const view = source.getData(new Float32Array(source.numel));
      return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    }
    default:
      throw new Error(`cannot read a ${dtype} tensor`);
  }
}

/**
 * Writes a downloaded buffer into a tensor slot of the matching dtype.
 * @param target The allocated tensor.
 * @param dtype Its element type.
 * @param bytes The raw buffer fetched from the host.
 */
function writeBytes(target: Tensor, dtype: DType, bytes: ArrayBuffer): void {
  const expected = target.numel * WIDTH[dtype];
  if (bytes.byteLength !== expected) {
    throw new Error(`input is ${bytes.byteLength} bytes, slot wants ${expected}`);
  }
  switch (dtype) {
    case 'bool':
    case 'uint8':
      target.setData(new Uint8Array(bytes));
      return;
    case 'int32':
      target.setData(new Int32Array(bytes));
      return;
    case 'int64':
      target.setData(new BigInt64Array(bytes));
      return;
    case 'float32':
      target.setData(new Float32Array(bytes));
      return;
    default:
      throw new Error(`cannot write a ${dtype} tensor`);
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
 * Resolves a method's tensor shapes, taking every dimension at its maximum.
 *
 * The probe only ever runs models whose shapes are already fixed, so this does
 * not carry the runner's constraint solver; a symbolic dimension is an error
 * here rather than something to guess at, because a guess would silently change
 * what is being compared.
 * @param spec The exported method spec.
 * @returns Input and output shapes, in slot order.
 */
function resolveShapes(spec: MethodSpec<ConcreteDim>) {
  const concrete = (dim: ConcreteDim): number => {
    if (dim.kind === 'constant') return dim.value;
    throw new Error(`method has a non-constant dimension (${dim.kind}); probe needs fixed shapes`);
  };
  return {
    input: spec.inputs
      .filter(isTensorSpec)
      .map((param: TensorSpec<ConcreteDim>) => param.shape.map(concrete)),
    output: spec.outputs
      .filter(isTensorSpec)
      .map((param: TensorSpec<ConcreteDim>) => param.shape.map(concrete)),
  };
}

/**
 * Runs one arm and collects its outputs.
 * @param target The model, its inputs and the method to run.
 * @returns The arm's outputs, or the reason it failed.
 */
export async function runProbeTarget(target: ProbeTarget): Promise<ProbeResult> {
  const method = target.method ?? 'forward';
  const allocated: Tensor[] = [];
  let model: Model | null = null;
  try {
    const modelPath = (await download(target.modelUrl))[0]!;
    const buffers = await Promise.all(
      target.inputUrls.map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${url} returned ${response.status}`);
        return response.arrayBuffer();
      })
    );

    model = await loadOnRuntime(modelPath);
    // `ModelSpec` is a plain record of method name to spec.
    const spec: MethodSpec<ConcreteDim> | undefined = model.schema[method];
    if (!spec) throw new Error(`no method ${method}`);
    const shapes = resolveShapes(spec);

    const inputSpecs = spec.inputs.filter(isTensorSpec);
    if (inputSpecs.length !== buffers.length) {
      throw new Error(`method wants ${inputSpecs.length} input tensors, host sent ${buffers.length}`);
    }
    const inputTensors = inputSpecs.map((param: TensorSpec<ConcreteDim>, index: number) => {
      const allocation = tensor(param.dtype, shapes.input[index]!);
      allocated.push(allocation);
      writeBytes(allocation, param.dtype, buffers[index]!);
      return allocation;
    });

    const outputSpecs = spec.outputs.filter(isTensorSpec);
    const outputTensors = outputSpecs.map((param: TensorSpec<ConcreteDim>, index: number) => {
      const allocation = tensor(param.dtype, shapes.output[index]!);
      allocated.push(allocation);
      return allocation;
    });

    let slot = 0;
    const inputs: ModelInput[] = spec.inputs.map((param: ParamSpec<ConcreteDim>) =>
      isTensorSpec(param) ? inputTensors[slot++]! : null
    );

    const loaded = model;
    const run = () => {
      'worklet';
      loaded.execute(method, inputs, outputTensors);
      return 1;
    };
    // Once to warm whatever the delegate compiles on first use, then the run
    // whose outputs are reported. A Core ML model does its ANE compilation on
    // the first execute, and reporting that pass would conflate a compile with
    // a computation.
    await runOnRuntimeAsync(defaultWorkletRuntime, run);
    await runOnRuntimeAsync(defaultWorkletRuntime, run);

    return {
      id: target.id,
      status: 'ok',
      backends: model.backends,
      inputShapes: shapes.input,
      outputs: outputTensors.map((allocation: Tensor, index: number) => ({
        // The exported spec carries no output names, and the delegate does not
        // preserve the author's order anyway, so slots are identified by
        // position and matched to meaning by shape on the host.
        name: `output_${index}`,
        dtype: outputSpecs[index]!.dtype,
        shape: shapes.output[index]!,
        base64: toBase64(readBytes(allocation, outputSpecs[index]!.dtype)),
      })),
    };
  } catch (error) {
    return { id: target.id, status: 'error', error: String(error) };
  } finally {
    allocated.forEach((allocation) => allocation.dispose());
    model?.dispose();
  }
}

/**
 * Runs every arm the host asked for, reporting each as it lands.
 * @param onResult Called with each arm's result, for the UI and the collector.
 * @returns Every result, in the order the host listed them.
 */
export async function runProbe(
  onResult: (result: ProbeResult) => void
): Promise<readonly ProbeResult[]> {
  const response = await fetch(`${config.sink}/probe-plan`);
  const targets = (await response.json()) as readonly ProbeTarget[];
  const results: ProbeResult[] = [];
  for (const target of targets) {
    const result = await runProbeTarget(target);
    results.push(result);
    onResult(result);
    await fetch(`${config.sink}/probe-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
  }
  return results;
}
