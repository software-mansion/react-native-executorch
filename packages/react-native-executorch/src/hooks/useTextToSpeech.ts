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

type KokoroTts<K extends PropertyKey> = Awaited<ReturnType<typeof createKokoroTextToSpeech<K>>>;
type SupertonicTts<K extends PropertyKey> = Awaited<
  ReturnType<typeof createSupertonicTextToSpeech<K>>
>;

type TtsHookResult<C, P extends { synthesize: unknown; synthesizeStop: unknown }> = {
  /** Whether the pipeline is loaded and ready to synthesize. */
  isReady: boolean;
  /** The download or load error, if any. */
  error: Error | null;
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
 * React hook to load and manage the Kokoro Text-to-Speech pipeline.
 *
 * It manages downloading (if the sources are remote URLs) and loading the 2 sub-model
 * `.pte` files, the phonemizer assets and all voice `.bin` files, tracking download
 * progress and errors, and cleaning up native memory when unmounting.
 * @category Hooks
 * @typeParam K Voice keys record constraint.
 * @param config The Kokoro TTS model configuration.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns An object containing the model's loading state, error, download progress,
 * and synthesis functions.
 */
export function useTextToSpeech<K extends PropertyKey>(
  config: KokoroTtsModel<K>,
  options?: ResourceOptions
): TtsHookResult<KokoroTtsModel<K>, KokoroTts<K>>;

/**
 * React hook to load and manage the Supertonic 3 Text-to-Speech pipeline.
 *
 * It manages downloading (if the sources are remote URLs) and loading the 4 sub-model
 * `.pte` files, `unicode_indexer.json`, and all voice style `.json` files, tracking download
 * progress and errors, and cleaning up native memory when unmounting.
 * @category Hooks
 * @typeParam K Voice style keys record constraint.
 * @param config The Supertonic TTS model configuration.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns An object containing the model's loading state, error, download progress,
 * and synthesis functions.
 */
export function useTextToSpeech<K extends PropertyKey>(
  config: SupertonicTtsModel<K>,
  options?: ResourceOptions
): TtsHookResult<SupertonicTtsModel<K>, SupertonicTts<K>>;

export function useTextToSpeech<K extends PropertyKey>(
  config: KokoroTtsModel<K> | SupertonicTtsModel<K>,
  options?: ResourceOptions
) {
  // The two configs are structurally disjoint, so the pipeline is picked from
  // the config's own shape — `voices` is Kokoro-only, `voiceStyles` Supertonic-only.
  // The overloads above give callers back the precise type.
  const create = ('voices' in config ? createKokoroTextToSpeech : createSupertonicTextToSpeech) as (
    ttsConfig: KokoroTtsModel<K> | SupertonicTtsModel<K>
  ) => Promise<KokoroTts<K> | SupertonicTts<K>>;

  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(create, resource ?? null);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    synthesize: model?.synthesize,
    synthesizeStop: model?.synthesizeStop,
  };
}
