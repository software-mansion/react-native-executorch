import { useState, useEffect } from 'react';
import { download } from '../fetcher';

/**
 * React hook to manage downloading and local caching of remote resources (e.g.
 * `.pte` models).
 *
 * If the source is a remote URL starting with `http`, the hook checks the local
 * filesystem cache for a matching file. If cached, it immediately returns the
 * local file path. If not cached, it downloads the file into the persistent
 * resource cache, reporting download progress (0-100) and any network/disk
 * errors. Interrupted downloads resume on the next attempt instead of
 * restarting.
 * @category Hooks
 * @param source The remote URL or local path to the resource. If it's already a
 * local path, it is returned immediately as is.
 * @param preventLoad If true, prevents checks and downloads, resetting the hook
 * state.
 * @returns An object containing the local file path, the download progress
 * percentage, and any download error.
 */
export function useResourceDownload(source?: string, preventLoad?: boolean) {
  const [localPath, setLocalPath] = useState<string>();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState<Error | null>(null);

  useEffect(() => {
    setLocalPath(undefined);
    setDownloadProgress(0);
    setDownloadError(null);

    if (preventLoad) return;

    if (!source) {
      setDownloadProgress(100);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    download(source, {
      signal: controller.signal,
      onProgress: (progress) => {
        if (isMounted) setDownloadProgress(progress * 100);
      },
    })
      .then((path) => {
        if (isMounted) {
          setLocalPath(path);
          setDownloadProgress(100);
        }
      })
      .catch((e) => {
        if (!isMounted || e?.name === 'AbortError') return;
        setDownloadError(e instanceof Error ? e : new Error(String(e)));
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [source, preventLoad]);

  return { localPath, downloadProgress, downloadError };
}
