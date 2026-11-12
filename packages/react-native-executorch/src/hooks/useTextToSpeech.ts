import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createKokoroTextToSpeech,
  type KokoroTtsModel,
  type KokoroTextToSpeech,
} from '../extensions/speech/tasks/kokoroTextToSpeech';
import {
  createSupertonicTextToSpeech,
  type SupertonicTtsModel,
  type SupertonicTextToSpeech,
} from '../extensions/speech/tasks/supertonicTextToSpeech';
import {
  createReverbTextToSpeech,
  type ReverbTtsModel,
  type ReverbTextToSpeech,
} from '../extensions/speech/tasks/reverbTextToSpeech';

/**
 * React hook to load and run the Kokoro Text-to-Speech pipeline.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets, phonemizer files, and voice style vectors, tracking download
 * progress and load errors, and releasing native memory when the component
 * unmounts or the configuration changes.
 *
 * For imperative usage, see {@link createKokoroTextToSpeech}.
 * @category Hooks
 * @typeParam K Voice keys record constraint.
 * @param config The Kokoro TTS model configuration. See {@link KokoroTtsModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link KokoroTextToSpeech} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link KokoroTextToSpeech}
 */
export function useTextToSpeech<K extends PropertyKey>(
  config: KokoroTtsModel<K>,
  options?: ResourceOptions
): {
  /** Whether the pipeline is loaded and ready to synthesize. */
  isReady: boolean;
  /** The download or load error, if any. */
  error: Error | undefined;
  /** Download progress across every asset, in percent. */
  downloadProgress: number;
  /** The config with every remote URL resolved to a local path. */
  resource: KokoroTtsModel<K> | undefined;
  /** Streams synthesized audio chunks. Undefined until the pipeline is ready. */
  synthesize: KokoroTextToSpeech<K>['synthesize'] | undefined;
  /** Cancels an in-flight synthesis. Undefined until the pipeline is ready. */
  synthesizeStop: KokoroTextToSpeech<K>['synthesizeStop'] | undefined;
};

/**
 * React hook to load and run the Supertonic 3 Text-to-Speech pipeline.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets, indexer files, and voice style vectors, tracking download
 * progress and load errors, and releasing native memory when the component
 * unmounts or the configuration changes.
 *
 * For imperative usage, see {@link createSupertonicTextToSpeech}.
 * @category Hooks
 * @typeParam K Voice style keys record constraint.
 * @param config The Supertonic TTS model configuration.
 * See {@link SupertonicTtsModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link SupertonicTextToSpeech} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link SupertonicTextToSpeech}
 */
export function useTextToSpeech<K extends PropertyKey>(
  config: SupertonicTtsModel<K>,
  options?: ResourceOptions
): {
  /** Whether the pipeline is loaded and ready to synthesize. */
  isReady: boolean;
  /** The download or load error, if any. */
  error: Error | undefined;
  /** Download progress across every asset, in percent. */
  downloadProgress: number;
  /** The config with every remote URL resolved to a local path. */
  resource: SupertonicTtsModel<K> | undefined;
  /** Streams synthesized audio chunks. Undefined until the pipeline is ready. */
  synthesize: SupertonicTextToSpeech<K>['synthesize'] | undefined;
  /** Cancels an in-flight synthesis. Undefined until the pipeline is ready. */
  synthesizeStop: SupertonicTextToSpeech<K>['synthesizeStop'] | undefined;
};

/**
 * React hook to download, load, and run the Reverb Text-to-Speech pipeline,
 * releasing native memory on unmount or config change.
 *
 * For imperative usage, see {@link createReverbTextToSpeech}.
 * @category Hooks
 * @typeParam K Preset voice keys.
 * @param config The Reverb TTS model configuration. See {@link ReverbTtsModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link ReverbTextToSpeech} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link ReverbTextToSpeech}
 */
export function useTextToSpeech<K extends PropertyKey = never>(
  config: ReverbTtsModel<K>,
  options?: ResourceOptions
): {
  /** Whether the pipeline is loaded and ready to synthesize. */
  isReady: boolean;
  /** The download or load error, if any. */
  error: Error | undefined;
  /** Download progress across every asset, in percent. */
  downloadProgress: number;
  /** The config with every remote URL resolved to a local path. */
  resource: ReverbTtsModel<K> | undefined;
  /** Streams synthesized audio chunks. Undefined until the pipeline is ready. */
  synthesize: ReverbTextToSpeech<K>['synthesize'] | undefined;
  /** Cancels an in-flight synthesis. Undefined until the pipeline is ready. */
  synthesizeStop: ReverbTextToSpeech<K>['synthesizeStop'] | undefined;
  /** Encodes a recording into a voice. Undefined until the pipeline is ready. */
  encodeVoice: ReverbTextToSpeech<K>['encodeVoice'] | undefined;
};

export function useTextToSpeech<K extends PropertyKey>(
  config: KokoroTtsModel<K> | SupertonicTtsModel<K> | ReverbTtsModel<K>,
  options?: ResourceOptions
) {
  // Each config names the pipeline it belongs to, so the factory is resolved
  // from that tag alone.
  const factory = (
    ttsConfig: KokoroTtsModel<K> | SupertonicTtsModel<K> | ReverbTtsModel<K>
  ): Promise<KokoroTextToSpeech<K> | SupertonicTextToSpeech<K> | ReverbTextToSpeech<K>> => {
    switch (ttsConfig.name) {
      case 'kokoro':
        return createKokoroTextToSpeech(ttsConfig);
      case 'supertonic':
        return createSupertonicTextToSpeech(ttsConfig);
      case 'reverb':
        return createReverbTextToSpeech(ttsConfig);
    }
  };

  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(factory, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    synthesize: model?.synthesize,
    synthesizeStop: model?.synthesizeStop,
    // Only Reverb encodes voices.
    ...(model && 'encodeVoice' in model ? { encodeVoice: model.encodeVoice } : {}),
  };
}
