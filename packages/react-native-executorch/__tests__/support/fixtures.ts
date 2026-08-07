/**
 * Builders for the inputs the task pipelines take: exported model schemas,
 * image buffers, and `execute` implementations that write known values into
 * the pre-allocated output tensors.
 */
import type { ConcreteDim, MethodSpec, ModelSpec, SymbolicDim } from '../../src/core/schema';
import type { ImageBuffer, ImageFormat } from '../../src/extensions/cv/image';
import type { FakeExecute } from './fakeJsi';
import type { FakeTensor } from './fakeTensor';

/**
 * Reinterprets a spec built with the library's own `method`/`f32`/`i64`
 * helpers as an *exported* spec.
 *
 * Fixtures are written with the same helpers a pipeline author uses, which
 * type as `SymbolicDim`. Every dimension is checked to be concrete before the
 * cast, so the assertion cannot quietly hide a stray `StaticDim('H')`.
 * @param spec The spec to reinterpret.
 * @returns The same object, typed as an exported model spec.
 */
export function exported(spec: Record<string, MethodSpec<SymbolicDim>>): ModelSpec<ConcreteDim> {
  for (const [methodName, methodSpec] of Object.entries(spec)) {
    for (const param of [...methodSpec.inputs, ...methodSpec.outputs]) {
      if (param.kind !== 'Tensor') continue;
      for (const dim of param.shape) {
        if (dim.kind === 'static' || dim.kind === 'dynamic') {
          throw new Error(
            `exported(): method '${methodName}' still has the symbolic dimension '${dim.symbol}'`
          );
        }
      }
    }
  }
  return spec as ModelSpec<ConcreteDim>;
}

/**
 * Builds an RGB image buffer whose pixels are a deterministic function of
 * their coordinates, so a preprocessing result can be checked against an
 * independently computed expectation.
 * @param width Image width in pixels.
 * @param height Image height in pixels.
 * @param format Pixel format. Defaults to `'rgb'`.
 * @returns The image buffer.
 */
export function imageBuffer(
  width: number,
  height: number,
  format: ImageFormat = 'rgb'
): ImageBuffer {
  const channels = { rgb: 3, bgr: 3, rgba: 4, bgra: 4, gray: 1 }[format];
  const data = new Uint8Array(width * height * channels);
  for (let i = 0; i < data.length; i++) data[i] = (i * 7) % 256;
  return { data, width, height, format, layout: 'hwc' };
}

/**
 * An `execute` that writes `values[i]` into output tensor `i`, element by
 * element. Shorter arrays leave the remaining elements at zero.
 * @param values Per-output element values.
 * @returns The execute implementation.
 */
export function writesOutputs(...values: readonly (readonly number[])[]): FakeExecute {
  return (_methodName, _inputs, outputs) => {
    outputs.forEach((output, index) => {
      const source = values[index];
      if (!source) return;
      for (let i = 0; i < Math.min(source.length, output.numel); i++) {
        output.setElement(i, source[i]!);
      }
    });
  };
}

/**
 * An `execute` that copies its first input tensor into its first output — an
 * identity model, useful for asserting what preprocessing produced.
 * @returns The execute implementation.
 */
export function copiesInputToOutput(): FakeExecute {
  return (_methodName, inputs, outputs) => {
    const input = inputs[0] as FakeTensor | undefined;
    const output = outputs[0];
    if (!input || !output) return;
    for (let i = 0; i < Math.min(input.numel, output.numel); i++) {
      output.setElement(i, input.getElement(i));
    }
  };
}

/** Preprocessor options every CV task fixture shares. */
export const STRETCH_PREPROCESSING = {
  resizeMode: 'stretch',
  interpolation: 'linear',
  normalizeOpts: { alpha: 1 / 255, beta: 0 },
} as const;
