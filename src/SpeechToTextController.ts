import { AudioContext, AudioBuffer } from 'react-native-audio-api';
import { _SpeechToTextModule } from './native/RnExecutorchModules';
import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system';

type ModelSource = string | number;
const SECOND = 16_000;
const SAMPLE_RATE = 16_000;

export class SpeechToTextController {
  private nativeModule: _SpeechToTextModule;
  // Audio config
  private audioContext: AudioContext;
  private audioBuffer: AudioBuffer | null = null;
  // private isReady: boolean = false;
  isGenerating: boolean = false;
  // private generatedTokens: number[] = [];
  // private tokenListener: EventSubscription | null = null;
  private chunks: number[][] = [];
  private window_size = SECOND * 7;
  private overlap_seconds = 1.2;
  isReady = false;
  // private isGenerating = false;

  constructor({} = {}) {
    this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    this.nativeModule = new _SpeechToTextModule();
  }

  public async loadModel(modeuleSources: ModelSource[]) {
    let modelPaths: string[] = [];
    for (let moduleSource in modeuleSources) {
      if (typeof moduleSource === 'number') {
        modelPaths.push(Image.resolveAssetSource(moduleSource).uri);
      } else {
        modelPaths.push(moduleSource);
      }
    }
    try {
      this.isReady = false;
      await this.nativeModule.loadModule(modelPaths);
      this.isReady = true;
    } catch (e) {
      console.error('Error when loading the SpeechToTextController!', e);
    }
  }

  private async setAudioBufferFromFile(url: string) {
    this.audioBuffer = await FileSystem.downloadAsync(
      url,
      FileSystem.documentDirectory + 'audio.mp3'
    ).then(({ uri }) => {
      return this.audioContext.decodeAudioDataSource(uri);
    });
  }

  async loadAudioWeb(url: string) {
    this.audioBuffer = await FileSystem.downloadAsync(
      url,
      FileSystem.documentDirectory + 'audio.wav'
    ).then(({ uri }) => this.audioContext.decodeAudioDataSource(uri));
  }

  async loadAudio(url: string) {
    await this.setAudioBufferFromFile(url);
  }

  private chunkWaveform(waveform: number[]) {
    for (let i = 0; i < Math.ceil(waveform.length / this.window_size); i++) {
      this.chunks.push(
        waveform.slice(
          Math.max(this.window_size * i - this.overlap_seconds * SECOND, 0),
          Math.min(
            this.window_size * (i + 1) + this.overlap_seconds * SECOND,
            waveform.length
          )
        )
      );
    }
  }

  transcribe(waveform: number[] | null) {
    if (waveform === null) {
      waveform = this.audioBuffer!.getChannelData(0);
    }

    // this.tokenListener = SpeechToText.onToken((token: string | undefined) => {
    //   if (!token) {
    //     return;
    //   }
    //   // this.onTokenCallback(token);
    //   if (token === 'EOS') {
    //     this.isGenerating = false;
    //   } else {
    //     this.generatedTokens.push(Number(token));
    //   }
    // });

    this.chunkWaveform(waveform);
    this.nativeModule.generate(waveform);
    // this.nativeModule.generateSync(waveform);
    this.isGenerating = true;
  }
}
