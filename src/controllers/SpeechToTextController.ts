import { _SpeechToTextModule } from '../native/RnExecutorchModules';
import * as FileSystem from 'expo-file-system';
import { fetchResource } from '../utils/fetchResource';
import { ResourceSource } from '../types/common';
import {
  HAMMING_DIST_THRESHOLD,
  SECOND,
  MODEL_CONFIGS,
  ModelConfig,
  MODES,
  STREAMING_ACTION,
} from '../constants/sttDefaults';

const longCommonInfPref = (seq1: number[], seq2: number[]) => {
  let maxInd = 0;
  let maxLength = 0;

  for (let i = 0; i < seq1.length; i++) {
    let j = 0;
    let hammingDist = 0;
    while (
      j < seq2.length &&
      i + j < seq1.length &&
      (seq1[i + j] === seq2[j] || hammingDist < HAMMING_DIST_THRESHOLD)
    ) {
      if (seq1[i + j] !== seq2[j]) {
        hammingDist++;
      }
      j++;
    }
    if (j >= maxLength) {
      maxLength = j;
      maxInd = i;
    }
  }
  return maxInd;
};

export class SpeechToTextController {
  private nativeModule: _SpeechToTextModule;

  private overlapSeconds!: number;
  private windowSize!: number;

  private chunks: number[][] = [];
  public sequence: number[] = [];
  public isReady = false;
  public isGenerating = false;
  private modelName!: 'moonshine' | 'whisper';
  private seqs: number[][] = [];
  private prevSeq: number[] = [];
  private streamWaveform: number[] = [];
  private isDecodingChunk = false;
  private numberOfDecodedChunks = 0;

  // tokenizer tokens to string mapping used for decoding sequence
  private tokenMapping!: { [key: number]: string };

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

