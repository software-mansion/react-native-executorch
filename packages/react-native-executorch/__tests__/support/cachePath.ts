/**
 * Where a given URL will be cached.
 *
 * A `use<Task>` hook downloads first and loads second, with no gap a test can
 * hook into — so a fake program has to be registered under its final path
 * before the hook renders. That path is derived inside
 * `src/fetcher/fetcher.ts` and not exported, so it is mirrored here.
 *
 * The duplication is deliberate but guarded: `hooks/taskHooks.test.ts` asserts
 * that a real download lands exactly on `cachePathFor(url)`, so a change to the
 * derivation fails there rather than silently desynchronizing the fixtures.
 */

/* eslint-disable no-bitwise */
const djb2 = (s: string): number => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  }
  return h;
};
/* eslint-enable no-bitwise */

/** The iOS branch of the fetcher's cache directory, as the blob-util mock reports it. */
const CACHE_DIRECTORY = '/fake/documents/react-native-executorch';

/**
 * @param url The remote URL a pipeline config points at.
 * @returns The local path the fetcher will download it to.
 */
export function cachePathFor(url: string): string {
  const withoutQuery = url.split('?')[0]!;
  const basename = withoutQuery.split('/').pop() || 'model';
  return `${CACHE_DIRECTORY}/${djb2(withoutQuery)}_${basename}`;
}
