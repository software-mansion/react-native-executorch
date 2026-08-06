import { useState, useEffect, useMemo, useRef } from 'react';
import {
  download,
  collectRemoteSources,
  substituteRemoteSources,
  AbortError,
} from '../fetcher/fetcher';

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
 * `resource` only changes when the set of remote URLs changes; edits to other
 * fields of `config` (labels, thresholds) don't trigger a re-download and are
 * picked up the next time those URLs are re-resolved.
 * @category Hooks
 * @typeParam T The shape of the value being resolved.
 * @param config The value whose remote URLs should be resolved to local paths.
 * @param preventLoad If true, prevents checks and downloads, resetting the hook
 * state.
 * @returns An object containing the resolved value, the download progress
 * percentage, and any download error.
 */
export function useResourceDownload<T>(config: T, preventLoad?: boolean) {
  const [resolved, setResolved] = useState<ReadonlyMap<string, string>>();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState<Error | null>(null);

  // Downloading is keyed purely on the URLs referenced by `config`, so passing
  // an inline config object doesn't restart the download on every render.
  const sourcesKey = useMemo(() => [...collectRemoteSources(config)].sort().join('\n'), [config]);

  // Read at substitution time only, so unrelated config edits don't re-download.
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    setResolved(undefined);
    setDownloadProgress(0);
    setDownloadError(null);

    if (preventLoad) return;

    const urls = sourcesKey ? sourcesKey.split('\n') : [];

    let isMounted = true;
    const controller = new AbortController();

    download(urls, {
      signal: controller.signal,
      onProgress: (progress) => {
        if (isMounted) setDownloadProgress(progress * 100);
      },
    })
      .then((paths) => {
        if (!isMounted) return;
        setResolved(new Map(urls.map((url, i) => [url, paths[i]!])));
        setDownloadProgress(100);
      })
      .catch((e) => {
        if (!isMounted || e instanceof AbortError) return;
        setDownloadError(e instanceof Error ? e : new Error(String(e)));
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [sourcesKey, preventLoad]);

  const resource = useMemo(
    () => (resolved ? substituteRemoteSources(configRef.current, resolved) : undefined),
    [resolved]
  );

  return { resource, downloadProgress, downloadError };
}
