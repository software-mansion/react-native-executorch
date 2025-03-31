import {
  HAMMING_DIST_THRESHOLD,
  MODEL_CONFIGS,
  SECOND,
  MODES,
} from '../constants/sttDefaults';
import { AvailableModels, ModelConfig } from '../types/stt';
import {
  _SpeechToTextModule,
  _TokenizerModule,
} from '../native/RnExecutorchModules';
import { ResourceSource } from '../types/common';
import { fetchResource } from '../utils/fetchResource';
import { longCommonInfPref } from '../utils/stt';

export class SpeechToTextController {
  private nativeModule: _SpeechToTextModule;

  private overlapSeconds!: number;
  private windowSize!: number;

  private chunks: number[][] = [];
  public sequence: number[] = [];
  public isReady = false;
  public isGenerating = false;
  private nativeTokenizer = new _TokenizerModule();

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
  }

  private async getStartingTokenIds(lang?: string): Promise<number[]> {
    // We need different starting token ids based on the multilinguality of the model.
    // The eng verison only needs BOS token, while the multilingual one needs:
    // [BOS, LANG, TRANSCRIBE]. Optionally we should also set notimestamps token, as timestamping
    // is not yet supported.
    if (!lang) {
      return [this.config.tokenizer.bos];
    }
    // FIXME: I should use .getTokenId for the BOS as well, should remove it from config
    const langTokenId = await this.nativeTokenizer.tokenToId(`<|${lang}|>`);
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

  // TODO: think about narrowing the type of speakerLanguage
  public async transcribe(
    waveform: number[],
    speakerLanguage?: string
  ): Promise<string> {
    try {
      this.checkCanTranscribe();
    } catch (e) {
      this.onErrorCallback?.(e);
      return '';
    }

    if (!speakerLanguage && this.config.isMultilingual) {
      this.onErrorCallback?.(
        new Error(
          'Language parameter was not provided for a multilingual model. Please pass lang parameter to the transcribe.'
        )
      );
      return '';
    } else if (speakerLanguage && !this.config.isMultilingual) {
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
      let seq;

      seq = await this.getStartingTokenIds(speakerLanguage);
      let numSpecialTokens = seq.length;
      let encoderOutput;
      try {
        encoderOutput = await this.nativeModule.encode(
          this.chunks!.at(chunkId)!
        );
      } catch (error) {
        this.onErrorCallback?.(`Encode ${error}`);
        return '';
      }

      let lastToken;
      while (lastToken !== this.config.tokenizer.eos) {
        lastToken = seq[seq.length - 1];
        try {
          // Returns a single predicted token
          lastToken = await this.nativeModule.decode(seq, encoderOutput);
        } catch (error) {
          this.onErrorCallback?.(
            `An error has ocurred while decoding: ${error}`
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
        seqs = [seq.slice(0, -(numSpecialTokens + 3))];
      } else if (
        seqs.length ===
        Math.ceil(waveform.length / this.windowSize) - 1
      ) {
        seqs.push(seq.slice(numSpecialTokens + 3));
      } else {
        seqs.push(seq.slice(numSpecialTokens + 3, -(numSpecialTokens + 3)));
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
      if (seqs.length === Math.ceil(waveform.length / this.windowSize)) {
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
      return this.nativeTokenizer.decode(tokenIds);
    } catch (e) {
      this.onErrorCallback?.(
        new Error(`Error when decoding the token ids: ${e}`)
      );
      return '';
    }
  }
}
