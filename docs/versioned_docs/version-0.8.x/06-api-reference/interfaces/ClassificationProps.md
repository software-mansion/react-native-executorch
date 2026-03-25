# Interface: ClassificationProps\<C\>

Defined in: [types/classification.ts:42](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/classification.ts#L42)

Props for the `useClassification` hook.

## Type Parameters

### C

`C` *extends* [`ClassificationModelSources`](../type-aliases/ClassificationModelSources.md)

A [ClassificationModelSources](../type-aliases/ClassificationModelSources.md) config specifying which built-in model to load.

## Properties

### model

> **model**: `C`

Defined in: [types/classification.ts:43](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/classification.ts#L43)

The model config containing `modelName` and `modelSource`.

***

### preventLoad?

> `optional` **preventLoad**: `boolean`

Defined in: [types/classification.ts:44](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/types/classification.ts#L44)

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.
