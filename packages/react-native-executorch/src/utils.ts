/**
 * Utility functions for inspecting models and querying native runtime
 * capabilities.
 */

import { rnexecutorchJsi } from './native/bridge';
import { loadModel } from './core/model';
import type { ModelSpec, ConcreteDim } from './core/schema';
import RNBlobUtil from 'react-native-blob-util';

/**
 * Retrieves the names of all ExecuTorch backends compiled and registered in the
 * native binary.
 * @category Utils / Functions
 * @returns An array of registered backend name strings (e.g. 'XnnpackBackend',
 * 'CoreMLBackend').
 */
export function getRegisteredBackends(): string[] {
  'worklet';
  return rnexecutorchJsi.getExecuTorchRegisteredBackends();
}

/**
 * Options accepted by {@link useResourceDownload} and by every `use<Task>` hook
 * built on top of it.
 * @category Utils / Types
 */
export type ResourceOptions = {
  /** If true, prevents checks and downloads, resetting the hook state. */
  preventLoad?: boolean;
  /**
   * Re-downloads every remote source even when it is already cached, replacing
   * the cached copy. Use to recover from a corrupted file or to pick up a model
   * that changed behind a stable URL.
   */
  forceDownload?: boolean;
};

/**
 * Result of inspecting an ExecuTorch model file.
 * @category Utils / Types
 */
export type ModelInspection = {
  /** The model source URL or file path that was inspected. */
  readonly source: string;
  /** Method signatures and tensor schema metadata. */
  readonly schema: ModelSpec<ConcreteDim>;
  /** Map of method names to the backends each method was compiled for. */
  readonly backends: Record<string, readonly string[]>;
};

/**
 * Inspects an ExecuTorch model file to fetch its metadata and signature info
 * for all methods.
 *
 * If a remote HTTP URL is provided, the utility downloads the model to a
 * temporary local file, reads its configuration and method signatures
 * (inputs/outputs shapes, types, and tags), and deletes the temporary file
 * before returning.
 *
 * That download is deliberately throwaway: it does not go through
 * {@link download}, so the file never enters the persistent resource cache and
 * is not reused. Inspecting a remote model therefore re-downloads it on every
 * call and leaves nothing behind — call {@link download} first and inspect the
 * returned local path if you also intend to run the model.
 * @category Utils / Functions
 * @param source The remote HTTP URL or local path to the `.pte` model file.
 * @returns A promise resolving to an object containing the model source, method
 * signature metadata, and per-method backend usage.
 */
export async function inspectModel(source: string): Promise<ModelInspection> {
  let localPath = source;
  let downloaded = false;

  if (source.startsWith('http')) {
    // Throwaway download to a temp path — inspection shouldn't populate the
    // persistent resource cache, so we don't go through `download()`.
    localPath = `${RNBlobUtil.fs.dirs.CacheDir}/inspect_model_${Date.now()}.pte`;
    await RNBlobUtil.config({ path: localPath }).fetch('GET', source);
    downloaded = true;
  }

  let model: ReturnType<typeof loadModel> | undefined;

  try {
    model = loadModel(localPath);
    return { source, schema: model.schema, backends: model.backends };
  } finally {
    model?.dispose();
    if (downloaded) {
      await RNBlobUtil.fs.unlink(localPath).catch(() => {});
    }
  }
}
