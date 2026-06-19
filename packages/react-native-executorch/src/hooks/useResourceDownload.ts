/* eslint-disable no-bitwise */
import { useState, useEffect } from 'react';
import RNFS from 'react-native-fs';

const djb2 = (s: string): number => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  }
  return h;
};

/**
 * React hook to manage downloading and local caching of remote resources (e.g.
 * `.pte` models).
 *
 * If the source is a remote URL starting with `http`, the hook checks the local
 * filesystem cache for a matching file. If cached, it immediately returns the
 * local file path. If not cached, it starts downloading the file to the
 * application cache directory, reporting download progress (0-100) and any
 * network/disk errors.
 * @category Hooks
 * @experimental Subject to change once the temporary react-native-fs dependency is replaced.
 * See {@link https://github.com/software-mansion/react-native-executorch/issues/1253 | Issue #1253}.
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

    if (!source.startsWith('http')) {
      setLocalPath(source);
      setDownloadProgress(100);
      return;
    }

    let isMounted = true;
    const urlWithoutQuery = source.split('?')[0]!;
    const basename = urlWithoutQuery.split('/').pop() ?? 'model';
    const dest = `${RNFS.CachesDirectoryPath}/${djb2(urlWithoutQuery)}_${basename}`;
    const uid = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const tmp = `${dest}.${uid}.partial`;

    RNFS.exists(dest).then((exists) => {
      if (!isMounted) return;

      if (exists) {
        setLocalPath(dest);
        setDownloadProgress(100);
        return;
      }

      RNFS.downloadFile({
        fromUrl: source,
        toFile: tmp,
        progressInterval: 100,
        begin: () => {
          if (isMounted) setDownloadProgress(0);
        },
        progress: (r: any) => {
          if (isMounted)
            setDownloadProgress(r.contentLength > 0 ? (r.bytesWritten / r.contentLength) * 100 : 0);
        },
      })
        .promise.then(async (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            throw new Error(`Download failed with HTTP status ${res.statusCode}`);
          }
          try {
            await RNFS.moveFile(tmp, dest);
          } catch (err) {
            if (!(await RNFS.exists(dest))) throw err;
            await RNFS.unlink(tmp).catch(() => {});
          }
          if (isMounted) {
            setLocalPath(dest);
            setDownloadProgress(100);
          }
        })
        .catch((e) => {
          RNFS.unlink(tmp).catch(() => {});
          if (isMounted) setDownloadError(e instanceof Error ? e : new Error(String(e)));
        });
    });

    return () => {
      isMounted = false;
    };
  }, [source, preventLoad]);

  return { localPath, downloadProgress, downloadError };
}
