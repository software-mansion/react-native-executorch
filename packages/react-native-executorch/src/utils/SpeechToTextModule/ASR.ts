// NOTE: This will be implemented in C++

import { TokenizerModule } from '../../modules/natural_language_processing/TokenizerModule';
import {
  DecodingOptions,
  Segment,
  SpeechToTextModelConfig,
  WordObject,
  WordTuple,
} from '../../types/stt';
import { ResourceFetcher } from '../ResourceFetcher';

export class ASR {
  private nativeModule: any;
  private tokenizerModule: TokenizerModule = new TokenizerModule();

  private timePrecision: number = 0.02; // Whisper timestamp precision
  private maxDecodeLength: number = 128;
  private chunkSize: number = 30; // 30 seconds
  private minChunkSamples: number = 1 * 16000; // 1 second
  private samplingRate: number = 16000;

  private startOfTranscriptToken!: number;
  private endOfTextToken!: number;
  private timestampBeginToken!: number;

  async load(
    model: SpeechToTextModelConfig,
    onDownloadProgressCallback: (progress: number) => void
  ) {
    const tokenizerLoadPromise = this.tokenizerModule.load(model);
    const encoderDecoderPromise = ResourceFetcher.fetch(
      onDownloadProgressCallback,
      model.encoderSource,
      model.decoderSource
    );
    const [_, encoderDecoderResults] = await Promise.all([
      tokenizerLoadPromise,
      encoderDecoderPromise,
    ]);
    const encoderSource = encoderDecoderResults?.[0];
    const decoderSource = encoderDecoderResults?.[1];
    if (!encoderSource || !decoderSource) {
      throw new Error('Download interrupted.');
    }
    this.nativeModule = await global.loadSpeechToText(
      encoderSource,
      decoderSource,
      'whisper'
    );

    this.startOfTranscriptToken = await this.tokenizerModule.tokenToId(
      '<|startoftranscript|>'
    );
    this.endOfTextToken = await this.tokenizerModule.tokenToId('<|endoftext|>');
    this.timestampBeginToken = await this.tokenizerModule.tokenToId('<|0.00|>');
  }

  async getInitialSequence(options: DecodingOptions): Promise<number[]> {
    const initialSequence: number[] = [this.startOfTranscriptToken];
    if (options.language) {
      const languageToken = await this.tokenizerModule.tokenToId(
        `<|${options.language}|>`
      );
      const taskToken = await this.tokenizerModule.tokenToId('<|transcribe|>');
      initialSequence.push(languageToken);
      initialSequence.push(taskToken);
    }
    initialSequence.push(this.timestampBeginToken);
    return initialSequence;
  }

  async generate(
    audio: number[],
    temperature: number,
    options: DecodingOptions
  ): Promise<{
    sequencesIds: number[];
    scores: number[];
  }> {
    await this.encode(new Float32Array(audio));
    const initialSequence = await this.getInitialSequence(options);
    const sequencesIds = [...initialSequence];
    const scores: number[] = [];

    while (sequencesIds.length <= this.maxDecodeLength) {
      const logits = this.softmaxWithTemperature(
        Array.from(await this.decode(sequencesIds)),
        temperature === 0 ? 1 : temperature
      );
      const nextTokenId =
        temperature === 0
          ? logits.indexOf(Math.max(...logits))
          : this.sampleFromDistribution(logits);
      const nextTokenProb = logits[nextTokenId]!;
      sequencesIds.push(nextTokenId);
      scores.push(nextTokenProb);
      if (nextTokenId === this.endOfTextToken) {
        break;
      }
    }

    return {
      sequencesIds: sequencesIds.slice(initialSequence.length),
      scores: scores.slice(initialSequence.length),
    };
  }

  softmaxWithTemperature(logits: number[], temperature = 1.0) {
    const max = Math.max(...logits);
    const exps = logits.map((logit) => Math.exp((logit - max) / temperature));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((exp) => exp / sum);
  }

  sampleFromDistribution(probs: number[]): number {
    const r = Math.random();
    let cumulative = 0;
    for (let i = 0; i < probs.length; i++) {
      cumulative += probs[i]!;
      if (r < cumulative) {
        return i;
      }
    }
    return probs.length - 1;
  }

