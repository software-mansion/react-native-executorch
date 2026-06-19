const globalObj = globalThis as any;

if (!globalObj.__rnexecutorch_jsi__) {
  const NativeRnExecutorch = require('./NativeRnExecutorch').default;
  if (NativeRnExecutorch) NativeRnExecutorch.install();
}

export const rnexecutorchJsi = globalObj.__rnexecutorch_jsi__;

if (!rnexecutorchJsi) {
  throw new Error("JSI global object '__rnexecutorch_jsi__' is not registered.");
}
