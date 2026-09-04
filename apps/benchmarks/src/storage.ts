/**
 * Disk hygiene for a whole-estate run.
 *
 * The Android registry is around 118 GB across 163 variants and the iOS one is
 * larger. Keeping every model a run touches would need more free space than
 * most phones have, so a case's files are deleted once its last repeat is done
 * and the next case starts from an empty cache.
 *
 * This deletes the files a case actually resolved, not the whole cache
 * directory: two cases can share a file — a tokenizer, a charset, a voice pack
 * — and one case can legitimately be resumed into a run that already fetched
 * something the next case needs.
 */

import RNBlobUtil from 'react-native-blob-util';

/**
 * Deletes one file, ignoring the case where it is already gone.
 * @param path Absolute path on the device.
 * @returns Bytes reclaimed, or 0 if the file was missing or unreadable.
 */
async function unlinkIfPresent(path: string): Promise<number> {
  try {
    const stat = await RNBlobUtil.fs.stat(path);
    const size = Number(stat.size) || 0;
    await RNBlobUtil.fs.unlink(path);
    return size;
  } catch {
    return 0;
  }
}

/**
 * Collects the local file paths a resolved config points at.
 *
 * `download` returns the config with every remote URL replaced in place, so
 * walking the resolved object finds exactly the files this case pulled, however
 * deeply the pipeline nests them.
 * @param resolved The config as `download` returned it.
 * @returns Absolute paths, deduplicated.
 */
export function localFiles(resolved: unknown): string[] {
  const found = new Set<string>();
  const walk = (value: unknown) => {
    if (typeof value === 'string') {
      // A resolved path is absolute and local; anything still remote was not
      // downloaded and has nothing to delete.
      if (value.startsWith('/') || value.startsWith('file://')) found.add(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(resolved);
  return [...found];
}

/**
 * Deletes every file a case downloaded.
 * @param resolved The config as `download` returned it.
 * @returns Bytes reclaimed.
 */
export async function releaseModelFiles(resolved: unknown): Promise<number> {
  const paths = localFiles(resolved);
  const freed = await Promise.all(
    paths.map((path) => unlinkIfPresent(path.replace(/^file:\/\//, '')))
  );
  return freed.reduce((total, bytes) => total + bytes, 0);
}

/**
 * Free space on the volume the models are cached on.
 * @returns Free bytes, or null when the platform will not say.
 */
export async function freeDiskBytes(): Promise<number | null> {
  try {
    const stats = await RNBlobUtil.fs.df();
    const free = Number(stats.free ?? stats.internal_free);
    return Number.isFinite(free) ? free : null;
  } catch {
    return null;
  }
}
