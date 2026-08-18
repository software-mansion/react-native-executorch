import { TurboModuleRegistry, type TurboModule } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypesNamespace';

/**
 * Bytes transferred so far for one download, and the file's full length (0
 * while the transfer does not know it yet).
 */
export type DownloadProgressEvent = {
  taskId: string;
  written: number;
  total: number;
};

export interface Spec extends TurboModule {
  install(): boolean;

  /**
   * Downloads `url` into `destination` through a background session, so the
   * transfer keeps running while the app is suspended. Resolves with
   * `destination` once the file is in place.
   *
   * iOS only. Android downloads go through the system DownloadManager, which
   * already survives backgrounding, so there it rejects as unsupported.
   */
  startDownload(taskId: string, url: string, destination: string): Promise<string>;

  /**
   * Stops a running download, keeping what it already fetched so a later
   * `startDownload` for the same destination continues from there rather than
   * starting over. iOS only.
   */
  cancelDownload(taskId: string): Promise<void>;

  /**
   * Stops any transfer in flight for `destination` and drops its saved resume
   * state, so the next download of it starts from zero. iOS only.
   */
  resetDownload(destination: string): Promise<void>;

  readonly onDownloadProgress: EventEmitter<DownloadProgressEvent>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RnExecutorch');
