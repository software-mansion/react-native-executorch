import { RnExecuTorchError } from '../core/error';

const globalObj = globalThis as any;

if (!globalObj.__rnexecutorch_jsi__) {
  const NativeRnExecutorch = require('./NativeRnExecutorch').default;
  if (NativeRnExecutorch) NativeRnExecutorch.install();
}

export const rnexecutorchJsi = globalObj.__rnexecutorch_jsi__;

if (!rnexecutorchJsi) {
  throw RnExecuTorchError('UNKNOWN', "JSI global object '__rnexecutorch_jsi__' is not registered.");
}
