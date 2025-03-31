import { useEffect, useState } from 'react';
import { TextEmbeddings } from '../../native/RnExecutorchModules';
import { fetchResource } from '../../utils/fetchResource';
import { ETError, getError } from '../../Error';
import { ResourceSource } from '../../types/common';

export const useTextEmbeddings = ({
  modelSource,
  tokenizerSource,
}: {
  modelSource: ResourceSource;
  tokenizerSource: ResourceSource;
}) => {
  const [error, setError] = useState<null | string>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const loadModel = async () => {
      if (!modelSource || !tokenizerSource) return;

      try {
        setIsReady(false);
        const tokenizerFileUri = await fetchResource(tokenizerSource);
        const modelFileUri = await fetchResource(
          modelSource,
          setDownloadProgress
        );

        await TextEmbeddings.loadModule(modelFileUri, tokenizerFileUri);
        setIsReady(true);
      } catch (e) {
        setError(getError(e));
      }
    };

    loadModel();
  }, [modelSource, tokenizerSource]);

  const forward = async (input: string): Promise<number[]> => {
    if (!isReady) {
      throw new Error(getError(ETError.ModuleNotLoaded));
    }
    if (isGenerating) {
      throw new Error(getError(ETError.ModelGenerating));
    }

    try {
      setIsGenerating(true);
      return await TextEmbeddings.forward(input);
    } catch (e) {
      throw new Error(getError(e));
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    forward,
  };
};
