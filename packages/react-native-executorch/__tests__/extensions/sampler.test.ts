import { tensor } from '../../src/core/tensor';
import { sample } from '../../src/extensions/llm/sampler';
import { llm } from '../support/fakeOps';

describe('sample — options merging', () => {
  it('passes resolved default sampling options to native JSI', () => {
    const logits = tensor('float32', [1, 10]);
    try {
      sample(logits, { generatedTokens: new Int32Array(0) });

      const options = llm.lastSampleOptions();
      expect(options).toBeDefined();
      expect(options).toMatchObject({
        temperature: 0.8,
        repetitionPenalty: 1.0,
        penaltyLastN: -1,
        topK: 40,
        topP: 0.95,
        minP: 0.05,
      });
      expect(options?.dry).toBeUndefined();
      expect(options?.xtc).toBeUndefined();
    } finally {
      logits.dispose();
    }
  });

  it('overrides default sampling options and merges dry and xtc defaults', () => {
    const logits = tensor('float32', [1, 10]);
    try {
      sample(
        logits,
        { generatedTokens: new Int32Array(0) },
        {
          temperature: 0.2,
          topK: 10,
          penaltyLastN: 64,
          seed: 12345,
          dry: { multiplier: 0.8, allowedLength: 4 },
          xtc: { probability: 0.5, threshold: 0.3 },
        }
      );

      const options = llm.lastSampleOptions();
      expect(options).toBeDefined();
      expect(options).toMatchObject({
        temperature: 0.2,
        topK: 10,
        topP: 0.95,
        minP: 0.05,
        repetitionPenalty: 1.0,
        penaltyLastN: 64,
        seed: 12345,
        dry: {
          multiplier: 0.8,
          base: 1.75,
          allowedLength: 4,
          penaltyLastN: -1,
          sequenceBreakers: new Int32Array(0),
        },
        xtc: {
          probability: 0.5,
          threshold: 0.3,
        },
      });
    } finally {
      logits.dispose();
    }
  });

  it('falls back to the defaults for options passed as undefined', () => {
    const logits = tensor('float32', [1, 10]);
    try {
      sample(
        logits,
        { generatedTokens: new Int32Array(0) },
        {
          temperature: undefined,
          topK: undefined,
          topP: undefined,
          minP: undefined,
          repetitionPenalty: undefined,
          penaltyLastN: undefined,
          dry: { multiplier: 0.8, base: undefined, allowedLength: undefined },
          xtc: { probability: 0.5, threshold: undefined },
        }
      );

      expect(llm.lastSampleOptions()).toMatchObject({
        temperature: 0.8,
        repetitionPenalty: 1.0,
        penaltyLastN: -1,
        topK: 40,
        topP: 0.95,
        minP: 0.05,
        dry: {
          multiplier: 0.8,
          base: 1.75,
          allowedLength: 2,
          penaltyLastN: -1,
          sequenceBreakers: new Int32Array(0),
        },
        xtc: { probability: 0.5, threshold: 0.1 },
      });
    } finally {
      logits.dispose();
    }
  });
});
