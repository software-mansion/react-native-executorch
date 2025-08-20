// NOTE: This will be implemented in C++

import { WordTuple } from '../../types/stt';

export class HypothesisBuffer {
  private commitedInBuffer: WordTuple[] = [];
  private buffer: WordTuple[] = [];
  private new: WordTuple[] = [];

  public lastCommitedTime: number = 0;
  public lastCommitedWord: string | null = null;

  insert(newWords: WordTuple[], offset: number) {
    const newWordsOffset: WordTuple[] = newWords.map(([a, b, t]) => [
      a + offset,
      b + offset,
      t,
    ]);
    this.new = newWordsOffset.filter(
      ([a, _b, _t]) => a > this.lastCommitedTime - 0.5
    );

    if (this.new.length > 0) {
      const [a, _b, _t] = this.new[0]!;
      if (
        Math.abs(a - this.lastCommitedTime) < 1 &&
        this.commitedInBuffer.length > 0
      ) {
        const cn = this.commitedInBuffer.length;
        const nn = this.new.length;

        for (let i = 1; i <= Math.min(cn, nn, 5); i++) {
          const c = this.commitedInBuffer
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

  flush(): WordTuple[] {
    const commit: WordTuple[] = [];
    while (this.new.length > 0 && this.buffer.length > 0) {
      if (this.new[0]![2] !== this.buffer[0]![2]) {
        break;
      }
      commit.push(this.new[0]!);
      this.lastCommitedWord = this.new[0]![2];
      this.lastCommitedTime = this.new[0]![1];
      this.buffer.shift();
      this.new.shift();
    }
    this.buffer = this.new;
    this.new = [];
    this.commitedInBuffer.push(...commit);
    return commit;
  }

  popCommited(time: number) {
    this.commitedInBuffer = this.commitedInBuffer.filter(
      ([_a, b, _t]) => b > time
    );
  }

  complete(): WordTuple[] {
    return this.buffer;
  }
}
