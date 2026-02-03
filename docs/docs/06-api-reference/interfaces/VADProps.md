# Interface: VADProps

Defined in: [packages/react-native-executorch/src/types/vad.ts:12](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/types/vad.ts#L12)

Props for the useVAD hook.

## Properties

### model

> **model**: `object`

Defined in: [packages/react-native-executorch/src/types/vad.ts:13](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/types/vad.ts#L13)

An object containing the model source.

#### modelSource

> **modelSource**: [`ResourceSource`](../type-aliases/ResourceSource.md)

---

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [packages/react-native-executorch/src/types/vad.ts:14](https://github.com/software-mansion/react-native-executorch/blob/6829cd7e41d61eb83543baaf8d938ad81501b178/packages/react-native-executorch/src/types/vad.ts#L14)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
