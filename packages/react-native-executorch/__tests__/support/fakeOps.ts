/**
 * JavaScript implementations of the native operations exposed under
 * `__rnexecutorch_jsi__.{math,cv,speech}`.
 *
 * These follow the contracts documented on the TypeScript wrappers in
 * `src/extensions/`, so a pipeline that composes them produces the values a
 * real device would — which is what makes end-to-end pipeline assertions
 * meaningful. Two deliberate simplifications:
 *
 * - `resize` is nearest-neighbor whatever interpolation is requested. Only
 *   the geometry (stretch / letterbox / crop) is modelled.
 * - `cvtColor` uses the standard luminance weights for grayscale and plain channel
 *   permutation otherwise.
 *
 * The numerical fidelity of the real operators is the C++ suites' job (see
 * `cpp/tests/extensions/`); what is verified here is the pipeline wiring
 * around them.
 */
import type { FakeTensor } from './fakeTensor';

// ============================================================================
// Shared helpers
// ============================================================================

const expectShape = (t: FakeTensor, expected: readonly number[], what: string): void => {
  if (t.shape.length !== expected.length || t.shape.some((d, i) => d !== expected[i])) {
    throw new Error(`${what}: expected shape [${expected}], got [${t.shape}]`);
  }
};

/**
 * Resolves a possibly negative axis against a rank, the way the native ops do.
 */
const resolveAxis = (axis: number, rank: number): number => {
  const resolved = axis < 0 ? rank + axis : axis;
  if (resolved < 0 || resolved >= rank) {
    throw new Error(`axis ${axis} is out of range for a rank-${rank} tensor`);
  }
  return resolved;
};

/**
 * Splits a shape around `axis` into (outer, axis length, inner) strides, so an
 * axis-wise op can be written as a flat triple loop.
 */
const axisLayout = (shape: readonly number[], axis: number) => {
  const outer = shape.slice(0, axis).reduce((a, b) => a * b, 1);
  const length = shape[axis]!;
  const inner = shape.slice(axis + 1).reduce((a, b) => a * b, 1);
  return { outer, length, inner };
};

// ============================================================================
// math
// ============================================================================

export const math = {
  sigmoid(src: FakeTensor, dst: FakeTensor): FakeTensor {
    expectShape(dst, src.shape, 'sigmoid: dst');
    for (let i = 0; i < src.numel; i++) dst.setElement(i, 1 / (1 + Math.exp(-src.getElement(i))));
    return dst;
  },

  softmax(src: FakeTensor, dst: FakeTensor, axis = -1): FakeTensor {
    expectShape(dst, src.shape, 'softmax: dst');
    const { outer, length, inner } = axisLayout(src.shape, resolveAxis(axis, src.shape.length));

    for (let o = 0; o < outer; o++) {
      for (let i = 0; i < inner; i++) {
        const at = (k: number) => (o * length + k) * inner + i;

        let max = -Infinity;
        for (let k = 0; k < length; k++) max = Math.max(max, src.getElement(at(k)));

        let sum = 0;
        for (let k = 0; k < length; k++) {
          const value = Math.exp(src.getElement(at(k)) - max);
          dst.setElement(at(k), value);
          sum += value;
        }
        for (let k = 0; k < length; k++) dst.setElement(at(k), dst.getElement(at(k)) / sum);
      }
    }
    return dst;
  },

  argmax(src: FakeTensor, dst: FakeTensor, axis = -1): FakeTensor {
    const resolved = resolveAxis(axis, src.shape.length);
    const expected = src.shape.map((d, i) => (i === resolved ? 1 : d));
    expectShape(dst, expected, 'argmax: dst');
    const { outer, length, inner } = axisLayout(src.shape, resolved);

    for (let o = 0; o < outer; o++) {
      for (let i = 0; i < inner; i++) {
        let best = 0;
        let bestValue = -Infinity;
        for (let k = 0; k < length; k++) {
          const value = src.getElement((o * length + k) * inner + i);
          if (value > bestValue) {
            bestValue = value;
            best = k;
          }
        }
        dst.setElement(o * inner + i, best);
      }
    }
    return dst;
  },

  threshold(src: FakeTensor, dst: FakeTensor, thresholdVal: number): FakeTensor {
    expectShape(dst, src.shape, 'threshold: dst');
    for (let i = 0; i < src.numel; i++) {
      dst.setElement(i, src.getElement(i) >= thresholdVal ? 1 : 0);
    }
    return dst;
  },
};

