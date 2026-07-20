import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
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
 * @param config The privacy filter model configuration (model and tokenizer
 * paths plus the label space options).
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the
 * model.
 * @returns An object containing the model's loading state, error, download
 * progress, and detection functions.
 */
export function usePrivacyFilter(config: PrivacyFilterModel, options?: { preventLoad?: boolean }) {
  const modelResource = useResourceDownload(config.modelPath, options?.preventLoad);
  const tokenizerResource = useResourceDownload(config.tokenizerPath, options?.preventLoad);

  const localModelPath = modelResource.localPath;
  const localTokenizerPath = tokenizerResource.localPath;

  const { model, error } = useModel(
    createPrivacyFilter,
    localModelPath && localTokenizerPath
      ? { ...config, modelPath: localModelPath, tokenizerPath: localTokenizerPath }
      : null,
    [localModelPath, localTokenizerPath]
  );

  return {
    isReady: !!model,
    error: modelResource.downloadError || tokenizerResource.downloadError || error,
    downloadProgress: modelResource.downloadProgress,
    localPath: localModelPath,
    tokenizerPath: localTokenizerPath,
    detect: model?.detect,
    detectWorklet: model?.detectWorklet,
  };
}
