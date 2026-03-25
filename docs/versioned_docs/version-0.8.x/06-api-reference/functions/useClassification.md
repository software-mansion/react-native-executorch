# Function: useClassification()

> **useClassification**\<`C`\>(`props`): [`ClassificationType`](../interfaces/ClassificationType.md)\<[`ClassificationLabels`](../type-aliases/ClassificationLabels.md)\<`C`\[`"modelName"`\]\>\>

Defined in: [hooks/computer\_vision/useClassification.ts:20](https://github.com/software-mansion/react-native-executorch/blob/d0d3e5b7a1d42b2e7bcd89806efcaf0b961974c9/packages/react-native-executorch/src/hooks/computer_vision/useClassification.ts#L20)

React hook for managing a Classification model instance.

## Type Parameters

### C

`C` *extends* [`ClassificationModelSources`](../type-aliases/ClassificationModelSources.md)

A [ClassificationModelSources](../type-aliases/ClassificationModelSources.md) config specifying which built-in model to load.

## Parameters

### props

[`ClassificationProps`](../interfaces/ClassificationProps.md)\<`C`\>

Configuration object containing `model` source and optional `preventLoad` flag.

## Returns

[`ClassificationType`](../interfaces/ClassificationType.md)\<[`ClassificationLabels`](../type-aliases/ClassificationLabels.md)\<`C`\[`"modelName"`\]\>\>

Ready to use Classification model.
