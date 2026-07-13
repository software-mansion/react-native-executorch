import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import { createFsmnVad, type VADModel } from '../extensions/speech/tasks/fsmnVad';

/**
 * React hook to load and run the FSMN Voice Activity Detection model.
 *
 * This hook manages downloading (if it's a remote URL) and loading the model
 * file, compiling it, tracking download progress and compilation errors, and
 * cleaning up native model memory when the component unmounts or configuration
 * changes. Streaming state lives inside the task (see {@link createFsmnVad}), so
 * the hook exposes its `stream` / `streamInsert` / `streamStop` methods directly.
 * @category Hooks
 * @param config The VAD model configuration.
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the
 * model.
 * @returns An object containing the model's loading state, error, download
 * progress, one-shot detection functions, and streaming controls.
 */
export function useFsmnVad(config: VADModel, options?: { preventLoad?: boolean }) {
  const { localPath, downloadProgress, downloadError } = useResourceDownload(
    config.modelPath,
    options?.preventLoad
  );
  const { model, error } = useModel(
    createFsmnVad,
    localPath ? { ...config, modelPath: localPath } : null,
    [localPath]
  );

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    localPath,
    detect: model?.detect,
    detectWorklet: model?.detectWorklet,
    stream: model?.stream,
    streamInsert: model?.streamInsert,
    streamStop: model?.streamStop,
  };
}