  private async fetchTokenizer(
    localUri?: ResourceSource
  ): Promise<{ [key: number]: string }> {
    let tokenzerUri = await fetchResource(
      localUri || this.config.tokenizer.source
    );
    return JSON.parse(await FileSystem.readAsStringAsync(tokenzerUri));
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
      this.tokenMapping = await this.fetchTokenizer(tokenizerSource);
      encoderSource = await fetchResource(
        encoderSource || this.config.sources.encoder,
        (progress) => this.modelDownloadProgessCallback?.(progress / 2)
      );

      decoderSource = await fetchResource(
        decoderSource || this.config.sources.decoder,
        (progress) => this.modelDownloadProgessCallback?.(0.5 + progress / 2)
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
      console.error('Error when loading the SpeechToTextController!', e);
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

  private async decodeChunk(chunk: number[]): Promise<number[]> {
    let lastToken = this.config.tokenizer.sos;
    let seq = [lastToken];
    let prevSeqTokenIdx = 0;
    try {
      await this.nativeModule.encode(chunk);
    } catch (error) {
      this.onErrorCallback?.(`Encode ${error}`);
      return [];
    }
    while (lastToken !== this.config.tokenizer.eos) {
      try {
        lastToken = await this.nativeModule.decode(seq);
      } catch (error) {
        this.onErrorCallback?.(`Decode ${error}`);
        return [];
      }
      seq = [...seq, lastToken];
      if (
        this.seqs.length > 0 &&
        seq.length < this.seqs.at(-1)!.length &&
        seq.length % 3 !== 0
      ) {
        this.prevSeq = [...this.prevSeq, this.seqs.at(-1)![prevSeqTokenIdx++]!];
        this.decodedTranscribeCallback(this.prevSeq);
      }
    }
    return seq;
  }

  private handleOverlaps(seqs: number[][]): number[] {
    const maxInd = longCommonInfPref(seqs.at(-2)!, seqs.at(-1)!);
    let finalSeq = [...this.sequence, ...seqs.at(-2)!.slice(0, maxInd)];
    this.sequence = finalSeq;
    this.decodedTranscribeCallback(finalSeq);
    return finalSeq;
  }

  public async transcribe(waveform: number[]): Promise<string> {
    if (!this.isReady) {
      this.onErrorCallback?.(new Error('Model is not yet ready'));
      return '';
    }
    if (this.isGenerating) {
      this.onErrorCallback?.(new Error('Model is already transcribing'));
      return '';
    }
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
      // remove sos/eos token and 3 additional ones
      if (this.seqs.length === 0) {
        this.seqs = [seq.slice(0, -4)];
      } else if (this.seqs.length === this.chunks.length - 1) {
        this.seqs = [...this.seqs, seq.slice(4)];
      } else {
        this.seqs = [...this.seqs, seq.slice(4, -4)];
      }
      if (this.seqs.length < 2) {
        continue;
      }

      this.prevSeq = this.handleOverlaps(this.seqs);

      //last sequence processed
      if (this.seqs.length === this.chunks.length) {
        finalSeq = [...this.sequence, ...this.seqs.at(-1)!];
        this.sequence = finalSeq;
        this.decodedTranscribeCallback(finalSeq);
        this.prevSeq = finalSeq;
      }
    }
    const decodedSeq = this.decodeSeq(this.sequence);
    this.isGeneratingCallback(false);
    return decodedSeq;
  }

  public async streamingTranscribe(
    waveform: number[],
    streamAction: STREAMING_ACTION
  ): Promise<string> {
    if (!this.isReady) {
      this.onErrorCallback?.(new Error('Model is not yet ready'));
      return '';
    }
    this.onErrorCallback?.(undefined);

    if (streamAction == STREAMING_ACTION.START) {
      this.sequence = [];
      this.seqs = [];
      this.streamWaveform = [];
      this.prevSeq = [];
      this.numberOfDecodedChunks = 0;
      this.decodedTranscribeCallback([]);
      this.isGeneratingCallback(true);
    }
    this.streamWaveform = [...this.streamWaveform, ...waveform];
    this.chunkWaveform(this.streamWaveform);
    if (!this.isDecodingChunk && streamAction != 2) {
      this.isDecodingChunk = true;
      while (
        this.chunks.at(this.numberOfDecodedChunks)?.length ==
          2 * this.overlapSeconds + this.windowSize ||
        (this.numberOfDecodedChunks == 0 &&
          this.chunks.at(this.numberOfDecodedChunks)?.length ==
            this.windowSize + this.overlapSeconds)
      ) {
        let seq = await this.decodeChunk(
          this.chunks.at(this.numberOfDecodedChunks)!
        );
        // remove sos/eos token and 3 additional ones
        if (this.numberOfDecodedChunks == 0) {
          this.seqs = [seq.slice(0, -4)];
        } else {
          this.seqs = [...this.seqs, seq.slice(4, -4)];
          this.prevSeq = this.handleOverlaps(this.seqs);
        }
        this.numberOfDecodedChunks++;
        if (this.seqs.length < 2) {
          continue;
        }
      }
      this.isDecodingChunk = false;
    }
    while (
      this.numberOfDecodedChunks < this.chunks.length &&
      streamAction == STREAMING_ACTION.STOP
    ) {
      let seq = await this.decodeChunk(
        this.chunks.at(this.numberOfDecodedChunks)!
      );
      if (this.numberOfDecodedChunks == 0) {
        this.sequence = seq;
        this.decodedTranscribeCallback(seq);
        this.isGeneratingCallback(false);
        break;
      }
      //last sequence processed
      if (this.numberOfDecodedChunks == this.chunks.length - 1) {
        let finalSeq = [...this.sequence, ...seq];
        this.sequence = finalSeq;
        this.decodedTranscribeCallback(finalSeq);
        this.isGeneratingCallback(false);
      } else {
        this.seqs = [...this.seqs, seq.slice(4, -4)];
        this.handleOverlaps(this.seqs);
      }
      this.numberOfDecodedChunks++;
    }
    const decodedSeq = this.decodeSeq(this.sequence);
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
    return await this.nativeModule.encode(waveform);
  }

  public async decode(seq: number[], encodings?: number[]) {
    return await this.nativeModule.decode(seq, encodings);
  }
}
