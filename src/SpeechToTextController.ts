import {
  AudioBufferSourceNode,
  AudioContext,
  AudioBuffer,
} from 'react-native-audio-api';
import { _SpeechToTextModule } from './native/RnExecutorchModules';
import { EventSubscription, Image } from 'react-native';
import { SpeechToText } from './native/RnExecutorchModules';
import * as FileSystem from 'expo-file-system';

type ModelSource = string | number;

export class SpeechToTextController {
  // Audio config
  private audioContext: AudioContext;
  private audioBuffer: AudioBuffer | null = null;
  private audioBufferSource: AudioBufferSourceNode | null = null;

  // Native modules / listeners
  private nativeModule: _SpeechToTextModule;
  // @ts-ignore
  private tokenListener: EventSubscription | null = null;

  // State
  public generatedTokens: string[] = [];
  // @ts-ignore
  public isReady: boolean;
  public isGenerating: boolean;

  // User-defined variables
  public onTokenCallback: (token: number) => any;

  constructor({
    nativeModule = new _SpeechToTextModule(),
    // @ts-ignore
    onTokenCallback = (token: number) => { },
  } = {}) {
    this.nativeModule = nativeModule;
    this.isReady = false;
    this.isGenerating = false;
    this.audioContext = new AudioContext(16e3); // Passing default SR
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
      this.tokenListener = SpeechToText.onToken((token: number | undefined) => {
        if (!token) {
          return;
        }
        this.onTokenCallback(token);
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
  }

  private async loadAudio(url: string) {
    await this.setAudioBufferFromFile(url);
    this.setAudioBufferSourceNode();
  }

  public async startTranscription(url: string) {
    if (this.isGenerating) {
      // TODO
      return;
    }
    try {
      await this.loadAudio(url);
    } catch (e) {
      // TODO
      throw Error('An error ocurred when loading audio! ' + e);
    }

    if (
      !this.audioBufferSource ||
      !this.audioBufferSource ||
      !this.audioBuffer
    ) {
      // TODO
      throw Error('An error ocurred when loading audio!');
    }

    const waveform = this.audioBuffer.getChannelData(0);
    this.isGenerating = true;
    await this.nativeModule.generate(waveform);
    this.isGenerating = false;
    this.audioBufferSource.start();
  }
}
