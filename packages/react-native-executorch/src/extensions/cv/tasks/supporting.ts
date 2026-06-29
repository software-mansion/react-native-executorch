import type { WorkletRuntime } from 'react-native-worklets';

import { tensor } from '../../../core/tensor';
import { loadModel } from '../../../core/model';
import { validateModelSchema, SymbolicTensor } from '../../../core/modelSchema';
import { wrapAsync } from '../../../core/runtime';

import type { ImageBuffer } from '../image';
import { IMAGENET_NORM } from '../../../constants';
import { gridSample, FORMAT_CHANNELS } from '../ops/image';
import { createImagePreprocessor } from './preprocessing';
import { argmaxRange } from './documentHelpers';

// SLANet defaults; overridable per model via SupportingModel (the vocab's eos
// token id and the structure decoder's max step count).
const DEFAULT_EOS_TOKEN_ID = 49;
const DEFAULT_MAX_STEPS = 501; // SLANet max_text_length (500) + 1

/**
 * Detected page orientation.
 * @category Types
 */
export type Orientation = {
  /** Degrees the page is rotated clockwise (0/90/180/270). Rotate by `-this` to correct. */
  readonly rotationCW: 0 | 90 | 180 | 270;
  readonly confidence: number;
};

/**
 * Recognized table structure.
 * @category Types
 */
export type TableStructure = {
  /** HTML `<tr>/<td>` skeleton (empty cells; fill by aligning OCR text). */
  readonly html: string;
  /** Raw SLANet structure token ids (sos/eos stripped). */
  readonly tokens: number[];
};

/**
 * Model configuration for the fused PaddleOCR supporting models (orientation +
 * dewarp + table structure), all in one PTE.
 * @category Types
 */
export type SupportingModel = {
  readonly modelPath: string;
  /** SLANet structure-token vocab (SLANET_STRUCTURE_VOCAB), index = token id. */
  readonly vocab: readonly string[];
  /** Token id that terminates AR decoding. Defaults to 49 (SLANet). */
  readonly eosTokenId?: number;
  /** Hard cap on AR decode steps. Defaults to 501 (SLANet max length + 1). */
  readonly maxSteps?: number;
};

function tokensToHtml(tokens: number[], vocab: readonly string[], eosTokenId: number): string {
  'worklet';
  let html = '';
  for (const t of tokens) {
    if (t > 0 && t < eosTokenId && t < vocab.length) {
      html += vocab[t]!;
    }
  }
  return html;
}

/**
 * Creates the supporting-models runner (PaddleOCR fused helpers): page
 * orientation (PP-LCNet), geometric dewarp (UVDoc, applied in TS via the grid),
 * and table-structure recognition (SLANet_plus AR decode). One PTE, loaded once.
 * @category Typescript API
 * @param config Supporting-model path + table structure vocab.
 * @param runtime Optional worklet runtime thread.
 * @returns A promise resolving to the three capabilities + disposal controls.
 */
