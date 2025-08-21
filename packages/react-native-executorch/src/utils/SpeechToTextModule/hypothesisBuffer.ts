// NOTE: This will be implemented in C++

import { WordTuple } from '../../types/stt';

export class HypothesisBuffer {
  private committedInBuffer: WordTuple[] = [];
  private buffer: WordTuple[] = [];
  private new: WordTuple[] = [];

  private lastCommittedTime: number = 0;
  public lastCommittedWord: string | null = null;

  public insert(newWords: WordTuple[], offset: number) {
    const newWordsOffset: WordTuple[] = newWords.map(([a, b, t]) => [
      a + offset,
      b + offset,
      t,
    ]);
    this.new = newWordsOffset.filter(
      ([a, _b, _t]) => a > this.lastCommittedTime - 0.5
    );

    if (this.new.length > 0) {
      const [a, _b, _t] = this.new[0]!;
      if (
        Math.abs(a - this.lastCommittedTime) < 1 &&
        this.committedInBuffer.length > 0
      ) {
        const cn = this.committedInBuffer.length;
        const nn = this.new.length;

        for (let i = 1; i <= Math.min(cn, nn, 5); i++) {
          const c = this.committedInBuffer
            .slice(-i)
            .map((w) => w[2])
            .join(' ');
          const tail = this.new
            .slice(0, i)
            .map((w) => w[2])
            .join(' ');
          if (c === tail) {
            for (let j = 0; j < i; j++) {
              this.new.shift();
            }
            break;
          }
        }
      }
    }
  }

  public flush(): WordTuple[] {
    const commit: WordTuple[] = [];
    while (this.new.length > 0 && this.buffer.length > 0) {
      if (this.new[0]![2] !== this.buffer[0]![2]) {
        break;
      }
      commit.push(this.new[0]!);
      this.lastCommittedWord = this.new[0]![2];
      this.lastCommittedTime = this.new[0]![1];
      this.buffer.shift();
      this.new.shift();
    }
    this.buffer = this.new;
    this.new = [];
    this.committedInBuffer.push(...commit);
    return commit;
  }

  public popCommitted(time: number) {
    this.committedInBuffer = this.committedInBuffer.filter(
      ([_a, b, _t]) => b > time
    );
  }

  public complete(): WordTuple[] {
    return this.buffer;
  }
}
