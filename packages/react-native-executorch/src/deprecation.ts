/**
 * Registry variants on their way out. A variant is deprecated once a twin on the
 * same backend runs faster from a smaller download without losing accuracy. It
 * keeps working for one minor release, warning whenever it is downloaded, and is
 * then removed.
 */

// Keyed by model URL rather than by config object, so a config the app copied
// or extended (`{ ...models.x.Y.XNNPACK_FP32, modelOpts }`) still warns.
const notices = new Map<string, string>();
const warned = new Set<string>();

/**
 * Records that the model at `modelPath` is deprecated.
 * @param modelPath The variant's remote `.pte` URL.
 * @param notice What to tell the developer, including what to use instead.
 */
export function registerDeprecation(modelPath: string, notice: string): void {
  notices.set(modelPath, notice);
}

/**
 * The deprecation notice for a model URL, if it has one.
 * @param modelPath A remote `.pte` URL.
 * @returns The notice, or `undefined` for a supported model.
 */
export function deprecationOf(modelPath: string): string | undefined {
  return notices.get(modelPath);
}

/**
 * Warns, once per URL and in development only, about every deprecated model
 * among `urls`.
 * @param urls The remote sources about to be downloaded.
 */
export function warnIfDeprecated(urls: Iterable<string>): void {
  if (!__DEV__) return;
  for (const url of urls) {
    const notice = notices.get(url);
    if (notice === undefined || warned.has(url)) continue;
    warned.add(url);
    // eslint-disable-next-line no-console
    console.warn(`[React Native ExecuTorch] ${notice}`);
  }
}
