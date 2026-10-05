import { partition } from '../../src/extensions/speech/utils/textPartitioner';
import { isRnExecuTorchError } from '../../src/core/error';

describe('textPartitioner — partition', () => {
  describe('argument validation', () => {
    it('returns an empty array when given empty text', () => {
      expect(partition('', 120)).toEqual([]);
    });

    it('returns an empty array when given whitespace-only text', () => {
      expect(partition('   \n\t  ', 120)).toEqual([]);
    });

    it('rejects a limit below the minimum partition limit (10)', () => {
      expect(() => partition('Hello world', 9)).toThrow(/below minimum/);

      try {
        partition('Hello world', 5);
        fail('Expected error to be thrown');
      } catch (e) {
        expect(isRnExecuTorchError(e)).toBe(true);
        if (isRnExecuTorchError(e)) {
          expect(e.code).toBe('INVALID_ARGUMENT');
        }
      }
    });
  });

  describe('standard sentence and whitespace partitioning', () => {
    it('keeps short text under limit as a single trimmed chunk', () => {
      const text = 'Hello world, this is a test.';
      expect(partition(text, 120)).toEqual(['Hello world, this is a test.']);
    });

    it('partitions on sentence boundaries when text exceeds target length', () => {
      const sentence1 = 'The quick brown fox jumps over the lazy dog.';
      const sentence2 = 'A fast dark creature leaped over a sleepy hound.';
      const fullText = `${sentence1} ${sentence2}`;

      const chunks = partition(fullText, 60);
      expect(chunks).toEqual([sentence1, sentence2]);
      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(60);
      }
    });

    it('partitions on whitespace when a single sentence exceeds the limit', () => {
      const longSentence =
        'This is a long sentence that has no commas or semicolons anywhere inside it but needs to be split across spaces.';
      const chunks = partition(longSentence, 40);

      expect(chunks.length).toBeGreaterThan(1);
      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(40);
      }
      expect(chunks.join(' ')).toBe(longSentence);
    });
  });

  describe('Japanese and CJK punctuation (issue #1505)', () => {
    it('partitions on full-width Japanese punctuation marks (。 and 、)', () => {
      const text =
        'これはイタリア語から日本語に翻訳されたテキストです。' +
        '155文字のテキストを音声合成エンジンで再生しようとしています。' +
        'パーティションエラーが発生することなく、文ごとに適切に分割されてスムーズに連続再生される必要があります。';

      const chunks = partition(text, 120);

      expect(chunks.length).toBe(2);
      expect(chunks[0]).toBe(
        'これはイタリア語から日本語に翻訳されたテキストです。155文字のテキストを音声合成エンジンで再生しようとしています。'
      );
      expect(chunks[1]).toBe(
        'パーティションエラーが発生することなく、文ごとに適切に分割されてスムーズに連続再生される必要があります。'
      );

      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(120);
      }
    });

    it('recognizes other East Asian punctuation marks as breakpoints', () => {
      const text =
        'すごいですね！本当に驚きました？次はセミコロン；コロン：波ダッシュ〜チルダ～です。';
      const chunks = partition(text, 30);

      expect(chunks.length).toBeGreaterThan(1);
      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(30);
      }
    });
  });

  describe('fallback cuts for continuous text without punctuation', () => {
    it('partitions continuous Japanese text exceeding limit without punctuation', () => {
      const unbroken = 'あ'.repeat(155);
      const chunks = partition(unbroken, 120);

      expect(chunks.length).toBe(2);
      expect(chunks[0]!.length).toBe(120);
      expect(chunks[1]!.length).toBe(35);
      expect(chunks.join('')).toBe(unbroken);
    });

    it('partitions a single long continuous word without spaces or punctuation', () => {
      const longWord = 'supercalifragilisticexpialidocious';
      const chunks = partition(longWord, 10);

      expect(chunks.length).toBeGreaterThan(1);
      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(10);
      }
      expect(chunks.join('')).toBe(longWord);
    });
  });

  describe('fallback cuts at the exact limit boundary', () => {
    it('splits a run of exactly limit characters followed by a space', () => {
      const text = `${'a'.repeat(10)} b`;
      const chunks = partition(text, 10);

      expect(chunks).toEqual(['a'.repeat(10), 'b']);
      expect(chunks.join(' ')).toBe(text);
    });

    it('splits a run of exactly limit characters followed by end-of-sentence punctuation', () => {
      const text = `${'a'.repeat(10)}.`;

      expect(partition(text, 10)).toEqual(['a'.repeat(10), '.']);
    });

    it('splits CJK text whose sentence length equals the limit exactly', () => {
      const text = `${'あ'.repeat(120)}。`;

      expect(partition(text, 120)).toEqual(['あ'.repeat(120), '。']);
    });

    it('keeps chunks within the limit when code points span two UTF-16 units', () => {
      const text = '🙂'.repeat(11);
      const chunks = partition(text, 11);

      expect(chunks).toEqual(['🙂'.repeat(5), '🙂'.repeat(5), '🙂']);
      expect(chunks.map((c) => [...c].length)).toEqual([5, 5, 1]);
      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(11);
      }
      expect(chunks.join('')).toBe(text);
    });
  });

  describe('partition options', () => {
    it('produces shorter initial chunks when prioritizeInitialTtfa is true', () => {
      const text =
        'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence. Sixth sentence. Seventh sentence. Eighth sentence.';

      const withoutTtfa = partition(text, 80, { prioritizeInitialTtfa: false });
      const withTtfa = partition(text, 80, { prioritizeInitialTtfa: true });

      expect(withTtfa[0]!.length).toBeLessThan(withoutTtfa[0]!.length);
    });

    it('honors custom separator penalties', () => {
      const text = 'First clause, second clause. Third sentence.';

      const chunks = partition(text, 35, {
        separatorPenalties: { eos: 1, pause: 50000, whitespace: 10 },
      });

      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(35);
      }
    });
  });
});
