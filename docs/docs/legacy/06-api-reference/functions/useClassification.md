# Function: useClassification()

> **useClassification**\<`C`\>(`props`): [`ClassificationType`](../interfaces/ClassificationType.md)\<[`ClassificationLabels`](../type-aliases/ClassificationLabels.md)\<`C`\[`"modelName"`\]\>\>

Defined in: [hooks/computer_vision/useClassification.ts:20](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/hooks/computer_vision/useClassification.ts#L20)

React hook for managing a Classification model instance.

## Type Parameters

### C

`C` _extends_ [`ClassificationModelSources`](../type-aliases/ClassificationModelSources.md)

A [ClassificationModelSources](../type-aliases/ClassificationModelSources.md) config specifying which built-in model to load.

## Parameters

### props

[`ClassificationProps`](../interfaces/ClassificationProps.md)\<`C`\>

Configuration object containing `model` source and optional `preventLoad` flag.

## Returns

[`ClassificationType`](../interfaces/ClassificationType.md)\<[`ClassificationLabels`](../type-aliases/ClassificationLabels.md)\<`C`\[`"modelName"`\]\>\>

Ready to use Classification model.
