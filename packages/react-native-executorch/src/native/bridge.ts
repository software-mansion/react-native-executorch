import { RnExecuTorchError } from '../core/error';

const globalObj = globalThis as any;

if (!globalObj.__rnexecutorch_jsi__) {
  const NativeRnExecutorch = require('./NativeRnExecutorch').default;
  if (NativeRnExecutorch) NativeRnExecutorch.install();
}

/**
 * Direct reference to the native C++ JSI host object (`__rnexecutorch_jsi__`).
 *
 * Provides low-level, synchronous bindings for ExecuTorch core runtime
 * operations (model loading, tensor allocation and manipulation, registered
 * backends inspection, emulator detection) and native extension namespaces
 * (`cv`, `llm`, `math`, `nlp`, `speech`).
 * @internal
 */
export const rnexecutorchJsi = globalObj.__rnexecutorch_jsi__;

if (!rnexecutorchJsi) {
  throw RnExecuTorchError('UNKNOWN', "JSI global object '__rnexecutorch_jsi__' is not registered.");
}

/**
 * The OpenCV-backed `cv` namespace of {@link rnexecutorchJsi}. Native code only
 * installs it when the app builds with OpenCV, so an app that opted out gets an
 * actionable error here instead of a `TypeError` on `undefined`.
 * @returns The native `cv` namespace.
 * @throws {RnExecuTorchError} With code `INVALID_STATE` if the native build
 * has no OpenCV.
 * @internal
 */
export function cvJsi() {
  'worklet';
  if (!rnexecutorchJsi.cv) {
    throw RnExecuTorchError(
      'INVALID_STATE',
      "The native build has no OpenCV. Add the 'opencv' lib (or a feature that uses it, such as " +
        "'classification') to the app's react-native-executorch config and rebuild."
    );
  }
  return rnexecutorchJsi.cv;
}
