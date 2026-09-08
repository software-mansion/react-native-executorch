# Type Alias: VadStreamOptions

> **VadStreamOptions** = [`VadOptions`](VadOptions.md) & `object`

Defined in: [extensions/speech/tasks/fsmnVoiceActivityDetection.ts:89](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/fsmnVoiceActivityDetection.ts#L89)

Options controlling live detection via `detectVoiceOnStream`. Extends the
per-call detection thresholds ([VadOptions](VadOptions.md)).

## Type Declaration

### detectionMargin?

> `readonly` `optional` **detectionMargin**: `number`

How recent (in milliseconds) the last detected speech segment must reach
toward the end of the window for speech to still be considered ongoing.
