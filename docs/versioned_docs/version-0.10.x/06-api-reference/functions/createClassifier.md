# Function: createClassifier()

> **createClassifier**\<`L`\>(`config`, `runtime?`): `Promise`\<[`Classifier`](../type-aliases/Classifier.md)\<`L`\>\>

Defined in: [extensions/cv/tasks/classification.ts:120](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/classification.ts#L120)

Creates an image classifier runner for executing local Image Classification
models.

It validates the model inputs and outputs requirements, asserts that the
labels array length matches the model's output vocabulary size, pre-allocates
the necessary static execution tensors, sets up an image preprocessor, and
registers clean disposal hooks to clear all native memory.

## Type Parameters

### L

`L`

The type representing the classification labels.

## Parameters

### config

[`ClassifierModel`](../type-aliases/ClassifierModel.md)\<`L`\>

Classifier task configuration containing path and options.
See [ClassifierModel](../type-aliases/ClassifierModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run the model
execution.

## Returns

`Promise`\<[`Classifier`](../type-aliases/Classifier.md)\<`L`\>\>

A promise resolving to the instantiated [Classifier](../type-aliases/Classifier.md) runner.

## Throws

With code `LOAD_FAILED` if model fails to load,
`SCHEMA_MISMATCH` if model schema does not match classification spec, or
`INVALID_ARGUMENT` if labels length does not match model output classes.
