import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import {
  createFsmnVoiceActivityDetector,
  type FsmnVadModel,
} from '../extensions/speech/tasks/fsmnVoiceActivityDetection';

/**
 * React hook to load and run a Voice Activity Detection model.
 *
 * This hook manages downloading (if it's a remote URL) and loading the model
 * file, compiling it, tracking download progress and compilation errors, and
 * cleaning up native model memory when the component unmounts or configuration
 * changes.
 * @category Hooks
 * @param config The VAD model configuration.
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the
 * model.
 * @returns An object containing the model's loading state, error, download
 * progress, one-shot detection functions, and live detection controls.
 */
export function useVoiceActivityDetector(
  config: FsmnVadModel,
  options?: { preventLoad?: boolean }
) {
  const { resource, downloadProgress, downloadError } = useResourceDownload(
    config,
    options?.preventLoad
  );
  const { model, error } = useModel(createFsmnVoiceActivityDetector, resource ?? null, [resource]);

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
