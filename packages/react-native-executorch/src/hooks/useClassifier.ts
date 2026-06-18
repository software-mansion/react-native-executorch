import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import { createClassifier, type ClassifierModel } from '../extensions/cv/tasks/classification';

export function useClassifier<L>(config: ClassifierModel<L>, options?: { preventLoad?: boolean }) {
  const { localPath, downloadProgress, downloadError } = useResourceDownload(
    config.modelPath,
    options?.preventLoad
  );
  const { model, error } = useModel(
    createClassifier<L>,
    localPath ? { ...config, modelPath: localPath } : null,
    [localPath]
  );

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    localPath,
    labels: config.classifierOpts.labels,
    classify: model?.classify,
    classifyWorklet: model?.classifyWorklet,
  };
}
