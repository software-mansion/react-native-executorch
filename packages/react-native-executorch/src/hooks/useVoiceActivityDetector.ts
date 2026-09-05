import { useModel } from './useModel';
import { useResourceDownload, type ResourceOptions } from './useResourceDownload';
import {
  createFsmnVoiceActivityDetector,
  type FsmnVadModel,
} from '../extensions/speech/tasks/fsmnVoiceActivityDetection';

/**
 * React hook to load and run a Voice Activity Detection (VAD) model.
 *
 * This hook manages downloading (if remote URLs are provided) and loading the
 * model assets, compiling them, tracking download progress and load errors, and
 * releasing native memory when the component unmounts or the configuration
 * changes.
 *
 * For imperative usage, see {@link createFsmnVoiceActivityDetector}.
 * @category Hooks
 * @param config The VAD model configuration. See {@link FsmnVadModel}.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns The same object as {@link FsmnVoiceActivityDetector} (without `dispose`),
 * combined with loading state and download progress.
 * @see {@link FsmnVoiceActivityDetector}
 */
export function useVoiceActivityDetector(config: FsmnVadModel, options?: ResourceOptions) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(config, options);
  const { model, error } = useModel(createFsmnVoiceActivityDetector, resource);

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    resource,
    detectVoice: model?.detectVoice,
    detectVoiceWorklet: model?.detectVoiceWorklet,
    detectVoiceOnStream: model?.detectVoiceOnStream,
    resetStream: model?.resetStream,
  };
}
