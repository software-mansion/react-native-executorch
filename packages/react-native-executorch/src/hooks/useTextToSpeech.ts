import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createSupertonicTextToSpeech,
  type SupertonicTtsModel,
} from '../extensions/speech/tasks/supertonicTextToSpeech';

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
) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createSupertonicTextToSpeech, resource ?? null);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    synthesize: model?.synthesize,
    synthesizeStop: model?.synthesizeStop,
  };
}
