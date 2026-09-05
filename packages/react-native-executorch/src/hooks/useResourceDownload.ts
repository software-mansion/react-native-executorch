import { useState, useEffect, useMemo } from 'react';
import { download } from '../fetcher/fetcher';
import { isRnExecuTorchError } from '../core/error';

import type { ResourceOptions } from '../utils';

export type { ResourceOptions };

/**
 * React hook to manage downloading and local caching of the remote resources
 * (e.g. `.pte` models) referenced by a value.
 *
 * `config` may be a single URL or any nested object/array holding them —
 * typically a whole model config. Every remote URL found inside is downloaded
 * into the persistent resource cache (cache hits resolve immediately) and
 * replaced by its local path, so `resource` mirrors `config` exactly and can be
 * passed straight to a `create<Task>` factory. Progress is reported across all
 * files, weighted by size, and interrupted downloads resume on the next attempt
 * instead of restarting.
 *
 * Work is keyed on the *value* of `config` rather than its identity, so passing
 * an inline object is safe. Any change to the config resolves again, which is
 * cheap for the files themselves (already-cached URLs are a no-op) but does
 * rebuild whatever pipeline consumes `resource` — correct, since `create<Task>`
 * factories bake their options in at construction time.
 *
 * For imperative usage, see {@link download}.
 * @category Hooks
 * @typeParam T The shape of the value being resolved.
 * @param config The value whose remote URLs should be resolved to local paths,
 * or `undefined` to prevent loading.
 * @param options Load and caching options. See {@link ResourceOptions}.
 * @returns An object containing the resolved value, the download progress
 * percentage, and any download error.
 * @see {@link download}
 */
export function useResourceDownload<T>(config: T | undefined, options?: ResourceOptions) {
  const { preventLoad, forceDownload } = options ?? {};

  const [resource, setResource] = useState<T>();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState<Error | undefined>();

  // Configs are plain JSON data, so serializing is a sound structural identity
  // and keeps an inline `config` object from re-running the effect every render.
  const configKey = useMemo(() => JSON.stringify(config), [config]);

  useEffect(() => {
    setResource(undefined);
    setDownloadProgress(0);
    setDownloadError(undefined);

    if (config === undefined || preventLoad) return;

    let isMounted = true;
    const controller = new AbortController();

    download(config, {
      signal: controller.signal,
      forceDownload,
      onProgress: (progress) => {
        if (isMounted) setDownloadProgress(progress * 100);
      },
    })
      .then((resolved) => {
        if (!isMounted) return;
        setResource(resolved);
        setDownloadProgress(100);
      })
      .catch((e) => {
        if (!isMounted || isRnExecuTorchError(e, 'DOWNLOAD_ABORTED')) return;
        setDownloadError(e instanceof Error ? e : new Error(String(e)));
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
    // `config` is intentionally tracked by value through `configKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, preventLoad, forceDownload]);

  return { resource, downloadProgress, downloadError };
}
