import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createKokoroTextToSpeech,
  type KokoroTtsModel,
} from '../extensions/speech/tasks/kokoroTextToSpeech';
import {
  createSupertonicTextToSpeech,
  type SupertonicTtsModel,
} from '../extensions/speech/tasks/supertonicTextToSpeech';

type KokoroTts<K extends PropertyKey> = Awaited<
  // prettier-ignore
  ReturnType<typeof createKokoroTextToSpeech<K>>
>;
type SupertonicTts<K extends PropertyKey> = Awaited<
  // prettier-ignore
  ReturnType<typeof createSupertonicTextToSpeech<K>>
>;

export type TtsHookResult<
  C,
  P extends {
    synthesize: (...args: any[]) => any;
    synthesizeStop: (...args: any[]) => any;
  },
> = {
  /** Whether the pipeline is loaded and ready to synthesize. */
  isReady: boolean;
  /** The download or load error, if any. */
  error: Error | undefined;
  /** Download progress across every asset, in percent. */
  downloadProgress: number;
  /** The config with every remote URL resolved to a local path. */
  resource: C | undefined;
  /** Streams synthesized audio chunks. Undefined until the pipeline is ready. */
  synthesize: P['synthesize'] | undefined;
  /** Cancels an in-flight synthesis. Undefined until the pipeline is ready. */
  synthesizeStop: P['synthesizeStop'] | undefined;
};

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
 * @returns An object containing the model's loading state, error, download
 * progress, and speech synthesis functions.
 * @see {@link createKokoroTextToSpeech}
 */
export function useTextToSpeech<K extends PropertyKey>(
  config: KokoroTtsModel<K>,
  options?: ResourceOptions
): TtsHookResult<KokoroTtsModel<K>, KokoroTts<K>>;

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
 * @param config The Supertonic TTS model configuration. See {@link
 * SupertonicTtsModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns An object containing the model's loading state, error, download
 * progress, and speech synthesis functions.
 * @see {@link createSupertonicTextToSpeech}
 */
export function useTextToSpeech<K extends PropertyKey>(
  config: SupertonicTtsModel<K>,
  options?: ResourceOptions
): TtsHookResult<SupertonicTtsModel<K>, SupertonicTts<K>>;

export function useTextToSpeech<K extends PropertyKey>(
  config: KokoroTtsModel<K> | SupertonicTtsModel<K>,
  options?: ResourceOptions
) {
  // Each config names the pipeline it belongs to, so the factory is resolved
  // from that tag alone.
  const create = (
    config.name === 'kokoro' ? createKokoroTextToSpeech : createSupertonicTextToSpeech
  ) as (
    ttsConfig: KokoroTtsModel<K> | SupertonicTtsModel<K>
  ) => Promise<KokoroTts<K> | SupertonicTts<K>>;

  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(create, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    synthesize: model?.synthesize,
    synthesizeStop: model?.synthesizeStop,
  };
}
