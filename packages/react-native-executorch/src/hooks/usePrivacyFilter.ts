import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createPrivacyFilter,
  type PrivacyFilterModel,
} from '../extensions/nlp/tasks/privacyFilter';

/**
 * React hook to load and run a privacy filter (PII detection) model.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets and tokenizer files, tracking download progress and load errors,
 * and releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createPrivacyFilter}.
 * @category Hooks
 * @typeParam Label The model's BIOES label space, narrowing the detected entity
 * types when a concrete `models` registry entry is passed.
 * @param config The privacy filter model configuration.
 * See {@link PrivacyFilterModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link PrivacyFilter} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link PrivacyFilter}
 */
export function usePrivacyFilter<Label extends string>(
  config: PrivacyFilterModel<Label>,
  options?: ResourceOptions
) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createPrivacyFilter<Label>, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    detectPii: model?.detectPii,
    detectPiiWorklet: model?.detectPiiWorklet,
  };
}
