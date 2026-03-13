import { useState, useEffect } from 'react';
import { RnExecutorchErrorCode } from '../errors/ErrorCodes';
import { RnExecutorchError, parseUnknownError } from '../errors/errorUtils';

type Deletable = { delete: () => void };

/**
 * Shared hook for modules that are instantiated via an async static factory
 * (i.e. `SomeModule.fromModelName(config, onProgress)`).
 *
 * Handles model loading, download progress, error state, and enforces the
 * not-loaded / already-generating guards so individual hooks only need to
 * define their typed `forward` wrapper.
 *
 * @internal
 */
export function useModuleFactory<M extends Deletable, Config>({
  factory,
  config,
  deps,
  preventLoad = false,
}: {
  factory: (
    config: Config,
    onProgress: (progress: number) => void
  ) => Promise<M>;
  config: Config;
  deps: ReadonlyArray<unknown>;
  preventLoad?: boolean;
}) {
  const [error, setError] = useState<RnExecutorchError | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [instance, setInstance] = useState<M | null>(null);

  useEffect(() => {
    if (preventLoad) return;

    let active = true;
    setDownloadProgress(0);
    setError(null);
    setIsReady(false);

    factory(config, (p) => {
      if (active) setDownloadProgress(p);
    })
      .then((mod) => {
        if (!active) {
          mod.delete();
          return;
        }
        setInstance((prev) => {
          prev?.delete();
          return mod;
        });
        setIsReady(true);
      })
      .catch((err) => {
        if (active) setError(parseUnknownError(err));
      });

    return () => {
      active = false;
      setInstance((prev) => {
        prev?.delete();
        return null;
      });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, preventLoad]);

  const runForward = async <R>(fn: (instance: M) => Promise<R>): Promise<R> => {
    if (!isReady || !instance) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModuleNotLoaded,
        'The model is currently not loaded. Please load the model before calling forward().'
      );
    }
    if (isGenerating) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.ModelGenerating,
        'The model is currently generating. Please wait until previous model run is complete.'
      );
    }
    try {
      setIsGenerating(true);
      return await fn(instance);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    error,
    isReady,
    isGenerating,
    downloadProgress,
    runForward,
    instance,
  };
}
