# Function: createFsmnVoiceActivityDetector()

> **createFsmnVoiceActivityDetector**(`config`, `runtime?`): `Promise`\<[`FsmnVoiceActivityDetector`](../type-aliases/FsmnVoiceActivityDetector.md)\>

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:245](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L245)

Creates a Voice Activity Detection runner for the FSMN-VAD model.

It loads the model, validates its input/output signature and registers a
disposal hook. The whole pipeline — feature extraction, chunked inference and
segment postprocessing — runs in TypeScript on top of the core `model.execute`
primitive.

## Parameters

### config

[`FsmnVadModel`](../type-aliases/FsmnVadModel.md)

VAD task configuration containing the model path and default
options. See [FsmnVadModel](../type-aliases/FsmnVadModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run the model
execution.

## Returns

`Promise`\<[`FsmnVoiceActivityDetector`](../type-aliases/FsmnVoiceActivityDetector.md)\>

A promise resolving to the instantiated [FsmnVoiceActivityDetector](../type-aliases/FsmnVoiceActivityDetector.md) runner.

## Throws

With code `LOAD_FAILED` if the model fails to
load, or `SCHEMA_MISMATCH` if the model schema does not match the VAD
specification.