export async function createSupporting(
  config: SupportingModel,
  runtime?: WorkletRuntime
): Promise<{
  dispose: () => void;
  detectOrientation: (input: ImageBuffer) => Promise<Orientation>;
  detectOrientationWorklet: (input: ImageBuffer) => Orientation;
  dewarp: (input: ImageBuffer) => Promise<ImageBuffer>;
  dewarpWorklet: (input: ImageBuffer) => ImageBuffer;
  recognizeTable: (input: ImageBuffer) => Promise<TableStructure>;
  recognizeTableWorklet: (input: ImageBuffer) => TableStructure;
}> {
  const { modelPath, vocab } = config;
  const eosTokenId = config.eosTokenId ?? DEFAULT_EOS_TOKEN_ID;
  const maxSteps = config.maxSteps ?? DEFAULT_MAX_STEPS;
  const model = await wrapAsync(loadModel, runtime)(modelPath);

  // --- orientation: image[1,3,224,224] (ImageNet) -> logits[1,4] ---
  const oriMeta = validateModelSchema(
    model,
    'orientation',
    [SymbolicTensor('float32', [1, 3, 'H', 'W'])],
    [SymbolicTensor('float32', [1, 'K'])]
  );
  // --- dewarp: image[1,3,712,488] (/255) -> grid[1,2,gH,gW] ---
  const dewMeta = validateModelSchema(
    model,
    'dewarp',
    [SymbolicTensor('float32', [1, 3, 'H', 'W'])],
    [SymbolicTensor('float32', [1, 2, 'gH', 'gW'])]
  );
  // --- table backbone + AR decoder ---
  const encMeta = validateModelSchema(
    model,
    'table_encode',
    [SymbolicTensor('float32', [1, 3, 'H', 'W'])],
    [SymbolicTensor('float32', [1, 'C', 'F'])]
  );
  const decMeta = validateModelSchema(
    model,
    'table_decode_step',
    [
      SymbolicTensor('float32', [1, 'C', 'F']),
      SymbolicTensor('float32', [1, 'H']),
      SymbolicTensor('float32', [1, 'V']),
    ],
    [SymbolicTensor('float32', [1, 'V']), SymbolicTensor('float32', [1, 'H'])]
  );

  const oriShape = oriMeta.inputTensorMeta[0]!.shape;
  const oriOutLen = oriMeta.outputTensorMeta[0]!.shape[1]!;
  const dewShape = dewMeta.inputTensorMeta[0]!.shape;
  const gridShape = dewMeta.outputTensorMeta[0]!.shape; // [1,2,gH,gW]
  const tabShape = encMeta.inputTensorMeta[0]!.shape;
  const featShape = encMeta.outputTensorMeta[0]!.shape;
  const hidShape = decMeta.outputTensorMeta[1]!.shape;
  const probShape = decMeta.outputTensorMeta[0]!.shape;
  const hidLen = hidShape[1]!;
  const vocabLen = probShape[1]!;

  if (vocabLen !== vocab.length) {
    throw new Error(
      `Supporting: vocab length (${vocab.length}) must match the model's token dim (${vocabLen}).`
    );
  }

  const oriPre = createImagePreprocessor(
    {
      resizeMode: 'stretch',
      interpolation: 'linear',
      alpha: IMAGENET_NORM.alpha,
      beta: IMAGENET_NORM.beta,
    },
    oriShape
  );
  const dewPre = createImagePreprocessor(
    { resizeMode: 'stretch', interpolation: 'linear', alpha: 1 / 255, beta: 0 },
    dewShape
  );
  const tabPre = createImagePreprocessor(
    {
      resizeMode: 'stretch',
      interpolation: 'linear',
      alpha: IMAGENET_NORM.alpha,
      beta: IMAGENET_NORM.beta,
    },
    tabShape
  );

  const tensors = [
    tensor('float32', oriMeta.outputTensorMeta[0]!.shape), // tOri
    tensor('float32', gridShape), // tGrid
    tensor('float32', featShape), // tFeatures
    tensor('float32', hidShape), // tHidden
    tensor('float32', probShape), // tOnehot
    tensor('float32', probShape), // tProbs
    tensor('float32', hidShape), // tNewHidden
  ] as const;
  const [tOri, tGrid, tFeatures, tHidden, tOnehot, tProbs, tNewHidden] = tensors;
  const oriBuf = new Float32Array(oriOutLen);
  const zeroHidden = new Float32Array(hidLen);
  const zeroVocab = new Float32Array(vocabLen);
  const onehotBuf = new Float32Array(vocabLen);
  const probsBuf = new Float32Array(vocabLen);

  const dispose = () => {
    oriPre.dispose();
    dewPre.dispose();
    tabPre.dispose();
    tensors.forEach((t) => t.dispose());
    model.dispose();
  };

  const detectOrientationWorklet = (input: ImageBuffer): Orientation => {
    'worklet';
    const tInput = oriPre.process(input);
    model.execute('orientation', [tInput], [tOri]);
    tOri.getData(oriBuf);
    const cls = argmaxRange(oriBuf, 0, oriOutLen);
    const best = oriBuf[cls]!;
    let sumExp = 0;
    for (let i = 0; i < oriOutLen; i++) {
      sumExp += Math.exp(oriBuf[i]! - best);
    }
    return { rotationCW: ((cls % 4) * 90) as 0 | 90 | 180 | 270, confidence: 1 / sumExp };
  };

  const dewarpWorklet = (input: ImageBuffer): ImageBuffer => {
    'worklet';
    const tInput = dewPre.process(input);
    model.execute('dewarp', [tInput], [tGrid]);
    // Apply the sampling field to the full-res page natively (cv::remap). The
    // page-sized src/dst tensors depend on the input size, so allocate per call.
    const ch = FORMAT_CHANNELS[input.format];
    const tSrc = tensor('uint8', [input.height, input.width, ch]);
    const tDst = tensor('uint8', [input.height, input.width, ch]);
    try {
      tSrc.setData(input.data);
      gridSample(tSrc, tGrid, tDst);
      const out = new Uint8Array(input.width * input.height * ch);
      tDst.getData(out);
      return {
        data: out,
        width: input.width,
        height: input.height,
        format: input.format,
        layout: input.layout,
      };
    } finally {
      tSrc.dispose();
      tDst.dispose();
    }
  };

  const recognizeTableWorklet = (input: ImageBuffer): TableStructure => {
    'worklet';
    const tInput = tabPre.process(input);
    model.execute('table_encode', [tInput], [tFeatures]);
    tHidden.setData(zeroHidden);
    tOnehot.setData(zeroVocab);
    const tokens: number[] = [];
    for (let step = 0; step < maxSteps; step++) {
      model.execute('table_decode_step', [tFeatures, tHidden, tOnehot], [tProbs, tNewHidden]);
      tProbs.getData(probsBuf);
      const tok = argmaxRange(probsBuf, 0, vocabLen);
      tokens.push(tok);
      if (tok === eosTokenId) {
        break;
      }
      tNewHidden.copyTo(tHidden);
      onehotBuf.fill(0);
      onehotBuf[tok] = 1;
      tOnehot.setData(onehotBuf);
    }
    return { html: tokensToHtml(tokens, vocab, eosTokenId), tokens };
  };

  return {
    dispose,
    detectOrientation: wrapAsync(detectOrientationWorklet, runtime),
    detectOrientationWorklet,
    dewarp: wrapAsync(dewarpWorklet, runtime),
    dewarpWorklet,
    recognizeTable: wrapAsync(recognizeTableWorklet, runtime),
    recognizeTableWorklet,
  };
}
