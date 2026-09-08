# Type Alias: FsmnVadModel

> **FsmnVadModel** = `object`

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:62](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L62)

Model configuration required to instantiate an FSMN-VAD task runner.

## Properties

### defaultOptions

> `readonly` **defaultOptions**: `Required`\<[`VadOptions`](VadOptions.md)\>

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:70](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L70)

Detection thresholds tuned for this model, overridable per `detectVoice`
call. Defined alongside the model in the `models` registry so defaults
are discoverable there.

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:64](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L64)

Local path or remote URL of the `.pte` model.
