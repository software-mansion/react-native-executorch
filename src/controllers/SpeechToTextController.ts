import * as FileSystem from 'expo-file-system';
import { AudioBuffer, AudioContext } from 'react-native-audio-api';
import {
  HAMMING_DIST_THRESHOLD,
  MODEL_CONFIGS,
  ModelConfig,
  SAMPLE_RATE,
  SECOND,
} from '../constants/sttDefaults';
import { _SpeechToTextModule } from '../native/RnExecutorchModules';
import { TokenDecoder } from '../tokenizers/tokenDecoder';
import { ResourceSource } from '../types/common';
import { fetchResource } from '../utils/fetchResource';
import { longCommonInfPref } from '../utils/tokenizerUtils';

export class SpeechToTextController {
  private nativeModule: _SpeechToTextModule;

  private overlapSeconds!: number;
  private windowSize!: number;

  private chunks: number[][] = [];
  public sequence: number[] = [];
  public isReady = false;
  public isGenerating = false;
  private modelName!: 'moonshine' | 'whisper' | 'whisperMultilingual';
  private tokenDecoder = new TokenDecoder();

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
    this.decodedTranscribeCallback = (seq) =>
      transcribeCallback(this.decodeSeq(seq));
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
    modelName: 'moonshine' | 'whisper',
    encoderSource?: ResourceSource,
    decoderSource?: ResourceSource,
    tokenizerSource?: ResourceSource
  ) {
    this.onErrorCallback?.(undefined);
    this.isReadyCallback(false);
    this.config = MODEL_CONFIGS[modelName];
    this.modelName = modelName;

    try {
      encoderSource = await fetchResource(
        encoderSource || this.config.sources.encoder,
        (progress) => this.modelDownloadProgessCallback?.(progress / 2)
      );

      decoderSource = await fetchResource(
        decoderSource || this.config.sources.decoder,
        (progress) => this.modelDownloadProgessCallback?.(0.5 + progress / 2)
      );
      this.tokenDecoder.setVocabFromResource(
        tokenizerSource || this.config.tokenizer.source
      );
    } catch (e) {
      this.onErrorCallback?.(e);
      return;
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

  public async transcribe(waveform?: number[]): Promise<string> {
    try {
      this.checkCanTranscribe();
    } catch (e) {
      this.onErrorCallback?.(e);
    }

    // Making sure that the error is not set when we get there
    this.onErrorCallback?.(undefined);
    this.isGeneratingCallback(true);

    this.sequence = [];

    // if .getChannelData() returns nothing
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
    let prevSeq: number[] = [];
    for (let chunkId = 0; chunkId < this.chunks.length; chunkId++) {
      let lastToken = this.config.tokenizer.bos;
      let prevSeqTokenIdx = 0;
      let finalSeq: number[] = [];
      let seq = [lastToken];
      let encoderOutput;
      try {
        encoderOutput = await this.nativeModule.encode(
          this.chunks!.at(chunkId)!
        );
      } catch (error) {
        this.onErrorCallback?.(`Encode ${error}`);
        return '';
      }
      while (lastToken !== this.config.tokenizer.eos) {
        let output;
        try {
          output = await this.nativeModule.decode(seq, [encoderOutput]);
        } catch (error) {
          this.onErrorCallback?.(`Decode ${error}`);
          return '';
        }
        if (typeof output === 'number') {
          lastToken = output;
        } else {
          lastToken = output[output.length - 1];
        }
        seq.push(lastToken);
        if (
          seqs.length > 0 &&
          seq.length < seqs.at(-1)!.length &&
          seq.length % 3 !== 0
        ) {
          prevSeq = [...prevSeq, seqs.at(-1)![prevSeqTokenIdx++]!];
          this.decodedTranscribeCallback(prevSeq);
        }
      }

      if (this.chunks.length === 1) {
        finalSeq = seq;
        this.sequence = finalSeq;
        this.decodedTranscribeCallback(finalSeq);
        break;
      }
      // remove bos/eos token and 3 additional ones
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
    const decodedSeq = this.decodeSeq(this.sequence);
    this.isGeneratingCallback(false);
    return decodedSeq;
  }

  private decodeSeq(seq?: number[]): string {
    if (!this.modelName) {
      this.onErrorCallback?.(
        new Error('Model is not loaded, call `loadModel` first')
      );
      return '';
    }
    this.onErrorCallback?.(undefined);
    if (!seq) seq = this.sequence;

    const tokens = this.tokenDecoder.tokenIdsToTokens(seq);
    const text = this.tokenDecoder.tokensToDecodedText(tokens);
    return text;
  }
}
