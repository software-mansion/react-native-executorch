import { ResourceSource } from '../types/common';
import { ResourceFetcherAdapter } from './ResourceFetcher';
import { ResourceFetcherUtils, SourceType } from './ResourceFetcherUtils';
import { RnExecutorchError } from '../errors/errorUtils';
import { RnExecutorchErrorCode } from '../errors/ErrorCodes';

interface FileSizeInfo {
  source: ResourceSource;
  type: SourceType;
  length: number;
  previousFilesTotalLength: number;
}

interface FilesSizesResult {
  results: FileSizeInfo[];
  totalLength: number;
}

/**
 * Abstract base class for resource fetcher implementations.
 *
 * Contains the shared fetch loop, source dispatching, and pause/resume/cancel
 * plumbing. Concrete subclasses (expo, bare) implement the platform-specific
 * file system operations and download mechanics.
 * @typeParam TDownload - The platform-specific active download descriptor type.
 */
export abstract class BaseResourceFetcherClass<
  TDownload,
> implements ResourceFetcherAdapter {
  /**
   * Map of currently active (downloading or paused) remote downloads.
   * Keyed by the original source value the user passed in so that
   * `pauseFetching`/`cancelFetching` can look up the entry using that same value.
   * Entries are added when a download starts and removed when it completes,
   * is canceled, or errors.
   */
  protected abstract downloads: Map<ResourceSource, TDownload>;

  /**
   * Fire HEAD requests for all remote sources to collect their file sizes.
   * Used by `fetch()` to calculate unified 0→1 progress across all downloads.
   * Non-remote sources (objects, local files, assets) should be included in
   * the results with `length: 0`.
   */
  protected abstract getFilesSizes(
    sources: ResourceSource[]
  ): Promise<FilesSizesResult>;

  /**
   * Serialize `source` as JSON, write it to `RNEDirectory`, and return the
   * local path. Should be idempotent — if the file already exists, return its
   * path without rewriting.
   */
  protected abstract handleObject(source: object): Promise<string>;

  /**
   * Strip the `file://` prefix from a local file URI and return the bare path.
   * No I/O required — this is a pure string transformation.
   */
  protected abstract handleLocalFile(source: string): string;

  /**
   * Handle a bundled asset (a `require()` number).
   * - **Dev mode** (Metro serves the asset over HTTP): resolve the URI and
   *   delegate to `handleRemote`.
   * - **Release mode** (asset is bundled locally): copy it to `RNEDirectory`
   *   and return the local path.
   * Must be idempotent — if the destination file already exists, skip the copy.
   */
  protected abstract handleAsset(
    source: number,
    progressCallback: (progress: number) => void
  ): Promise<string>;

  /**
   * Download a remote file to `RNEDirectory` and return the local path.
   * Must be idempotent — if the file is already present, return its path
   * without re-downloading.
   *
   * `uri` and `source` are separate parameters because for asset dev-mode
   * sources, `source` is the `require()` number the user holds (used as the
   * `downloads` map key for pause/cancel), while `uri` is the resolved HTTP
   * URL needed for the actual network request. For plain remote strings they
   * are the same value.
   *
   * Returns `null` if the download was interrupted by `cancel()`.
   * @remarks
   * The returned Promise must be resolvable from outside this function —
   * `cancel()` and `resume()` need to unblock the `fetch()` loop by calling
   * `resolve`/`reject` stored on the `downloads` map entry. See handlers.ts
   * for the leaked-resolver pattern used to achieve this.
   */
  protected abstract handleRemote(
    uri: string,
    source: ResourceSource,
    progressCallback: (progress: number) => void
  ): Promise<{ path: string; wasDownloaded: boolean }>;

  /**
   * Pause the active download for `source`. Should throw
   * `ResourceFetcherAlreadyPaused` if already paused, and
   * `ResourceFetcherPlatformNotSupported` if the platform does not support
   * pausing (e.g. Android in the bare implementation).
   */
  protected abstract pause(source: ResourceSource): Promise<void>;

  /**
   * Resume a paused download for `source`. The result must flow back through
   * the original `fetch()` promise — call `resolve(path)` on the `downloads`
   * map entry rather than creating a new Promise. Should throw
   * `ResourceFetcherAlreadyOngoing` if the download is not paused, and
   * `ResourceFetcherPlatformNotSupported` if the platform does not support
   * resuming.
   */
  protected abstract resume(source: ResourceSource): Promise<void>;

  /**
   * Cancel an active or paused download for `source`. Must:
   * 1. Abort the in-progress network request.
   * 2. Clean up any partial files from the cache directory.
   * 3. Delete the entry from `downloads`.
   * 4. Call `reject(new RnExecutorchError(DownloadInterrupted, ...))` on the entry to unblock the `fetch()` loop.
   */
  protected abstract cancel(source: ResourceSource): Promise<void>;

  /**
   * Read a local file and return its contents as a UTF-8 string.
   * Used internally to read config files (e.g. tokenizer JSON).
   */
  abstract readAsString(path: string): Promise<string>;

  /**
   * List all files previously downloaded into `RNEDirectory`.
   * Returns absolute file paths (no `file://` prefix).
   */
  abstract listDownloadedFiles(): Promise<string[]>;

  /**
   * Delete the local files corresponding to the given sources from
   * `RNEDirectory`. Should be a no-op for sources whose file does not exist.
   */
  abstract deleteResources(...sources: ResourceSource[]): Promise<void>;

  /**
   * Fire HEAD requests for the given remote URLs and return their combined
   * size in bytes. Non-remote sources should contribute 0 bytes.
   */
  abstract getFilesTotalSize(...sources: ResourceSource[]): Promise<number>;

  async fetch(
    callback: (downloadProgress: number) => void = () => {},
    ...sources: ResourceSource[]
  ): Promise<{ paths: string[]; wasDownloaded: boolean[] }> {
    if (sources.length === 0) {
      throw new RnExecutorchError(
        RnExecutorchErrorCode.InvalidUserInput,
        'Empty list given as an argument to Resource Fetcher'
      );
    }

    const { results: info, totalLength } = await this.getFilesSizes(sources);
    // Key by source so we can look up progress info without relying on index
    // alignment (getFilesSizes skips sources whose HEAD request fails).
    const infoMap = new Map(info.map((entry) => [entry.source, entry]));
    const paths: string[] = [];
    const wasDownloaded: boolean[] = [];

    for (const source of sources) {
      const fileInfo = infoMap.get(source);
      const progressCallback =
        fileInfo?.type === SourceType.REMOTE_FILE
          ? ResourceFetcherUtils.calculateDownloadProgress(
              totalLength,
              fileInfo.previousFilesTotalLength,
              fileInfo.length,
              callback
            )
          : () => {};

      const result = await this.fetchOne(source, progressCallback);
      paths.push(result.path);
      wasDownloaded.push(result.wasDownloaded);
    }

    return { paths, wasDownloaded };
  }

  private async fetchOne(
    source: ResourceSource,
    progressCallback: (progress: number) => void
  ): Promise<{ path: string; wasDownloaded: boolean }> {
    if (typeof source === 'object')
      return { path: await this.handleObject(source), wasDownloaded: false };
    if (typeof source === 'number')
      return {
        path: await this.handleAsset(source, progressCallback),
        wasDownloaded: false,
      };
    if (source.startsWith('file://'))
      return { path: this.handleLocalFile(source), wasDownloaded: false };
    return this.handleRemote(source, source, progressCallback);
  }

  async listDownloadedModels(): Promise<string[]> {
    const files = await this.listDownloadedFiles();
    return files.filter((f) => f.endsWith('.pte'));
  }

  async pauseFetching(...sources: ResourceSource[]): Promise<void> {
    await this.pause(this.findActive(sources));
  }

  async resumeFetching(...sources: ResourceSource[]): Promise<void> {
    await this.resume(this.findActive(sources));
  }

  async cancelFetching(...sources: ResourceSource[]): Promise<void> {
    await this.cancel(this.findActive(sources));
  }

  protected findActive(sources: ResourceSource[]): ResourceSource {
    for (const source of sources) {
      if (this.downloads.has(source)) return source;
    }
    throw new RnExecutorchError(
      RnExecutorchErrorCode.ResourceFetcherNotActive,
      'None of given sources are currently during downloading process.'
    );
  }
}
