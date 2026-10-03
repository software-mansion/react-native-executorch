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
