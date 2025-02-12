import {
  AudioBufferSourceNode,
  AnalyserNode,
  AudioContext,
  AudioBuffer,
} from 'react-native-audio-api';
import { _SpeechToTextModule } from './native/RnExecutorchModules';
import { EventSubscription, Image } from 'react-native';
import { SpeechToText } from './native/RnExecutorchModules';
import * as FileSystem from 'expo-file-system';
import { ETError, getError } from './Error';

type ModelSource = string | number;

export class SpeechToTextController {
  // Audio config
  private numFft: number;
  private hopLength: number;
  private audioContext: AudioContext;
  private analyserNode: AnalyserNode;
  private audioBuffer: AudioBuffer | null = null;
  private audioBufferSource: AudioBufferSourceNode | null = null;
  private stftInterval: number;

  // Native modules / listeners
  private nativeModule: _SpeechToTextModule;
  // @ts-ignore
  private tokenListener: EventSubscription | null = null;

  // State
  private fftBuffer: number[][] = [];
  public generatedTokens: string[] = [];
  // @ts-ignore
  public isReady: boolean;
  public isGenerating: boolean;

  // User-defined variables
  public onTokenCallback: (token: string) => any;

  constructor({
    numFft = 512,
    hopLength = 160,
    nativeModule = new _SpeechToTextModule(),
    onTokenCallback = (token: string) => console.log(token),
  } = {}) {
    this.numFft = numFft;
    this.hopLength = hopLength;
    this.stftInterval = (this.hopLength / 16e3) * 1000;
    this.nativeModule = nativeModule;
    this.isReady = false;
    this.isGenerating = false;
    this.audioContext = new AudioContext(16e3); // Passing default SR
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = this.numFft;
    this.analyserNode.smoothingTimeConstant = 0;
    this.analyserNode.window = 'hann';
    this.analyserNode.connect(this.audioContext.destination);
    this.onTokenCallback = onTokenCallback;
  }

  public async loadModel(
    preprocessorSource: ModelSource,
    encoderSource: ModelSource,
    decoderSource: ModelSource
  ) {
    let preprocessorPath = preprocessorSource;
    let encoderPath = encoderSource;
    let decoderPath = decoderSource;
    if (
      typeof encoderSource === 'number' &&
      typeof decoderSource === 'number' &&
      typeof preprocessorSource === 'number'
    ) {
      encoderPath = Image.resolveAssetSource(encoderSource).uri;
      decoderPath = Image.resolveAssetSource(decoderSource).uri;
      preprocessorPath = Image.resolveAssetSource(preprocessorSource).uri;
    }
    try {
      this.isReady = false;
      await this.nativeModule.loadModule(
        preprocessorPath,
        encoderPath,
        decoderPath
      );
      this.tokenListener = SpeechToText.onToken((token: string | undefined) => {
        if (!token) {
          return;
        }
        this.onTokenCallback(token);
        if (token === '50256') {
          console.log('EOS');
          this.isGenerating = false;
        } else {
          this.generatedTokens.push(token);
        }
      });
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

  private setAudioBufferSourceNode() {
    if (!this.audioBuffer) {
      throw new Error(
        'setAudioBufferSourceNode() called before AudioBuffer was initialized!'
      );
    }
    this.audioBufferSource = this.audioContext.createBufferSource();
    this.audioBufferSource.buffer = this.audioBuffer;
    this.audioBufferSource.connect(this.analyserNode);
  }

  private async loadAudio(url: string) {
    await this.setAudioBufferFromFile(url);
    this.setAudioBufferSourceNode();
  }

  private generate(fft: number[][]) {
    if (!this.isReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    if (this.isGenerating) {
      return;
    }
    const prevTokens = this.generatedTokens.map(Number);
    const numFrames = fft.length;
    this.nativeModule.generateSync(fft.flat(), numFrames, prevTokens);
  }

  private getFftData() {
    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Array(bufferLength);
    this.analyserNode.getFloatFrequencyData(dataArray);
    return dataArray;
  }

  public async startTranscription(url: string) {
    try {
      await this.loadAudio(url);
    } catch (e) {
      throw Error('An error ocurred when loading audio! ' + e);
    }

    if (
      !this.audioBufferSource ||
      !this.audioBufferSource ||
      !this.audioBuffer
    ) {
      throw Error('An error ocurred when loading audio!');
    }

    // Simulating hop length :)
    // we are probing the FFT data from the Audio API each this.stftInterval ms
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const audioDuration = this.audioBuffer.duration;
    let startTime = this.audioContext.currentTime;
    let elapsedTime = 0;
    this.audioBufferSource.start();

    while (true) {
      // TODO
      elapsedTime = this.audioContext.currentTime - startTime;
      if (elapsedTime > audioDuration) {
        this.generate(this.fftBuffer);
        break;
      }
      this.fftBuffer.push(this.getFftData());
      await delay(this.stftInterval);
    }
  }
}