// ============================================================================
// cv
// ============================================================================

type ResizeOptions = { mode: string; interpolation: string; padValue: number };

/** Per-format channel counts, mirroring `FORMAT_CHANNELS` in `src/`. */
const CHANNELS: Record<string, number> = { RGB: 3, BGR: 3, RGBA: 4, BGRA: 4, GRAY: 1 };

/** Index of each color in a given format, or -1 when the format has no alpha. */
const ORDER: Record<string, readonly ['R' | 'B', 'G', 'B' | 'R'] | readonly ['GRAY']> = {
  RGB: ['R', 'G', 'B'],
  BGR: ['B', 'G', 'R'],
  RGBA: ['R', 'G', 'B'],
  BGRA: ['B', 'G', 'R'],
  GRAY: ['GRAY'],
};

export const cv = {
  /**
   * Nearest-neighbor resize honouring the three resize modes. `src` and `dst`
   * are HWC with matching channel counts.
   */
  resize(src: FakeTensor, dst: FakeTensor, opts: ResizeOptions): FakeTensor {
    const [srcH, srcW, channels] = src.shape as [number, number, number];
    const [dstH, dstW, dstChannels] = dst.shape as [number, number, number];
    if (channels !== dstChannels) {
      throw new Error(`resize: channel mismatch (${channels} vs ${dstChannels})`);
    }

    // Region of the source that maps onto the destination, and the region of
    // the destination it lands in.
    let scale = 1;
    let padX = 0;
    let padY = 0;
    let cropW = srcW;
    let cropH = srcH;
    let cropX = 0;
    let cropY = 0;

    if (opts.mode === 'letterbox') {
      scale = Math.min(dstW / srcW, dstH / srcH);
      padX = (dstW - srcW * scale) / 2;
      padY = (dstH - srcH * scale) / 2;
      for (let i = 0; i < dst.numel; i++) dst.setElement(i, opts.padValue);
    } else if (opts.mode === 'crop') {
      // Centre-crop the source to the destination aspect ratio, then stretch.
      const targetRatio = dstW / dstH;
      if (srcW / srcH > targetRatio) {
        cropW = Math.round(srcH * targetRatio);
        cropX = Math.floor((srcW - cropW) / 2);
      } else {
        cropH = Math.round(srcW / targetRatio);
        cropY = Math.floor((srcH - cropH) / 2);
      }
    }

    const spanW = opts.mode === 'letterbox' ? srcW * scale : dstW;
    const spanH = opts.mode === 'letterbox' ? srcH * scale : dstH;

    for (let y = 0; y < Math.round(spanH); y++) {
      for (let x = 0; x < Math.round(spanW); x++) {
        const sy = cropY + Math.min(cropH - 1, Math.floor((y * cropH) / spanH));
        const sx = cropX + Math.min(cropW - 1, Math.floor((x * cropW) / spanW));
        const dy = Math.round(padY) + y;
        const dx = Math.round(padX) + x;
        if (dy < 0 || dy >= dstH || dx < 0 || dx >= dstW) continue;
        for (let c = 0; c < channels; c++) {
          dst.setElement(
            (dy * dstW + dx) * channels + c,
            src.getElement((sy * srcW + sx) * channels + c)
          );
        }
      }
    }
    return dst;
  },

  cvtColor(src: FakeTensor, dst: FakeTensor, code: string): FakeTensor {
    const match = /^([A-Z]+)2([A-Z]+)$/.exec(code);
    if (!match) throw new Error(`cvtColor: unrecognized code '${code}'`);
    const [, from, to] = match as unknown as [string, string, string];

    const srcChannels = CHANNELS[from];
    const dstChannels = CHANNELS[to];
    if (srcChannels === undefined || dstChannels === undefined) {
      throw new Error(`cvtColor: unrecognized code '${code}'`);
    }

    const [height, width] = src.shape as [number, number, number];
    expectShape(src, [height, width, srcChannels], `cvtColor(${code}): src`);
    expectShape(dst, [height, width, dstChannels], `cvtColor(${code}): dst`);

    const srcOrder = ORDER[from]!;
    const dstOrder = ORDER[to]!;

    for (let p = 0; p < height * width; p++) {
      const read = (channel: string): number => {
        if (from === 'GRAY') return src.getElement(p);
        const index = srcOrder.indexOf(channel as never);
        return index === -1 ? 0 : src.getElement(p * srcChannels + index);
      };

      if (to === 'GRAY') {
        // Rec. 601 luminance, the same weights OpenCV uses.
        dst.setElement(p, Math.round(0.299 * read('R') + 0.587 * read('G') + 0.114 * read('B')));
        continue;
      }

      if (from === 'GRAY') {
        const gray = src.getElement(p);
        for (let c = 0; c < 3; c++) dst.setElement(p * dstChannels + c, gray);
      } else {
        dstOrder.forEach((channel, c) => dst.setElement(p * dstChannels + c, read(channel)));
      }
      if (dstChannels === 4) dst.setElement(p * dstChannels + 3, 255);
    }
    return dst;
  },

  toChannelsFirst(src: FakeTensor, dst: FakeTensor): FakeTensor {
    const [height, width, channels] = src.shape as [number, number, number];
    expectShape(dst, [channels, height, width], 'toChannelsFirst: dst');
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let c = 0; c < channels; c++) {
          dst.setElement(
            c * height * width + y * width + x,
            src.getElement((y * width + x) * channels + c)
          );
        }
      }
    }
    return dst;
  },

  toChannelsLast(src: FakeTensor, dst: FakeTensor): FakeTensor {
    const [channels, height, width] = src.shape as [number, number, number];
    expectShape(dst, [height, width, channels], 'toChannelsLast: dst');
    for (let c = 0; c < channels; c++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          dst.setElement(
            (y * width + x) * channels + c,
            src.getElement(c * height * width + y * width + x)
          );
        }
      }
    }
    return dst;
  },

  normalize(
    src: FakeTensor,
    dst: FakeTensor,
    opts: { alpha?: number | readonly number[]; beta?: number | readonly number[] }
  ): FakeTensor {
    expectShape(dst, src.shape, 'normalize: dst');
    const channels = src.shape[0]!;
    const perChannel = src.numel / channels;
    const coefficient = (
      value: number | readonly number[] | undefined,
      c: number,
      fallback: number
    ) =>
      value === undefined ? fallback : typeof value === 'number' ? value : (value[c] ?? fallback);

    for (let i = 0; i < src.numel; i++) {
      const c = Math.floor(i / perChannel);
      const alpha = coefficient(opts.alpha, c, 1 / 255);
      const beta = coefficient(opts.beta, c, 0);
      dst.setElement(i, src.getElement(i) * alpha + beta);
    }
    return dst;
  },

  applyColormap(
    src: FakeTensor,
    dst: FakeTensor,
    colormap: readonly (readonly [number, number, number, number])[]
  ): FakeTensor {
    const pixels = src.numel;
    expectShape(dst, [...src.shape.slice(0, 2), 4], 'applyColormap: dst');
    for (let p = 0; p < pixels; p++) {
      const index = src.getElement(p);
      const color = colormap[index];
      if (!color) throw new Error(`applyColormap: class index ${index} has no color`);
      for (let c = 0; c < 4; c++) dst.setElement(p * 4 + c, color[c]!);
    }
    return dst;
  },

  nms(
    boxes: FakeTensor,
    scores: FakeTensor,
    opts: {
      boxFormat: string;
      iouThreshold: number;
      confidenceThreshold: number;
      nmsType: 'standard' | 'weighted';
    }
  ): number[] | number[][] {
    const count = scores.numel;
    const corners = (index: number): [number, number, number, number] => {
      const a = boxes.getElement(index * 4);
      const b = boxes.getElement(index * 4 + 1);
      const c = boxes.getElement(index * 4 + 2);
      const d = boxes.getElement(index * 4 + 3);
      switch (opts.boxFormat) {
        case 'xyxy':
          return [a, b, c, d];
        case 'xywh':
          return [a, b, a + c, b + d];
        case 'cxcywh':
          return [a - c / 2, b - d / 2, a + c / 2, b + d / 2];
        default:
          throw new Error(`nms: unrecognized box format '${opts.boxFormat}'`);
      }
    };

    const iou = (i: number, j: number): number => {
      const [ax0, ay0, ax1, ay1] = corners(i);
      const [bx0, by0, bx1, by1] = corners(j);
      const width = Math.max(0, Math.min(ax1, bx1) - Math.max(ax0, bx0));
      const height = Math.max(0, Math.min(ay1, by1) - Math.max(ay0, by0));
      const overlap = width * height;
      const union = (ax1 - ax0) * (ay1 - ay0) + (bx1 - bx0) * (by1 - by0) - overlap;
      return union <= 0 ? 0 : overlap / union;
    };

    const candidates = Array.from({ length: count }, (_, i) => i)
      .filter((i) => scores.getElement(i) >= opts.confidenceThreshold)
      .sort((a, b) => scores.getElement(b) - scores.getElement(a));

    const kept: number[] = [];
    const groups: number[][] = [];
    const suppressed = new Set<number>();

    for (const index of candidates) {
      if (suppressed.has(index)) continue;
      kept.push(index);
      const group = [index];
      for (const other of candidates) {
        if (other === index || suppressed.has(other)) continue;
        if (iou(index, other) > opts.iouThreshold) {
          suppressed.add(other);
          group.push(other);
        }
      }
      groups.push(group);
    }

    return opts.nmsType === 'weighted' ? groups : kept;
  },

  restrictToBox(
    src: FakeTensor,
    dst: FakeTensor,
    box: readonly [number, number, number, number],
    format: string
  ): FakeTensor {
    expectShape(dst, src.shape, 'restrictToBox: dst');
    const [a, b, c, d] = box;
    const [x0, y0, x1, y1] =
      format === 'xyxy'
        ? [a, b, c, d]
        : format === 'xywh'
          ? [a, b, a + c, b + d]
          : [a - c / 2, b - d / 2, a + c / 2, b + d / 2];

    const [height, width, channels] = [src.shape[0]!, src.shape[1]!, src.shape[2] ?? 1];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const inside = x >= x0 && x < x1 && y >= y0 && y < y1;
        for (let ch = 0; ch < channels; ch++) {
          const at = (y * width + x) * channels + ch;
          dst.setElement(at, inside ? src.getElement(at) : 0);
        }
      }
    }
    return dst;
  },
};

