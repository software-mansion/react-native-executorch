import { useEffect, useRef } from 'react';

import { useModel } from './useModel';
import { useResourceDownload } from './useResourceDownload';
import { createVAD, type VADModel } from '../extensions/speech/tasks/vad';
import {
  createVadStreamer,
  type VADStreamOptions,
  type VADStreamer,
} from '../extensions/speech/vadStreamer';

/**
 * Input for {@link useVAD}'s `stream` method: begin/end callbacks plus streaming
 * options.
 * @category Types
 */
export type VADStreamInput = {
  readonly onSpeechBegin?: () => void | Promise<void>;
  readonly onSpeechEnd?: () => void | Promise<void>;
  readonly options?: Pick<VADStreamOptions, 'timeout' | 'detectionMargin'>;
};

/**
 * React hook to load and run a Voice Activity Detection model.
 *
 * This hook manages downloading (if it's a remote URL) and loading the model
 * file, compiling it, tracking download progress and compilation errors, and
 * cleaning up native model memory when the component unmounts or configuration
 * changes. It also owns the lifecycle of the streaming session created by
 * `stream`.
 * @category Hooks
 * @param config The VAD model configuration.
 * @param options Hook options.
 * @param options.preventLoad If true, prevents downloading and compiling the
 * model.
 * @returns An object containing the model's loading state, error, download
 * progress, one-shot detection functions, and streaming controls.
 */
export function useVAD(config: VADModel, options?: { preventLoad?: boolean }) {
  const { localPath, downloadProgress, downloadError } = useResourceDownload(
    config.modelPath,
    options?.preventLoad
  );
  const { model, error } = useModel(
    createVAD,
    localPath ? { ...config, modelPath: localPath } : null,
    [localPath]
  );

  const streamerRef = useRef<VADStreamer | null>(null);

  // Tear down any active streaming session when the model changes or the
  // component unmounts.
  useEffect(
    () => () => {
      streamerRef.current?.stop();
      streamerRef.current = null;
    },
    [model]
  );

  const stream = (input: VADStreamInput): Promise<void> => {
    if (!model?.detect) {
      throw new Error('useVAD: model is not loaded yet');
    }
    streamerRef.current?.stop();
    const streamer = createVadStreamer(model.detect, {
      ...input.options,
      onSpeechBegin: input.onSpeechBegin,
      onSpeechEnd: input.onSpeechEnd,
    });
    streamerRef.current = streamer;
    return streamer.start();
  };

  const streamInsert = (chunk: Float32Array) => streamerRef.current?.insert(chunk);

  const streamStop = () => {
    streamerRef.current?.stop();
    streamerRef.current = null;
  };

  return {
    isReady: !!model,
    error: downloadError || error,
    downloadProgress,
    localPath,
    detect: model?.detect,
    detectWorklet: model?.detectWorklet,
    stream,
    streamInsert,
    streamStop,
  };
}
