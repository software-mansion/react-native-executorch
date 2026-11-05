import { tensor } from '../../src/core/tensor';
import { normalize } from '../../src/extensions/cv/ops/image';

describe('normalize — options merging', () => {
  it('falls back to the defaults for options passed as undefined', () => {
    const src = tensor('float32', [1, 1, 2], new Float32Array([255, 51]));
    const dst = tensor('float32', [1, 1, 2]);
    try {
      normalize(src, dst, { alpha: undefined, beta: undefined });
      const [first, second] = dst.getData(new Float32Array(2));
      expect(first).toBeCloseTo(1);
      expect(second).toBeCloseTo(0.2);
    } finally {
      src.dispose();
      dst.dispose();
    }
  });
});
