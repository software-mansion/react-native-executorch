import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createKokoroTextToSpeech,
  type KokoroTtsModel,
} from '../extensions/speech/tasks/kokoroTextToSpeech';

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
export function useKokoroTextToSpeech<K extends PropertyKey>(
  config: KokoroTtsModel<K>,
  options?: ResourceOptions
) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createKokoroTextToSpeech, resource ?? null);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    synthesize: model?.synthesize,
    synthesizeStop: model?.synthesizeStop,
  };
}
