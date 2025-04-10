import {
  HAMMING_DIST_THRESHOLD,
  MODEL_CONFIGS,
  SECOND,
  MODES,
  STREAMING_ACTION,
  NUM_TOKENS_TO_SLICE,
} from '../constants/sttDefaults';
import { AvailableModels, ModelConfig } from '../types/stt';
import {
  _SpeechToTextModule,
  _TokenizerModule,
} from '../native/RnExecutorchModules';
import { ResourceSource } from '../types/common';
import { fetchResource } from '../utils/fetchResource';
import { longCommonInfPref } from '../utils/stt';
import { SpeechToTextLanguage } from '../types/stt';

export class SpeechToTextController {
  private nativeModule: _SpeechToTextModule;

  private overlapSeconds!: number;
  private windowSize!: number;

  private chunks: number[][] = [];
  public sequence: number[] = [];
  public isReady = false;
  public isGenerating = false;
  private nativeTokenizer = new _TokenizerModule();
  private seqs: number[][] = [];
  private prevSeq: number[] = [];
  private streamWaveform: number[] = [];
  private isDecodingChunk = false;
  private indexOfCurrentlyDecodingChunk = 0;
  private isChunkDeleted = false;
  private numOfChunks = 0;

  // User callbacks
  private decodedTranscribeCallback: (sequence: number[]) => void;
  private modelDownloadProgessCallback:
    | ((downloadProgress: number) => void)
    | undefined;
  private isReadyCallback: (isReady: boolean) => void;
  private isGeneratingCallback: (isGenerating: boolean) => void;
  private onErrorCallback: ((error: any) => void) | undefined;
  private config!: ModelConfig;