// ============================================================================
// speech
// ============================================================================

export const speech = {
  /**
   * Frames a waveform exactly as documented on `extractFrames`: per-frame mean
   * removal, pre-emphasis, Hann windowing, into zero-padded rows of `dst`.
   */
  extractFrames(
    waveform: FakeTensor,
    hann: FakeTensor,
    dst: FakeTensor,
    options: { numFrames: number; hopLength: number; preemphasis: number }
  ): FakeTensor {
    const frameLength = hann.numel;
    const [rows, fftLength] = dst.shape as [number, number];
    if (options.numFrames > rows) {
      throw new Error(`extractFrames: numFrames ${options.numFrames} exceeds dst rows ${rows}`);
    }

    for (let i = 0; i < dst.numel; i++) dst.setElement(i, 0);

    for (let f = 0; f < options.numFrames; f++) {
      const start = f * options.hopLength;
      const frame = new Float64Array(frameLength);
      for (let i = 0; i < frameLength; i++) {
        const at = start + i;
        frame[i] = at < waveform.numel ? waveform.getElement(at) : 0;
      }

      let mean = 0;
      for (const value of frame) mean += value;
      mean /= frameLength;
      for (let i = 0; i < frameLength; i++) frame[i]! -= mean;

      // Pre-emphasis runs backwards so each sample still sees its raw neighbor.
      for (let i = frameLength - 1; i > 0; i--) {
        frame[i] = frame[i]! - options.preemphasis * frame[i - 1]!;
      }
      frame[0] = frame[0]! * (1 - options.preemphasis);

      for (let i = 0; i < Math.min(frameLength, fftLength); i++) {
        dst.setElement(f * fftLength + i, frame[i]! * hann.getElement(i));
      }
    }
    return dst;
  },
};
