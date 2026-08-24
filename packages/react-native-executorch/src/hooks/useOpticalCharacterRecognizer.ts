import { createPaddleOcr, type PaddleOcrModel } from '../extensions/cv/tasks/paddleOcr';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import { useModel } from './useModel';

/**
 * React hook for the PP-OCRv6 pipeline. It downloads and loads the model, tracks
 * progress and errors, instantiates the task runner, and cleans up native memory
 * on unmount or config change. Heavy work runs on a worklet thread;
 * `recognizeCharacters` resolves with the recognized regions in reading order.
 * @category Hooks
 * @param config OCR model configuration. Use a preset from `models.ocr.*`.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns Readiness flags, download progress, and the `recognizeCharacters` /
 * `recognizeCharactersWorklet` runners.
 */
export function useOpticalCharacterRecognizer(config: PaddleOcrModel, options?: ResourceOptions) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createPaddleOcr, resource ?? null);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    recognizeCharacters: model?.recognizeCharacters,
    recognizeCharactersWorklet: model?.recognizeCharactersWorklet,
  };
}
