# Interface: VADProps

Defined in: [types/vad.ts:29](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L29)

Props for the useVAD hook.

## Properties

### model

> **model**: [`VADConfig`](VADConfig.md)

Defined in: [types/vad.ts:30](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L30)

An object containing the model configuration.

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/vad.ts:31](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/vad.ts#L31)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
