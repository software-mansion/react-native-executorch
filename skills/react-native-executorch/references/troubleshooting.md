# Diagnose the failing boundary

Inspect the installed versions, platform/backend, model config and coded error before changing the
integration. Use `isRnExecuTorchError(error, 'CODE')` for library error categories; preserve diagnostic
messages and underlying ExecuTorch codes rather than branching on message text.

| Symptom                          | Check                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Missing JSI global/native module | Expo Go versus development build, dependency linking, provisioning and native rebuild                                   |
| Worklet serialization failure    | Babel plugin order, compatible peers, captured values and runtime boundaries                                            |
| Model download fails             | Reachable asset URL, local path, available storage, interrupted transfer, lifecycle scripts for native binaries         |
| `SCHEMA_MISMATCH`                | Exported method name, ordered inputs/outputs, dtype/rank/layout, static versus dynamic domains and declared constraints |
| Backend/operator not found       | Export/runtime version, registered backend, selected native libraries and actual target hardware                        |
| `RESOURCE_BUSY`                  | Overlapping calls using one pipeline/session; serialize or allocate independent instances deliberately                  |
| `RESOURCE_DISPOSED`              | A pending callback or execution using an old pipeline after unmount/config change                                       |
| Memory grows or app is killed    | Model size, cached active pipelines, unreleased tensors/models, repeated allocation, active generation during teardown  |
| Correct shapes but wrong output  | Normalization, color/layout, audio sample rate, tokenizer, label order, decoding and quantization parity                |

A schema describes structural compatibility; it does not prove that preprocessing or output semantics
match. Start with one reference input and compare each boundary with the PyTorch/exported baseline.
For vision, inspect orientation, RGB/BGR and HWC/CHW; for speech inspect mono PCM and sample rate;
for text inspect tokenizer assets and chat templates.

Collect native Xcode/logcat output when execution crashes. A TypeScript typecheck cannot validate native
linkage or delegate execution. Rebuild only the affected native setup and avoid deleting unrelated
caches or upgrading the whole app without evidence.

- [Troubleshooting](https://docs.swmansion.com/react-native-executorch/docs/other/troubleshooting)
- [Error Handling](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/error-handling)
