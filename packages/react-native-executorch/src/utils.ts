import { rnexecutorchJsi } from './native/bridge';

export function getRegisteredBackends(): string[] {
  return rnexecutorchJsi.getExecuTorchRegisteredBackends();
}
