import {
  HAMMING_DIST_THRESHOLD,
  MODEL_CONFIGS,
  SECOND,
  MODES,
  NUM_TOKENS_TO_TRIM,
  STREAMING_ACTION,
} from '../constants/sttDefaults';
import { AvailableModels, ModelConfig } from '../types/stt';
import { SpeechToTextNativeModule } from '../native/RnExecutorchModules';
import { TokenizerModule } from '../modules/natural_language_processing/TokenizerModule';
import { ResourceSource } from '../types/common';
import { ResourceFetcher } from '../utils/ResourceFetcher';
import { longCommonInfPref } from '../utils/stt';
import { SpeechToTextLanguage } from '../types/stt';
import { ETError, getError } from '../Error';

export class SpeechToTextController {
  private speechToTextNativeModule = SpeechToTextNativeModule;

  public sequence: number[] = [];
  public isReady = false;
  public isGenerating = false;

  private tokenizerModule: TokenizerModule;
  private overlapSeconds!: number;
  private windowSize!: number;
  private chunks: number[][] = [];
  private seqs: number[][] = [];
  private prevSeq: number[] = [];
  private waveform: number[] = [];
  private numOfChunks = 0;
  private streaming = false;

  // User callbacks
  private decodedTranscribeCallback: (sequence: number[]) => void;
  private modelDownloadProgressCallback:
    | ((downloadProgress: number) => void)
    | undefined;
  private isReadyCallback: (isReady: boolean) => void;
  private isGeneratingCallback: (isGenerating: boolean) => void;
  private onErrorCallback: (error: any) => void;
  private config!: ModelConfig;

  constructor({
    transcribeCallback,
    modelDownloadProgressCallback,
    isReadyCallback,
    isGeneratingCallback,
    onErrorCallback,
    overlapSeconds,
    windowSize,
    streamingConfig,
  }: {
    transcribeCallback: (sequence: string) => void;
    modelDownloadProgressCallback?: (downloadProgress: number) => void;
    isReadyCallback?: (isReady: boolean) => void;
    isGeneratingCallback?: (isGenerating: boolean) => void;
    onErrorCallback?: (error: Error | undefined) => void;
    overlapSeconds?: number;
    windowSize?: number;
    streamingConfig?: keyof typeof MODES;
  }) {
    this.tokenizerModule = new TokenizerModule();
    this.decodedTranscribeCallback = async (seq) =>
      transcribeCallback(await this.tokenIdsToText(seq));
    this.modelDownloadProgressCallback = modelDownloadProgressCallback;
    this.isReadyCallback = (isReady) => {
      this.isReady = isReady;
      isReadyCallback?.(isReady);
    };
    this.isGeneratingCallback = (isGenerating) => {
      this.isGenerating = isGenerating;
      isGeneratingCallback?.(isGenerating);
    };
    this.onErrorCallback = (error) => {
      if (onErrorCallback) {
        onErrorCallback(error ? new Error(getError(error)) : undefined);
        return;
      } else {
        throw new Error(getError(error));
      }
    };
    this.configureStreaming(
      overlapSeconds,
      windowSize,
      streamingConfig || 'balanced'
    );
  }

  public async loadModel(
    modelName: AvailableModels,
    encoderSource?: ResourceSource,
    decoderSource?: ResourceSource,
    tokenizerSource?: ResourceSource
  ) {
    this.onErrorCallback(undefined);
    this.isReadyCallback(false);
    this.config = MODEL_CONFIGS[modelName];

    try {
      await this.tokenizerModule.load(
        tokenizerSource || this.config.tokenizer.source
      );
      [encoderSource, decoderSource] =
        (await ResourceFetcher.fetchMultipleResources(
          this.modelDownloadProgressCallback,
          encoderSource || this.config.sources.encoder,
          decoderSource || this.config.sources.decoder
        ))!;
    } catch (e) {
      this.onErrorCallback(e);
      return;
    }

    if (modelName === 'whisperMultilingual') {
      // The underlying native class is instantiated based on the name of the model. There is no need to
      // create a separate class for multilingual version of Whisper, since it is the same. We just need
      // the distinction here, in TS, for start tokens and such. If we introduce
      // more versions of Whisper, such as the small one, this should be refactored.
      modelName = 'whisper';
    }

    try {
      await this.speechToTextNativeModule.loadModule(modelName, [
        encoderSource!,
        decoderSource!,
      ]);
      this.modelDownloadProgressCallback?.(1);
      this.isReadyCallback(true);
    } catch (e) {
      this.onErrorCallback(e);
    }
  }