  constructor({
    transcribeCallback,
    modelDownloadProgessCallback,
    isReadyCallback,
    isGeneratingCallback,
    onErrorCallback,
    overlapSeconds,
    windowSize,
    streamingConfig,
  }: {
    transcribeCallback: (sequence: string) => void;
    modelDownloadProgessCallback?: (downloadProgress: number) => void;
    isReadyCallback?: (isReady: boolean) => void;
    isGeneratingCallback?: (isGenerating: boolean) => void;
    onErrorCallback?: (error: Error | undefined) => void;
    overlapSeconds?: number;
    windowSize?: number;
    streamingConfig?: keyof typeof MODES;
  }) {
    this.decodedTranscribeCallback = async (seq) =>
      transcribeCallback(await this.tokenIdsToText(seq));
    this.modelDownloadProgessCallback = modelDownloadProgessCallback;
    this.isReadyCallback = (isReady) => {
      this.isReady = isReady;
      isReadyCallback?.(isReady);
    };
    this.isGeneratingCallback = (isGenerating) => {
      this.isGenerating = isGenerating;
      isGeneratingCallback?.(isGenerating);
    };
    this.onErrorCallback = onErrorCallback;
    this.nativeModule = new _SpeechToTextModule();
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
    this.onErrorCallback?.(undefined);
    this.isReadyCallback(false);
    this.config = MODEL_CONFIGS[modelName];

    try {
      encoderSource = await fetchResource(
        encoderSource || this.config.sources.encoder,
        (progress) => this.modelDownloadProgessCallback?.(progress / 2)
      );

      decoderSource = await fetchResource(
        decoderSource || this.config.sources.decoder,
        (progress) => this.modelDownloadProgessCallback?.(0.5 + progress / 2)
      );

      let tokenizerUri = await fetchResource(
        tokenizerSource || this.config.tokenizer.source
      );

      // The tokenizer native module does not accept the file:// prefix
      await this.nativeTokenizer.load(tokenizerUri.replace('file://', ''));
    } catch (e) {
      this.onErrorCallback?.(e);
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
      await this.nativeModule.loadModule(modelName, [
        encoderSource!,
        decoderSource!,
      ]);
      this.modelDownloadProgessCallback?.(1);
      this.isReadyCallback(true);
    } catch (e) {
      this.onErrorCallback?.(
        new Error(`Error when loading the SpeechToTextController! ${e}`)
      );
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

  private chunkWaveform(waveform: number[], streamingSlice?: boolean) {
    this.chunks = [];
    this.numOfChunks = Math.ceil(waveform.length / this.windowSize);
    for (let i = 0; i < this.numOfChunks; i++) {
      let chunk: number[] = [];
      let left, right;
      if (streamingSlice) {
        left = Math.max(this.windowSize * i, 0);
        right = Math.min(
          this.overlapSeconds + this.windowSize * (i + 1) + this.overlapSeconds,
          waveform.length
        );
      } else {
        left = Math.max(this.windowSize * i - this.overlapSeconds, 0);
        right = Math.min(
          this.windowSize * (i + 1) + this.overlapSeconds,
          waveform.length
        );
      }
      chunk = waveform.slice(left, right);
      this.chunks.push(chunk);
    }
  }

  private checkCanTranscribe() {
    if (!this.isReady) {
      throw Error('Model is not yet ready');
    }
    if (this.isGenerating) {
      throw Error('Model is already transcribing');
    }
  }

  public async encode(waveform: number[]) {
    return await this.nativeModule.encode(waveform);
  }

  public async decode(seq: number[], encodings?: number[]) {
    return await this.nativeModule.decode(seq, encodings);
  }

  private async getStartingTokenIds(audioLanguage?: string): Promise<number[]> {
    // We need different starting token ids based on the multilinguality of the model.
    // The eng verison only needs BOS token, while the multilingual one needs:
    // [BOS, LANG, TRANSCRIBE]. Optionally we should also set notimestamps token, as timestamping
    // is not yet supported.
    if (!audioLanguage) {
      return [this.config.tokenizer.bos];
    }
    // FIXME: I should use .getTokenId for the BOS as well, should remove it from config
    const langTokenId = await this.nativeTokenizer.tokenToId(
      `<|${audioLanguage}|>`
    );
    const transcribeTokenId =
      await this.nativeTokenizer.tokenToId('<|transcribe|>');
    const noTimestampsTokenId =
      await this.nativeTokenizer.tokenToId('<|notimestamps|>');
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
    let seq = await this.getStartingTokenIds(audioLanguage);
    let prevSeqTokenIdx = 0;
    let encoderOutput;
    try {
      encoderOutput = await this.nativeModule.encode(chunk);
    } catch (error) {
      this.onErrorCallback?.(`An error has ocurred while encoding ${error}`);
      return [];
    }
    let lastToken = seq.at(-1) as number;
    while (lastToken !== this.config.tokenizer.eos) {
      try {
        lastToken = await this.nativeModule.decode(seq, encoderOutput);
      } catch (error) {
        this.onErrorCallback?.(`Decode ${error}`);
        return [];
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

  private handleOverlaps(seqs: number[][]): number[] {
    const maxInd = longCommonInfPref(
      seqs.at(-2)!,
      seqs.at(-1)!,
      HAMMING_DIST_THRESHOLD
    );
    let finalSeq = [...this.sequence, ...seqs.at(-2)!.slice(0, maxInd)];
    this.sequence = finalSeq.slice();
    this.decodedTranscribeCallback(finalSeq);
    return finalSeq;
  }

  public async transcribe(
    waveform: number[],
    audioLanguage?: SpeechToTextLanguage
  ): Promise<string> {
    try {
      this.checkCanTranscribe();
    } catch (e) {
      this.onErrorCallback?.(e);
      return '';
    }

    if (!audioLanguage && this.config.isMultilingual) {
      this.onErrorCallback?.(
        new Error(
          'Language parameter was not provided for a multilingual model. Please pass lang parameter to the transcribe.'
        )
      );
      return '';
    } else if (audioLanguage && !this.config.isMultilingual) {
      this.onErrorCallback?.(
        new Error(
          'Language parameter was passed to a non-multilingual model. Please either use a multilingual version or delete the lang parameter.'
        )
      );
      return '';
    }

    // Making sure that the error is not set when we get there
    this.onErrorCallback?.(undefined);
    this.decodedTranscribeCallback([]);
    this.isGeneratingCallback(true);

    this.sequence = [];
    this.seqs = [];
    this.prevSeq = [];
    this.chunkWaveform(waveform);

    for (let chunkId = 0; chunkId < this.chunks.length; chunkId++) {
      let seq = await this.decodeChunk(this.chunks!.at(chunkId)!);
      let finalSeq: number[] = [];
      if (this.chunks.length === 1) {
        finalSeq = seq;
        this.sequence = finalSeq;
        this.decodedTranscribeCallback(finalSeq);
        break;
      }
      const numSpecialTokens = (await this.getStartingTokenIds(audioLanguage))
        .length;
      // Remove starting tokenIds and some additional ones
      if (this.seqs.length === 0) {
        this.seqs = [seq.slice(0, -(numSpecialTokens + NUM_TOKENS_TO_SLICE))];
      } else if (this.seqs.length === this.chunks.length - 1) {
        this.seqs.push(seq.slice(numSpecialTokens + NUM_TOKENS_TO_SLICE));
      } else {
        this.seqs.push(
          seq.slice(
            numSpecialTokens + NUM_TOKENS_TO_SLICE,
            -(numSpecialTokens + NUM_TOKENS_TO_SLICE)
          )
        );
      }
      if (this.seqs.length < 2) {
        continue;
      }

      finalSeq = this.handleOverlaps(this.seqs);
      this.prevSeq = finalSeq;

      //last sequence processed
      if (this.seqs.length === this.chunks.length) {
        finalSeq = [...this.sequence, ...this.seqs.at(-1)!];
        this.sequence = finalSeq;
        this.decodedTranscribeCallback(finalSeq);
        this.prevSeq = finalSeq;
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
    if (!this.isReady) {
      this.onErrorCallback?.(new Error('Model is not yet ready'));
      return '';
    }
    if (streamAction == STREAMING_ACTION.DATA && !waveform) {
      this.onErrorCallback?.(new Error('Waveform has to be provided'));
      return '';
    }
    this.onErrorCallback?.(undefined);

    if (streamAction == STREAMING_ACTION.START) {
      this.sequence = [];
      this.seqs = [];
      this.streamWaveform = [];
      this.prevSeq = [];
      this.indexOfCurrentlyDecodingChunk = 0;
      this.isChunkDeleted = false;
      this.decodedTranscribeCallback([]);
      this.isGeneratingCallback(true);
    }
    this.streamWaveform = [...this.streamWaveform, ...waveform!];
    this.chunkWaveform(this.streamWaveform, this.isDecodingChunk);
    if (!this.isDecodingChunk && streamAction != STREAMING_ACTION.STOP) {
      this.isDecodingChunk = true;
      while (
        this.chunks.at(this.indexOfCurrentlyDecodingChunk)?.length ==
          2 * this.overlapSeconds + this.windowSize ||
        (this.indexOfCurrentlyDecodingChunk == 0 &&
          this.chunks.at(0)?.length == this.windowSize + this.overlapSeconds)
      ) {
        let seq = await this.decodeChunk(
          this.chunks.at(this.indexOfCurrentlyDecodingChunk)!,
          audioLanguage
        );
        const numSpecialTokens = (await this.getStartingTokenIds(audioLanguage))
          .length;
        // remove sos/eos token and some additional ones
        if (this.indexOfCurrentlyDecodingChunk == 0) {
          this.seqs = [seq.slice(0, -(numSpecialTokens + NUM_TOKENS_TO_SLICE))];
        } else {
          this.seqs = [
            ...this.seqs,
            seq.slice(
              numSpecialTokens + NUM_TOKENS_TO_SLICE,
              -(numSpecialTokens + NUM_TOKENS_TO_SLICE)
            ),
          ];
          this.prevSeq = this.handleOverlaps(this.seqs);
        }
        this.indexOfCurrentlyDecodingChunk++;
        // remove data, which was processed and saved to this.seqs
        if (this.numOfChunks > 2) {
          this.streamWaveform = this.isChunkDeleted
            ? this.streamWaveform.slice(this.windowSize)
            : this.streamWaveform.slice(this.windowSize - this.overlapSeconds);
          this.isChunkDeleted = true;
          this.indexOfCurrentlyDecodingChunk--;
          break;
        }
      }
      this.isDecodingChunk = false;
    }
    while (streamAction == STREAMING_ACTION.STOP) {
      let seq = await this.decodeChunk(
        this.chunks.at(this.indexOfCurrentlyDecodingChunk)!
      );
      if (this.seqs.length == 0) {
        this.sequence = seq;
        this.decodedTranscribeCallback(seq);
        this.isGeneratingCallback(false);
        break;
      }
      //last sequence processed
      const numSpecialTokens = (await this.getStartingTokenIds(audioLanguage))
        .length;
      if (this.indexOfCurrentlyDecodingChunk == this.numOfChunks - 1) {
        this.seqs.push(seq.slice(numSpecialTokens + NUM_TOKENS_TO_SLICE));
      } else {
        this.seqs = [
          ...this.seqs,
          seq.slice(
            numSpecialTokens + NUM_TOKENS_TO_SLICE,
            -(numSpecialTokens + NUM_TOKENS_TO_SLICE)
          ),
        ];
      }
      this.handleOverlaps(this.seqs);
      if (this.indexOfCurrentlyDecodingChunk == this.numOfChunks - 1) {
        let finalSeq = [...this.sequence, ...this.seqs.at(-1)!];
        this.sequence = finalSeq;
        this.decodedTranscribeCallback(finalSeq);
        this.isGeneratingCallback(false);
        break;
      }
      this.indexOfCurrentlyDecodingChunk++;
    }
    const decodedText = await this.tokenIdsToText(this.sequence);
    return decodedText;
  }

  private async tokenIdsToText(tokenIds: number[]): Promise<string> {
    try {
      return this.nativeTokenizer.decode(tokenIds, true);
    } catch (e) {
      this.onErrorCallback?.(
        new Error(`An error has ocurred when decoding the token ids: ${e}`)
      );
      return '';
    }
  }
}