  async generateWithFallback(audio: number[], options: DecodingOptions) {
    const temperatures = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
    let generatedTokens: number[] = [];

    for (const temperature of temperatures) {
      const result = await this.generate(audio, temperature, options);
      const tokens = result.sequencesIds;
      const scores = result.scores;

      const seqLen = tokens.length;
      const cumLogprob = scores.reduce(
        (acc, score) => acc + Math.log(score),
        0
      );
      const avgLogprob = cumLogprob / seqLen;

      if (avgLogprob >= -1.0) {
        generatedTokens = tokens;
        break;
      }
    }

    return this.calculateWordLevelTimestamps(generatedTokens, audio);
  }

  async calculateWordLevelTimestamps(
    generatedTokens: number[],
    audio: number[]
  ): Promise<Segment[]> {
    const segments: Segment[] = [];

    let tokens: number[] = [];
    let prevTimestamp = this.timestampBeginToken;
    for (let i = 0; i < generatedTokens.length; i++) {
      if (generatedTokens[i]! < this.timestampBeginToken) {
        tokens.push(generatedTokens[i]!);
      }

      if (
        i > 0 &&
        generatedTokens[i - 1]! >= this.timestampBeginToken &&
        generatedTokens[i]! >= this.timestampBeginToken
      ) {
        const start = prevTimestamp;
        const end = generatedTokens[i - 1]!;
        const wordObjects = await this.estimateWordTimestampsLinear(
          tokens,
          start,
          end
        );
        segments.push({
          words: wordObjects,
        });
        tokens = [];
        prevTimestamp = generatedTokens[i]!;
      }
    }

    const start = prevTimestamp;
    const end = generatedTokens.at(-2)!;
    const wordObjects = await this.estimateWordTimestampsLinear(
      tokens,
      start,
      end
    );
    segments.push({
      words: wordObjects,
    });

    const scalingFactor =
      audio.length /
      this.samplingRate /
      ((end - this.timestampBeginToken) * this.timePrecision);
    if (scalingFactor < 1) {
      for (const segment of segments) {
        for (const word of segment.words) {
          word.start *= scalingFactor;
          word.end *= scalingFactor;
        }
      }
    }

    return segments;
  }

  async estimateWordTimestampsLinear(
    tokens: number[],
    start: number,
    end: number
  ): Promise<WordObject[]> {
    const duration = (end - start) * this.timePrecision;
    const segmentText = (
      (await this.tokenizerModule.decode(tokens)) as string
    ).trim();

    const words = segmentText.split(' ').map((w) => ` ${w}`);
    const numOfCharacters = words.reduce(
      (acc: number, word: string) => acc + word.length,
      0
    );

    const timePerCharacter = duration / numOfCharacters;

    const wordObjects: WordObject[] = [];
    const startTimeOffset =
      (start - this.timestampBeginToken) * this.timePrecision;

    let prevCharNum = 0;
    for (let j = 0; j < words.length; j++) {
      const word = words[j]!;
      const start = startTimeOffset + prevCharNum * timePerCharacter;
      const end = start + timePerCharacter * word.length;
      wordObjects.push({ word, start, end });
      prevCharNum += word.length;
    }

    return wordObjects;
  }

  public async transcribe(
    audio: number[],
    options: DecodingOptions
  ): Promise<Segment[]> {
    let seek = 0;
    const allSegments: Segment[] = [];

    while (seek * this.samplingRate < audio.length) {
      const chunk = audio.slice(
        seek * this.samplingRate,
        (seek + this.chunkSize) * this.samplingRate
      );
      if (chunk.length < this.minChunkSamples) {
        return allSegments;
      }
      const segments = await this.generateWithFallback(chunk, options);
      for (const segment of segments) {
        for (const word of segment.words) {
          word.start += seek;
          word.end += seek;
        }
      }
      allSegments.push(...segments);
      const lastTimeStamp = segments.at(-1)!.words.at(-1)!.end;
      seek = lastTimeStamp;
    }

    return allSegments;
  }

  tsWords(segments: Segment[]): WordTuple[] {
    const o: WordTuple[] = [];
    for (const segment of segments) {
      for (const word of segment.words) {
        o.push([word.start, word.end, word.word]);
      }
    }
    return o;
  }

  segmentsEndTs(res: Segment[]) {
    return res.map((segment) => segment.words.at(-1)!.end);
  }

  async encode(waveform: Float32Array): Promise<void> {
    await this.nativeModule.encode(waveform);
  }

  async decode(tokens: number[]): Promise<Float32Array> {
    return new Float32Array(await this.nativeModule.decode(tokens));
  }
}