  public configureStreaming(
    overlapSeconds?: number,
    windowSize?: number,
    streamingConfig?: keyof typeof MODES
  ) {
    if (streamingConfig) {
      this.windowSize = MODES[streamingConfig].windowSize * SECOND;
      this.overlapSeconds = MODES[streamingConfig].overlapSeconds * SECOND;
    }
    if (streamingConfig && (windowSize || overlapSeconds)) {
      console.warn(
        `windowSize and overlapSeconds overrides values from streamingConfig ${streamingConfig}.`
      );
    }
    this.windowSize = (windowSize || 0) * SECOND || this.windowSize;
    this.overlapSeconds = (overlapSeconds || 0) * SECOND || this.overlapSeconds;
    if (2 * this.overlapSeconds + this.windowSize >= 30 * SECOND) {
      console.warn(
        `Invalid values for overlapSeconds and/or windowSize provided. Expected windowSize + 2 * overlapSeconds (== ${this.windowSize + 2 * this.overlapSeconds}) <= 30. Setting windowSize to ${30 * SECOND - 2 * this.overlapSeconds}.`
      );
      this.windowSize = 30 * SECOND - 2 * this.overlapSeconds;
    }
  }

  private chunkWaveform() {
    this.numOfChunks = Math.ceil(this.waveform.length / this.windowSize);
    for (let i = 0; i < this.numOfChunks; i++) {
      let chunk: number[] = [];
      const left = Math.max(this.windowSize * i - this.overlapSeconds, 0);
      const right = Math.min(
        this.windowSize * (i + 1) + this.overlapSeconds,
        this.waveform.length
      );
      chunk = this.waveform.slice(left, right);
      this.chunks.push(chunk);
    }
  }

  private resetState() {
    this.sequence = [];
    this.seqs = [];
    this.waveform = [];
    this.prevSeq = [];
    this.chunks = [];
    this.decodedTranscribeCallback([]);
    this.onErrorCallback(undefined);
  }

  private expectedChunkLength() {
    //only first chunk can be of shorter length, for first chunk there are no seqs decoded
    return this.seqs.length
      ? this.windowSize + 2 * this.overlapSeconds
      : this.windowSize + this.overlapSeconds;
  }

  private async getStartingTokenIds(audioLanguage?: string): Promise<number[]> {
    // We need different starting token ids based on the multilingualism of the model.
    // The eng version only needs BOS token, while the multilingual one needs:
    // [BOS, LANG, TRANSCRIBE]. Optionally we should also set notimestamps token, as timestamps
    // is not yet supported.
    if (!audioLanguage) {
      return [this.config.tokenizer.bos];
    }
    // FIXME: I should use .getTokenId for the BOS as well, should remove it from config
    const langTokenId = await this.tokenizerModule.tokenToId(
      `<|${audioLanguage}|>`
    );
    const transcribeTokenId =
      await this.tokenizerModule.tokenToId('<|transcribe|>');
    const noTimestampsTokenId =
      await this.tokenizerModule.tokenToId('<|notimestamps|>');
    const startingTokenIds = [
      this.config.tokenizer.bos,
      langTokenId,
      transcribeTokenId,
      noTimestampsTokenId,
    ];
    return startingTokenIds;
  }

