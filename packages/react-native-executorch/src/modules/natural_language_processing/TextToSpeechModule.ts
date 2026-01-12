import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { ETError, getError } from '../../Error';
import { BaseModule } from '../BaseModule';
import {
  KokoroConfig,
  TextToSpeechConfig,
  TextToSpeechStreamingInput,
  VoiceConfig,
} from '../../types/tts';

export class TextToSpeechModule extends BaseModule {
  public async load(
    config: TextToSpeechConfig,
    onDownloadProgressCallback: (progress: number) => void = () => {}
  ): Promise<void> {
    const anySourceKey = Object.keys(config.model).find((key) =>
      key.includes('Source')
    );
    if (anySourceKey === undefined) {
      throw new Error('No model source provided.');
    }

    // Select the text to speech model based on it's fixed identifier
    if (config.model.type == 'kokoro') {
      await this.loadKokoro(
        config.model,
        config.voice!,
        onDownloadProgressCallback,
        config.options
      );
    }
    // ... more models? ...
  }

  // Specialized loader - Kokoro model
  private async loadKokoro(
    model: KokoroConfig,
    voice: VoiceConfig,
    onDownloadProgressCallback: (progress: number) => void,
    options?: any
  ): Promise<void> {
    if (!voice.extra || !voice.extra.tagger || !voice.extra.lexicon) {
      throw new Error(
        'Kokoro: voice config is missing required extra fields: tagger and/or lexicon.'
      );
    }

    console.log('[rnExecutorch] Pobierane zasoby:', {
      durationPredictorSource: model.durationPredictorSource,
      f0nPredictorSource: model.f0nPredictorSource,
      textEncoderSource: model.textEncoderSource,
      textDecoderSource: model.textDecoderSource,
      voiceSource: voice.voiceSource,
      tagger: voice.extra!.tagger,
      lexicon: voice.extra!.lexicon,
    });
    const paths = await ResourceFetcher.fetch(
      onDownloadProgressCallback,
      model.durationPredictorSource,
      model.f0nPredictorSource,
      model.textEncoderSource,
      model.textDecoderSource,
      voice.voiceSource,
      voice.extra!.tagger,
      voice.extra!.lexicon
    );

    if (paths === null || paths.length !== 7 || paths.some((p) => p == null)) {
      throw new Error('Download interrupted or missing resource.');
    }

    const modelPaths = paths.slice(0, 4) as [string, string, string, string];
    const voiceDataPath = paths[4] as string;
    const phonemizerPaths = paths.slice(5, 7) as [string, string];

    console.log('[rnExecutorch] model paths: ', modelPaths);
    console.log('[rnExecutorch] phonemizer paths: ', phonemizerPaths);
    console.log('[rnExecutorch] voice paths: ', voiceDataPath);

    this.nativeModule = global.loadTextToSpeechKokoro(
      voice.lang,
      phonemizerPaths[0],
      phonemizerPaths[1],
      modelPaths[0],
      modelPaths[1],
      modelPaths[2],
      modelPaths[3],
      voiceDataPath
    );

    // Handle extra options
    if (options && 'fixedModel' in options) {
      const allowedModels = ['small', 'medium', 'large'];
      const fixedModelValue = options.fixedModel;
      if (!allowedModels.includes(fixedModelValue)) {
        throw new Error(
          `Invalid fixedModel value: ${fixedModelValue}. Allowed values are: ${allowedModels.join(', ')}.`
        );
      }
      this.nativeModule.setFixedModel(fixedModelValue);
    }
  }

  public async forward(text: string, speed: number = 1.0) {
    if (this.nativeModule == null)
      throw new Error(getError(ETError.ModuleNotLoaded));
    return await this.nativeModule.generate(text, speed);
  }

  public async stream({
    text,
    onBegin,
    onNext,
    onEnd,
    speed,
  }: TextToSpeechStreamingInput) {
    let queue = Promise.resolve();

    onBegin?.();

    try {
      await this.nativeModule.stream(text, speed, (audio: number[]) => {
        queue = queue.then(() =>
          Promise.resolve(onNext?.(new Float32Array(audio)))
        );
      });

      await queue;
    } catch (e) {
      throw e;
    } finally {
      onEnd?.();
    }
  }
}
