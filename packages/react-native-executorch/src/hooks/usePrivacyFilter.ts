import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createPrivacyFilter,
  type PrivacyFilterModel,
} from '../extensions/nlp/tasks/privacyFilter';

/**
 * React hook to load and run a privacy filter (PII detection) model.
 *
 * This hook manages downloading (if they are remote URLs) and loading both the
 * model file and its `tokenizer.json`, tracking download progress and errors,
 * and cleaning up native memory when the component unmounts or the
 * configuration changes.
 * @category Hooks
 * @typeParam Label The model's BIOES label space, narrowing the detected entity
 * types when a concrete `models` registry entry is passed.
 * @param config The privacy filter model configuration (model and tokenizer
 * paths plus the label space options).
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns An object containing the model's loading state, error, download
 * progress, and detection functions.
 */
export function usePrivacyFilter<Label extends string>(
  config: PrivacyFilterModel<Label>,
  options?: ResourceOptions
) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createPrivacyFilter<Label>, resource ?? null);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    detectPii: model?.detectPii,
    detectPiiWorklet: model?.detectPiiWorklet,
  };
}
