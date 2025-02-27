import { AudioContext, AudioBuffer } from 'react-native-audio-api';
import { _SpeechToTextModule } from '../../native/RnExecutorchModules';
import * as FileSystem from 'expo-file-system';
import {
  MOONSHINE_ENCODER,
  MOONSHINE_DECODER,
  WHISPER_DECODER,
  WHISPER_ENCODER,
  WHISPER_PREPROCESSOR,
  WHISPER_TOKENIZER,
  MOONSHINE_TOKENIZER,
} from '../../constants/modelUrls';
import { fetchResource } from '../../utils/fetchResource';

const SECOND = 16_000;
const SAMPLE_RATE = 16_000;

const MODEL_SOURCES = {
  moonshine: [MOONSHINE_ENCODER, MOONSHINE_DECODER],
  whisper: [WHISPER_PREPROCESSOR, WHISPER_ENCODER, WHISPER_DECODER],
};

const longCommonInfPref = (seq1: number[], seq2: number[]) => {
  let maxInd = 0;
  let maxLength = 0;
  const HAMMING_DIST_THRESHOLD = 1;

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
  private chunks: number[][] = [];
  private overlap_seconds = 1.2;
  private window_size = SECOND * 7;
  private MOONSHINE_SOS = 1;
  private MOONSHINE_EOS = 2;
  private MOONSHINE_SPECIAL_CHAR = '\u2581';
  private WHISPER_SPECIAL_CHAR = 'Ġ';
  private WHISPER_SOS = 50257;
  private WHISPER_EOS = 50256;
  public sequence: number[] = [];
  public isReady = false;
  public isGenerating = false;
  private eos_token!: number;
  private sos_token!: number;
  private modelName: 'moonshine' | 'whisper' = 'moonshine';
  private transribeCallback: (sequence: number[]) => void;
  private modelDownloadProgessCallback: (downloadProgress: number) => void;
  private tokenMapping!: { [key: number]: string };

  constructor({
    transribeCallback,
    modelDownloadProgessCallback,
    overlap_seconds,
    window_size,
  }: {
    transribeCallback: (sequence: number[]) => void;
    modelDownloadProgessCallback?: (downloadProgress: number) => void;
    overlap_seconds?: number;
    window_size?: number;
  }) {
    this.transribeCallback = transribeCallback;
    this.modelDownloadProgessCallback =
      modelDownloadProgessCallback || ((_) => {});
    this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    this.nativeModule = new _SpeechToTextModule();
    this.window_size = window_size || this.window_size;
    this.overlap_seconds = overlap_seconds || this.overlap_seconds;
  }

  private async fetch_tokenizer(): Promise<{ [key: number]: string }> {
    return fetch(
      this.modelName === 'moonshine' ? MOONSHINE_TOKENIZER : WHISPER_TOKENIZER
    ).then((resp) => resp.json());
  }

  public async loadModel(
    modelName: 'moonshine' | 'whisper',
    fileUris?: string[]
  ) {
    this.modelName = modelName;
    this.tokenMapping = await this.fetch_tokenizer();
    this.sos_token =
      this.modelName === 'moonshine' ? this.MOONSHINE_SOS : this.WHISPER_SOS;
    this.eos_token =
      this.modelName === 'moonshine' ? this.MOONSHINE_EOS : this.WHISPER_EOS;

    let modelPaths: string[] = [];
    if (fileUris) {
      modelPaths = fileUris;
    } else {
      for (let idx in MODEL_SOURCES[modelName]) {
        let moduleSource = MODEL_SOURCES[modelName][idx]!;
        try {
          modelPaths.push(
            await fetchResource(
              moduleSource,
              //set download progress to % of download for all submodels of the model
              (progress) =>
                this.modelDownloadProgessCallback(
                  (Number(idx) * 100 + progress) /
                    MODEL_SOURCES[modelName].length
                )
            )
          );
        } catch (e) {
          console.error(`Error when fetching resource: ${moduleSource}`, e);
        }
      }
    }

    try {
      this.isReady = false;
      await this.nativeModule.loadModule(modelName, modelPaths);
      this.isReady = true;
    } catch (e) {
      console.error('Error when loading the SpeechToTextController!', e);
    }
  }

  public async loadAudio(url: string) {
    this.audioBuffer = await FileSystem.downloadAsync(
      url,
      FileSystem.documentDirectory + '_tmp_transcribe_audio.mp3'
    ).then(({ uri }) => {
      return this.audioContext.decodeAudioDataSource(uri);
    });
  }

  private chunkWaveform(waveform: number[]) {
    for (let i = 0; i < Math.ceil(waveform.length / this.window_size); i++) {
      let chunk = waveform.slice(
        Math.max(this.window_size * i - this.overlap_seconds * SECOND, 0),
        Math.min(
          this.window_size * (i + 1) + this.overlap_seconds * SECOND,
          waveform.length
        )
      );

      this.chunks.push(chunk);
    }
  }

  public async transcribe(waveform?: number[]): Promise<string> {
    this.isGenerating = true;
    this.sequence = [];
    if (!waveform) {
      waveform = this.audioBuffer!.getChannelData(0);
    }
    this.chunkWaveform(waveform);

    let seqs: number[][] = [];
    let prevseq: number[] = [];
    for (let chunk_id = 0; chunk_id < this.chunks.length; chunk_id++) {
      let last_token = this.sos_token;
      let prev_seq_token_idx = 0;
      let final_seq: number[] = [];
      let seq = [last_token];
      const enc_output = await this.nativeModule.encode(
        this.chunks!.at(chunk_id)!
      );
      while (last_token !== this.eos_token) {
        let output = await this.nativeModule.decode(seq, [enc_output]);
        last_token = output[output.length - 1];
        seq = [...seq, last_token];
        if (
          seqs.length > 0 &&
          seq.length < seqs.at(-1)!.length &&
          seq.length % 3 !== 0
        ) {
          prevseq = [...prevseq, seqs.at(-1)![prev_seq_token_idx++]!];
          this.transribeCallback(prevseq);
        }
      }
      // remove sos/eos token and 3 additional ones
      if (seqs.length === 0) {
        seqs = [seq.slice(0, -4)];
      } else if (
        seqs.length ===
        Math.ceil(waveform.length / this.window_size) - 1
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
      this.transribeCallback(final_seq);
      prevseq = final_seq;

      //last sequence processed
      if (seqs.length === Math.ceil(waveform.length / this.window_size)) {
        final_seq = [...this.sequence, ...seqs.at(-1)!];
        this.sequence = final_seq;
        this.transribeCallback(final_seq);
        prevseq = final_seq;
      }
    }
    this.isGenerating = false;
    return this.decodeSeq(this.sequence);
  }

  public decodeSeq(seq?: number[]): string {
    if (!seq) seq = this.sequence;

    const SPECIAL_CHAR =
      this.modelName === 'moonshine'
        ? this.MOONSHINE_SPECIAL_CHAR
        : this.WHISPER_SPECIAL_CHAR;

    return seq
      .filter((token) => token !== this.eos_token && token !== this.sos_token)
      .map((token) => this.tokenMapping[token])
      .join('')
      .replaceAll(SPECIAL_CHAR, ' ');
  }
}
