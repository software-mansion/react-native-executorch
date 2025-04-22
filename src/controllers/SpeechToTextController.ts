import { SpeechToTextNativeModule } from '../native/RnExecutorchModules';
import * as FileSystem from 'expo-file-system';
import { ResourceFetcher } from '../utils/ResourceFetcher';
import { ResourceSource } from '../types/common';
import {
  HAMMING_DIST_THRESHOLD,
  MODEL_CONFIGS,
  SECOND,
  MODES,
  NUM_TOKENS_TO_SLICE,
} from '../constants/sttDefaults';
import { AvailableModels, ModelConfig } from '../types/stt';
import { longCommonInfPref } from '../utils/stt';
import { SpeechToTextLanguage } from '../types/stt';

export class SpeechToTextController {
  private speechToTextNativeModule: typeof SpeechToTextNativeModule;

  private overlapSeconds!: number;
  private windowSize!: number;

  private chunks: number[][] = [];
  public sequence: number[] = [];
  public isReady = false;
  public isGenerating = false;
  private nativeTokenizer = new _TokenizerModule();

  // User callbacks
  private decodedTranscribeCallback: (sequence: number[]) => void;
  private modelDownloadProgressCallback:
    | ((downloadProgress: number) => void)
    | undefined;
  private isReadyCallback: (isReady: boolean) => void;
  private isGeneratingCallback: (isGenerating: boolean) => void;
  private onErrorCallback: ((error: any) => void) | undefined;
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
    this.onErrorCallback = onErrorCallback;
    this.speechToTextNativeModule = SpeechToTextNativeModule;
    this.configureStreaming(
      overlapSeconds,
      windowSize,
      streamingConfig || 'balanced'
    );
  }

  private async fetchTokenizer(
    localUri?: ResourceSource
  ): Promise<{ [key: number]: string }> {
    let tokenzerUri = await ResourceFetcher.fetch(
      localUri || this.config.tokenizer.source
    );
    return JSON.parse(await FileSystem.readAsStringAsync(tokenzerUri));
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
      this.tokenMapping = await this.fetchTokenizer(tokenizerSource);
      [encoderSource, decoderSource] =
        await ResourceFetcher.fetchMultipleResources(
          this.modelDownloadProgessCallback,
          encoderSource || this.config.sources.encoder,
          decoderSource || this.config.sources.decoder
        );
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
      await this.speechToTextNativeModule.loadModule(modelName, [
        encoderSource!,
        decoderSource!,
      ]);
      this.modelDownloadProgressCallback?.(1);
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

  private chunkWaveform(waveform: number[]) {
    this.chunks = [];
    const numOfChunks = Math.ceil(waveform.length / this.windowSize);
    for (let i = 0; i < numOfChunks; i++) {
      let chunk = waveform.slice(
        Math.max(this.windowSize * i - this.overlapSeconds, 0),
        Math.min(
          this.windowSize * (i + 1) + this.overlapSeconds,
          waveform.length
        )
      );
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
    this.onErrorCallback?.(undefined);
    this.isGeneratingCallback(true);

    this.sequence = [];

    if (!waveform) {
      this.isGeneratingCallback(false);

      this.onErrorCallback?.(
        new Error(
          `Nothing to transcribe, perhaps you forgot to call this.loadAudio().`
        )
      );
    }

    this.chunkWaveform(waveform);

    let seqs: number[][] = [];
    let prevseq: number[] = [];
    for (let chunkId = 0; chunkId < this.chunks.length; chunkId++) {
      let lastToken = this.config.tokenizer.sos;
      let prevSeqTokenIdx = 0;
      let finalSeq: number[] = [];
      let seq = [lastToken];
      try {
        await this.speechToTextNativeModule.encode(this.chunks!.at(chunkId)!);
      } catch (error) {
        this.onErrorCallback?.(`Encode ${error}`);
        return '';
      }
      while (lastToken !== this.config.tokenizer.eos) {
        try {
          lastToken = await this.decode(seq);
        } catch (error) {
          this.onErrorCallback?.(`Decode ${error}`);
          return '';
        }
        seq = [...seq, lastToken];
        if (
          seqs.length > 0 &&
          seq.length < seqs.at(-1)!.length &&
          seq.length % 3 !== 0
        ) {
          prevseq = [...prevseq, seqs.at(-1)![prevSeqTokenIdx++]!];
          this.decodedTranscribeCallback(prevseq);
        }
      }

      if (this.chunks.length === 1) {
        finalSeq = seq;
        this.sequence = finalSeq;
        this.decodedTranscribeCallback(finalSeq);
        break;
      }
      // remove sos/eos token and 3 additional ones
      if (seqs.length === 0) {
        seqs = [seq.slice(0, -4)];
      } else if (seqs.length === this.chunks.length - 1) {
        seqs = [...seqs, seq.slice(4)];
      } else {
        seqs = [...seqs, seq.slice(4, -4)];
      }
      if (seqs.length < 2) {
        continue;
      }

      const maxInd = longCommonInfPref(seqs.at(-2)!, seqs.at(-1)!);
      finalSeq = [...this.sequence, ...seqs.at(-2)!.slice(0, maxInd)];
      this.sequence = finalSeq;
      this.decodedTranscribeCallback(finalSeq);
      prevseq = finalSeq;

      //last sequence processed
      if (seqs.length === this.chunks.length) {
        finalSeq = [...this.sequence, ...seqs.at(-1)!];
        this.sequence = finalSeq;
        this.decodedTranscribeCallback(finalSeq);
        prevseq = finalSeq;
      }
    }
    const decodedSeq = this.decodeSeq(this.sequence);
    this.isGeneratingCallback(false);
    return decodedSeq;
  }

  public decodeSeq(seq?: number[]): string {
    if (!this.modelName) {
      this.onErrorCallback?.(
        new Error('Model is not loaded, call `loadModel` first')
      );
      return '';
    }
    this.onErrorCallback?.(undefined);
    if (!seq) seq = this.sequence;

    return seq
      .filter(
        (token) =>
          token !== this.config.tokenizer.eos &&
          token !== this.config.tokenizer.sos
      )
      .map((token) => this.tokenMapping[token])
      .join('')
      .replaceAll(this.config.tokenizer.specialChar, ' ');
  }

  public async encode(waveform: number[]) {
    return await this.speechToTextNativeModule.encode(waveform);
  }

  public async decode(seq: number[], encodings?: number[]) {
    /*
    CAUTION: When you pass empty decoding array, it uses the cached encodings.
    For instance, when you call .encode() for the first time, it internally caches
    the encoding results. 
    */
    return await this.speechToTextNativeModule.decode(seq, encodings || []);
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
    this.isGeneratingCallback(true);

    this.chunkWaveform(waveform);

    this.sequence = [];
    let seqs: number[][] = [];
    let prevSeq: number[] = [];
    for (let chunkId = 0; chunkId < this.chunks.length; chunkId++) {
      let prevSeqTokenIdx = 0;
      let finalSeq: number[] = [];

      let seq = await this.getStartingTokenIds(audioLanguage);
      const numSpecialTokens = seq.length;
      let encoderOutput;
      try {
        encoderOutput = await this.nativeModule.encode(
          this.chunks!.at(chunkId)!
        );
      } catch (error) {
        this.onErrorCallback?.(`An error has occurred while encoding ${error}`);
        return '';
      }

      let lastToken = seq.at(-1) as number;
      while (lastToken !== this.config.tokenizer.eos) {
        try {
          // Returns a single predicted token
          lastToken = await this.nativeModule.decode(seq, encoderOutput);
        } catch (error) {
          this.onErrorCallback?.(
            `An error has occurred while decoding: ${error}`
          );
          return '';
        }
        seq.push(lastToken);
        if (
          seqs.length > 0 &&
          seq.length < seqs.at(-1)!.length &&
          seq.length % 3 !== 0
        ) {
          prevSeq.push(seqs.at(-1)![prevSeqTokenIdx++]!);
          this.decodedTranscribeCallback(prevSeq);
        }
      }

      if (this.chunks.length === 1) {
        finalSeq = seq;
        this.sequence = finalSeq;
        this.decodedTranscribeCallback(finalSeq);
        break;
      }

      // Remove starting tokenIds and 3 additional ones
      if (seqs.length === 0) {
        seqs = [seq.slice(0, -(numSpecialTokens + NUM_TOKENS_TO_SLICE))];
      } else if (seqs.length === this.chunks.length - 1) {
        seqs.push(seq.slice(numSpecialTokens + NUM_TOKENS_TO_SLICE));
      } else {
        seqs.push(
          seq.slice(
            numSpecialTokens + NUM_TOKENS_TO_SLICE,
            -(numSpecialTokens + NUM_TOKENS_TO_SLICE)
          )
        );
      }
      if (seqs.length < 2) {
        continue;
      }

      const maxInd = longCommonInfPref(
        seqs.at(-2)!,
        seqs.at(-1)!,
        HAMMING_DIST_THRESHOLD
      );
      finalSeq = [...this.sequence, ...seqs.at(-2)!.slice(0, maxInd)];
      this.sequence = finalSeq;
      this.decodedTranscribeCallback(finalSeq);
      prevSeq = finalSeq;

      // last sequence processed
      if (seqs.length === this.chunks.length) {
        finalSeq = [...this.sequence, ...seqs.at(-1)!];
        this.sequence = finalSeq;
        this.decodedTranscribeCallback(finalSeq);
        prevSeq = finalSeq;
      }
    }
    const decodedText = await this.tokenIdsToText(this.sequence);
    this.isGeneratingCallback(false);
    return decodedText;
  }

  private async tokenIdsToText(tokenIds: number[]): Promise<string> {
    try {
      return this.nativeTokenizer.decode(tokenIds, true);
    } catch (e) {
      this.onErrorCallback?.(
        new Error(`An error has occurred when decoding the token ids: ${e}`)
      );
      return '';
    }
  }
}
