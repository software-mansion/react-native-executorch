// NOTE: This will be implemented in C++

import { WordTuple, DecodingOptions, Segment } from '../../types/stt';
import { ASR } from './ASR';
import { HypothesisBuffer } from './hypothesisBuffer';

export class OnlineASRProcessor {
  private asr: ASR;

  private samplingRate: number = 16000;
  public audioBuffer: number[] = [];
  private transcriptBuffer: HypothesisBuffer = new HypothesisBuffer();
  private bufferTimeOffset: number = 0;
  private committed: WordTuple[] = [];

  constructor(asr: ASR) {
    this.asr = asr;
  }

  insertAudioChunk(audio: number[]) {
    this.audioBuffer.push(...audio);
  }

  async processIter(options: DecodingOptions) {
    const res = await this.asr.transcribe(this.audioBuffer, options);
    const tsw = this.asr.tsWords(res);
    this.transcriptBuffer.insert(tsw, this.bufferTimeOffset);
    const o = this.transcriptBuffer.flush();
    this.committed.push(...o);

    const s = 15;
    if (this.audioBuffer.length / this.samplingRate > s) {
      this.chunkCompletedSegment(res);
    }

    const committed = this.toFlush(o)[2];
    const nonCommitted = this.transcriptBuffer
      .complete()
      .map((x) => x[2])
      .join('');
    return { committed, nonCommitted };
  }

  chunkCompletedSegment(res: Segment[]) {
    if (this.committed.length === 0) {
      return;
    }

    const ends = this.asr.segmentsEndTs(res);
    const t = this.committed.at(-1)![1];

    if (ends.length > 1) {
      let e = ends.at(-2)! + this.bufferTimeOffset;
      while (ends.length > 2 && e > t) {
        ends.pop();
        e = ends.at(-2)! + this.bufferTimeOffset;
      }

      if (e <= t) {
        this.chunkAt(e);
      }
    }
  }

  chunkAt(time: number) {
    this.transcriptBuffer.popCommitted(time);
    const cutSeconds = time - this.bufferTimeOffset;
    this.audioBuffer = this.audioBuffer.slice(
      Math.floor(cutSeconds * this.samplingRate)
    );
    this.bufferTimeOffset = time;
  }

  async finish() {
    const o = this.transcriptBuffer.complete();
    const f = this.toFlush(o);
    this.bufferTimeOffset += this.audioBuffer.length / this.samplingRate;
    return { committed: f[2] };
  }

  private toFlush(words: WordTuple[]): [number | null, number | null, string] {
    const t = words.map((s) => s[2]).join(' ');
    const b = words.length === 0 ? null : words[0]![0];
    const e = words.length === 0 ? null : words.at(-1)![1];
    return [b, e, t];
  }
}
