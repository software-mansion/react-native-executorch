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
});
