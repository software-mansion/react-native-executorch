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

    RNFS.exists(dest).then((exists) => {
      if (!isMounted) return;

      if (exists) {
        setLocalPath(dest);
        setDownloadProgress(100);
        return;
      }

      RNFS.downloadFile({
        fromUrl: source,
        toFile: dest,
        progressInterval: 100,
        begin: () => {
          if (isMounted) setDownloadProgress(0);
        },
        progress: (r: any) => {
          if (isMounted)
            setDownloadProgress(r.contentLength > 0 ? (r.bytesWritten / r.contentLength) * 100 : 0);
        },
      })
        .promise.then(() => {
          if (isMounted) {
            setLocalPath(dest);
            setDownloadProgress(100);
          }
        })
        .catch((e) => {
          if (isMounted) setDownloadError(e instanceof Error ? e : new Error(String(e)));
        });
    });

    return () => {
      isMounted = false;
    };
  }, [source, preventLoad]);

  return { localPath, downloadProgress, downloadError };
}