  private async decodeChunk(
    chunk: number[],
    audioLanguage?: SpeechToTextLanguage
  ): Promise<number[]> {
    const seq = await this.getStartingTokenIds(audioLanguage);
    let prevSeqTokenIdx = 0;
    this.prevSeq = this.sequence.slice();
    try {
      await this.encode(chunk);
    } catch (error) {
      this.onErrorCallback(new Error(getError(error) + ' encoding error'));
      return [];
    }
    let lastToken = seq.at(-1) as number;
    while (lastToken !== this.config.tokenizer.eos) {
      try {
        lastToken = await this.decode(seq);
      } catch (error) {
        this.onErrorCallback(new Error(getError(error) + ' decoding error'));
        return [...seq, this.config.tokenizer.eos];
      }
      seq.push(lastToken);
      if (
        this.seqs.length > 0 &&
        seq.length < this.seqs.at(-1)!.length &&
        seq.length % 3 !== 0
      ) {
        this.prevSeq.push(this.seqs.at(-1)![prevSeqTokenIdx++]!);
        this.decodedTranscribeCallback(this.prevSeq);
      }
    }
    return seq;
  }

  private async handleOverlaps(seqs: number[][]): Promise<number[]> {
    const maxInd = longCommonInfPref(
      seqs.at(-2)!,
      seqs.at(-1)!,
      HAMMING_DIST_THRESHOLD
    );
    this.sequence = [...this.sequence, ...seqs.at(-2)!.slice(0, maxInd)];
    this.decodedTranscribeCallback(this.sequence);
    return this.sequence.slice();
  }

  private trimLeft(numOfTokensToTrim: number) {
    const idx = this.seqs.length - 1;
    if (this.seqs[idx]![0] === this.config.tokenizer.bos) {
      this.seqs[idx] = this.seqs[idx]!.slice(numOfTokensToTrim);
    }
  }

  private trimRight(numOfTokensToTrim: number) {
    const idx = this.seqs.length - 2;
    if (this.seqs[idx]!.at(-1) === this.config.tokenizer.eos) {
      this.seqs[idx] = this.seqs[idx]!.slice(0, -numOfTokensToTrim);
    }
  }

  // since we are calling this every time (except first) after a new seq is pushed to this.seqs
  // we can only trim left the last seq and trim right the second to last seq
  private async trimSequences(audioLanguage?: string) {
    const numSpecialTokens = (await this.getStartingTokenIds(audioLanguage))
      .length;
    this.trimLeft(numSpecialTokens + NUM_TOKENS_TO_TRIM);
    this.trimRight(numSpecialTokens + NUM_TOKENS_TO_TRIM);
  }

  // if last chunk is too short combine it with second to last to improve quality
  private validateAndFixLastChunk() {
    if (this.chunks.length < 2) return;

    const lastChunkLength = this.chunks.at(-1)!.length / SECOND;
    const secondToLastChunkLength = this.chunks.at(-2)!.length / SECOND;
    if (lastChunkLength < 5 && secondToLastChunkLength + lastChunkLength < 30) {
      this.chunks[this.chunks.length - 2] = [
        ...this.chunks.at(-2)!.slice(0, -this.overlapSeconds * 2),
        ...this.chunks.at(-1)!,
      ];
      this.chunks = this.chunks.slice(0, -1);
    }
  }

  private async tokenIdsToText(tokenIds: number[]): Promise<string> {
    try {
      return await this.tokenizerModule.decode(tokenIds, true);
    } catch (e) {
      this.onErrorCallback(
        new Error(`An error has occurred when decoding the token ids: ${e}`)
      );
      return '';
    }
  }

  public async transcribe(
    waveform: number[],
    audioLanguage?: SpeechToTextLanguage
  ): Promise<string> {
    try {
      if (!this.isReady) throw Error(getError(ETError.ModuleNotLoaded));
      if (this.isGenerating || this.streaming)
        throw Error(getError(ETError.ModelGenerating));
      if (!!audioLanguage !== this.config.isMultilingual)
        throw new Error(getError(ETError.MultilingualConfiguration));
    } catch (e) {
      this.onErrorCallback(e);
      return '';
    }

    // Making sure that the error is not set when we get there
    this.isGeneratingCallback(true);

    this.resetState();
    this.waveform = waveform;
    this.chunkWaveform();
    this.validateAndFixLastChunk();

    for (let chunkId = 0; chunkId < this.chunks.length; chunkId++) {
      const seq = await this.decodeChunk(
        this.chunks!.at(chunkId)!,
        audioLanguage
      );
      // whole audio is inside one chunk, no processing required
      if (this.chunks.length === 1) {
        this.sequence = seq;
        this.decodedTranscribeCallback(seq);
        break;
      }
      this.seqs.push(seq);

      if (this.seqs.length < 2) continue;

      // Remove starting tokenIds and some additional ones
      await this.trimSequences(audioLanguage);

      this.prevSeq = await this.handleOverlaps(this.seqs);

      // last sequence processed
      // overlaps are already handled, so just append the last seq
      if (this.seqs.length === this.chunks.length) {
        this.sequence = [...this.sequence, ...this.seqs.at(-1)!];
        this.decodedTranscribeCallback(this.sequence);
        this.prevSeq = this.sequence;
      }
    }
    const decodedText = await this.tokenIdsToText(this.sequence);
    this.isGeneratingCallback(false);
    return decodedText;
  }

