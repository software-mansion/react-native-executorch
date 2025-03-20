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

  // Audio config
  private audioContext: AudioContext;
  private audioBuffer: AudioBuffer | null = null;

  private overlapSeconds = 1.2;
  private windowSize = 7;

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
  }: {
    transcribeCallback: (sequence: string) => void;
    modelDownloadProgessCallback?: (downloadProgress: number) => void;
    isReadyCallback?: (isReady: boolean) => void;
    isGeneratingCallback?: (isGenerating: boolean) => void;
    onErrorCallback?: (error: Error | undefined) => void;
    overlapSeconds?: number;
    windowSize?: number;
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
    this.windowSize = (windowSize || this.windowSize) * SECOND;
    this.overlapSeconds = overlapSeconds || this.overlapSeconds;
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
    } catch (e) {
      this.onErrorCallback?.(e);
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
