import { useCallback, useEffect, useRef, useState } from 'react';
import { ResourceSource } from '../../types/common';
import { ResourceFetcher } from '../../utils/ResourceFetcher';
import { RnExecutorchError, parseUnknownError } from '../../errors/errorUtils';
import { RnExecutorchErrorCode } from '../../errors/ErrorCodes';

export interface MultimodalLLMProps {
  model: {
    modelSource: ResourceSource;
    tokenizerSource: ResourceSource;
  };
  preventLoad?: boolean;
}

export interface MultimodalLLMType {
  isReady: boolean;
  isGenerating: boolean;
  downloadProgress: number;
  response: string;
  error: RnExecutorchError | null;
  generate: (imagePath: string, prompt: string) => Promise<string>;
  interrupt: () => void;
}

/**
 * React hook for managing a Multimodal LLM (VLM) instance.
 * Uses `loadMultimodalLLM` native global, which wraps a multi-method PTE
 * with vision_encoder, token_embedding, and text_decoder methods.
 *
 * @category Hooks
 */
export const useMultimodalLLM = ({
  model,
  preventLoad = false,
}: MultimodalLLMProps): MultimodalLLMType => {
  const [nativeModule, setNativeModule] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [response, setResponse] = useState('');
  const [error, setError] = useState<RnExecutorchError | null>(null);

  useEffect(() => {
    setDownloadProgress(0);
    setError(null);
    setIsReady(false);

    if (preventLoad) return;

    let cancelled = false;

    (async () => {
      try {
        const [modelResults, tokenizerResults] = await Promise.all([
          ResourceFetcher.fetch(setDownloadProgress, model.modelSource),
          ResourceFetcher.fetch(undefined, model.tokenizerSource),
        ]);

        if (cancelled) return;

        const modelPath = modelResults?.[0];
        const tokenizerPath = tokenizerResults?.[0];

        if (!modelPath || !tokenizerPath) {
          throw new RnExecutorchError(
            RnExecutorchErrorCode.DownloadInterrupted,
            'Download interrupted — not all files were fetched.'
          );
        }

        const mod = global.loadMultimodalLLM(modelPath, tokenizerPath);
        setNativeModule(mod);
        setIsReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(parseUnknownError(e));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [model.modelSource, model.tokenizerSource, preventLoad]);

  const tokenBufferRef = useRef('');
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  const generate = useCallback(
    async (imagePath: string, prompt: string): Promise<string> => {
      if (!nativeModule) {
        throw new RnExecutorchError(
          RnExecutorchErrorCode.ModuleNotLoaded,
          'Multimodal LLM is not loaded yet.'
        );
      }
      tokenBufferRef.current = '';
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setResponse('');
      setIsGenerating(true);
      try {
        const result: string = await nativeModule.generate(
          imagePath,
          prompt,
          (token: string) => {
            tokenBufferRef.current += token;
            if (rafRef.current === null) {
              rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null;
                const buffered = tokenBufferRef.current;
                tokenBufferRef.current = '';
                setResponse((prev) => prev + buffered);
              });
            }
          }
        );
        // Flush any remaining buffered tokens after generation completes
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        if (tokenBufferRef.current) {
          const remaining = tokenBufferRef.current;
          tokenBufferRef.current = '';
          setResponse((prev) => prev + remaining);
        }
        return result;
      } catch (e) {
        throw parseUnknownError(e);
      } finally {
        setIsGenerating(false);
      }
    },
    [nativeModule]
  );

  const interrupt = useCallback(() => {
    nativeModule?.interrupt();
  }, [nativeModule]);

  return {
    isReady,
    isGenerating,
    downloadProgress,
    response,
    error,
    generate,
    interrupt,
  };
};