  public async streamingTranscribe(
    streamAction: STREAMING_ACTION,
    waveform?: number[],
    audioLanguage?: SpeechToTextLanguage
  ): Promise<string> {
    try {
      if (!this.isReady) throw Error(getError(ETError.ModuleNotLoaded));
      if (!!audioLanguage !== this.config.isMultilingual)
        throw new Error(getError(ETError.MultilingualConfiguration));

      if (
        streamAction === STREAMING_ACTION.START &&
        !this.streaming &&
        this.isGenerating
      )
        throw Error(getError(ETError.ModelGenerating));
      if (streamAction === STREAMING_ACTION.START && this.streaming)
        throw Error(getError(ETError.ModelGenerating));
      if (streamAction === STREAMING_ACTION.DATA && !this.streaming)
        throw Error(getError(ETError.StreamingNotStarted));
      if (streamAction === STREAMING_ACTION.STOP && !this.streaming)
        throw Error(getError(ETError.StreamingNotStarted));
      if (streamAction === STREAMING_ACTION.DATA && !waveform)
        throw new Error(getError(ETError.MissingDataChunk));
    } catch (e) {
      this.onErrorCallback(e);
      return '';
    }

    if (streamAction === STREAMING_ACTION.START) {
      this.resetState();
      this.streaming = true;
      this.isGeneratingCallback(true);
    }

    this.waveform = [...this.waveform, ...(waveform || [])];

    // while buffer has at least required size get chunk and decode
    while (this.waveform.length >= this.expectedChunkLength()) {
      const chunk = this.waveform.slice(
        0,
        this.windowSize +
          this.overlapSeconds * (1 + Number(this.seqs.length > 0))
      );
      this.chunks = [chunk]; //save last chunk for STREAMING_ACTION.STOP
      this.waveform = this.waveform.slice(
        this.windowSize - this.overlapSeconds * Number(this.seqs.length === 0)
      );
      const seq = await this.decodeChunk(chunk, audioLanguage);
      this.seqs.push(seq);

      if (this.seqs.length < 2) continue;

      await this.trimSequences(audioLanguage);
      await this.handleOverlaps(this.seqs);
    }

    // got final package, process all remaining waveform data
    // since we run the loop above the waveform has at most one chunk in it
    if (streamAction === STREAMING_ACTION.STOP) {
      // pad remaining waveform data with previous chunk to this.windowSize + 2 * this.overlapSeconds
      const chunk = this.chunks.length
        ? [
            ...this.chunks[0]!.slice(0, this.windowSize),
            ...this.waveform,
          ].slice(-this.windowSize - 2 * this.overlapSeconds)
        : this.waveform;

      this.waveform = [];
      const seq = await this.decodeChunk(chunk, audioLanguage);
      this.seqs.push(seq);

      if (this.seqs.length === 1) {
        this.sequence = this.seqs[0]!;
      } else {
        await this.trimSequences(audioLanguage);
        await this.handleOverlaps(this.seqs);
        this.sequence = [...this.sequence, ...this.seqs.at(-1)!];
      }
      this.decodedTranscribeCallback(this.sequence);
      this.isGeneratingCallback(false);
      this.streaming = false;
    }

    const decodedText = await this.tokenIdsToText(this.sequence);

    return decodedText;
  }

  public async encode(waveform: number[]) {
    return await this.speechToTextNativeModule.encode(waveform);
  }

  public async decode(seq: number[], encodings?: number[]) {
    return await this.speechToTextNativeModule.decode(seq, encodings || []);
  }
}
