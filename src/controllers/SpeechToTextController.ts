import { AudioContext, AudioBuffer } from 'react-native-audio-api';
import { _SpeechToTextModule } from '../native/RnExecutorchModules';
import * as FileSystem from 'expo-file-system';
import { fetchResource } from '../utils/fetchResource';
import { ResourceSource } from '../types/common';
import {
  HAMMING_DIST_THRESHOLD,
  SECOND,
  SAMPLE_RATE,
  MODEL_CONFIGS,
  ModelConfig,
  PRESETS,
} from '../constants/sttDefaults';

const longCommonInfPref = (seq1: number[], seq2: number[]) => {
  let maxInd = 0;
  let maxLength = 0;

  for (let i = 0; i < seq1.length; i++) {
    let j = 0;
    let hamming_dist = 0;
    while (
      j < seq2.length &&
      i + j < seq1.length &&
      (seq1[i + j] === seq2[j] || hamming_dist < HAMMING_DIST_THRESHOLD)
    ) {
      if (seq1[i + j] !== seq2[j]) {
        hamming_dist++;
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

  // Audio config
  private audioContext: AudioContext;
  private audioBuffer: AudioBuffer | null = null;

  private overlapSeconds!: number;
  private windowSize!: number;

  private chunks: number[][] = [];
  public sequence: number[] = [];
  public isReady = false;
  public isGenerating = false;
  private modelName!: 'moonshine' | 'whisper';

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
    preset,
  }: {
    transcribeCallback: (sequence: string) => void;
    modelDownloadProgessCallback?: (downloadProgress: number) => void;
    isReadyCallback?: (isReady: boolean) => void;
    isGeneratingCallback?: (isGenerating: boolean) => void;
    onErrorCallback?: (error: Error | undefined) => void;
    overlapSeconds?: number;
    windowSize?: number;
    preset?: keyof typeof PRESETS;
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
    this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    this.nativeModule = new _SpeechToTextModule();
    this.windowSize =
      (windowSize || PRESETS[preset || 'medium'].windowSize) * SECOND;
    this.overlapSeconds =
      overlapSeconds || PRESETS[preset || 'medium'].overlapSeconds;
  }

  private async fetch_tokenizer(
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
      this.tokenMapping = await this.fetch_tokenizer(tokenizerSource);
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

  public async loadAudio(url: string) {
    this.onErrorCallback?.(undefined);
    this.isReadyCallback(false);
    try {
      this.audioBuffer = await FileSystem.downloadAsync(
        url,
        FileSystem.documentDirectory + '_tmp_transcribe_audio.mp3'
      ).then(({ uri }) => {
        return this.audioContext.decodeAudioDataSource(uri);
      });
      return this.audioBuffer?.getChannelData(0);
    } catch (e) {
      this.onErrorCallback?.(e);
      return undefined;
    } finally {
      this.isReadyCallback(true);
    }
  }

  private chunkWaveform(waveform: number[]) {
    this.chunks = [];
    for (let i = 0; i < Math.ceil(waveform.length / this.windowSize); i++) {
      let chunk = waveform.slice(
        Math.max(this.windowSize * i - this.overlapSeconds * SECOND, 0),
        Math.min(
          this.windowSize * (i + 1) + this.overlapSeconds * SECOND,
          waveform.length
        )
      );

      this.chunks.push(chunk);
    }
  }

  public async transcribe(waveform?: number[]): Promise<string> {
    const _start = performance.now();
    let _latency;
    if (!this.isReady) {
      this.onErrorCallback?.(new Error('Model is not yet ready'));
      return '';
    }
    if (this.isGenerating) {
      this.onErrorCallback?.(new Error('Model is already transcribing'));
      return '';
    }
    this.onErrorCallback?.(undefined);
    this.isGeneratingCallback(true);

    this.sequence = [];
    if (!waveform) {
      waveform = this.audioBuffer!.getChannelData(0);
    }

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
    for (let chunk_id = 0; chunk_id < this.chunks.length; chunk_id++) {
      let last_token = this.config.tokenizer.sos;
      let prev_seq_token_idx = 0;
      let final_seq: number[] = [];
      let seq = [last_token];
      // let enc_output;
      try {
        // enc_output = await this.nativeModule.encode(this.chunks!.at(chunk_id)!);
        await this.nativeModule.encode(this.chunks!.at(chunk_id)!);
      } catch (error) {
        this.onErrorCallback?.(`Encode ${error}`);
        return '';
      }
      let _start2 = performance.now();
      while (last_token !== this.config.tokenizer.eos) {
        try {
          last_token = await this.nativeModule.decode(seq);
        } catch (error) {
          this.onErrorCallback?.(`Decode ${error}`);
          return '';
        }
        seq = [...seq, last_token];
        if (
          seqs.length > 0 &&
          seq.length < seqs.at(-1)!.length &&
          seq.length % 3 !== 0
        ) {
          prevseq = [...prevseq, seqs.at(-1)![prev_seq_token_idx++]!];
          _latency = _latency || performance.now() - _start;
          this.decodedTranscribeCallback(prevseq);
        }
      }
      console.log(
        `Decoded ${seq.length} tokens with speed: ${(performance.now() - _start2) / seq.length}`
      );

      if (this.chunks.length === 1) {
        final_seq = seq;
        this.sequence = final_seq;
        this.decodedTranscribeCallback(final_seq);
        break;
      }
      // remove sos/eos token and 3 additional ones
      if (seqs.length === 0) {
        seqs = [seq.slice(0, -4)];
      } else if (
        seqs.length ===
        Math.ceil(waveform.length / this.windowSize) - 1
      ) {
        seqs = [...seqs, seq.slice(4)];
      } else {
        seqs = [...seqs, seq.slice(4, -4)];
      }
      if (seqs.length < 2) {
        continue;
      }

      const maxInd = longCommonInfPref(seqs.at(-2)!, seqs.at(-1)!);
      final_seq = [...this.sequence, ...seqs.at(-2)!.slice(0, maxInd)];
      this.sequence = final_seq;
      this.decodedTranscribeCallback(final_seq);
      prevseq = final_seq;

      //last sequence processed
      if (seqs.length === Math.ceil(waveform.length / this.windowSize)) {
        final_seq = [...this.sequence, ...seqs.at(-1)!];
        this.sequence = final_seq;
        this.decodedTranscribeCallback(final_seq);
        prevseq = final_seq;
      }
    }
    const decodedSeq = this.decodeSeq(this.sequence);
    this.isGeneratingCallback(false);
    console.log(
      `latency: ${_latency} time: ${performance.now() - _start}, length: ${this.sequence.length}, t/s: ${this.sequence.length / (performance.now() - _start)}`
    );
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
      .replaceAll(this.config.tokenizer.special_char, ' ');
  }

  public async encode(waveform: number[]) {
    return await this.nativeModule.encode(waveform);
  }

  public async decode(seq: number[], encodings?: number[]) {
    return await this.nativeModule.decode(seq, encodings);
  }
}
