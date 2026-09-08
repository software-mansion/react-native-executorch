# Function: createSupertonicTextToSpeech()

> **createSupertonicTextToSpeech**\<`K`\>(`config`, `runtime?`): `Promise`\<[`SupertonicTextToSpeech`](../type-aliases/SupertonicTextToSpeech.md)\<`K`\>\>

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:179](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L179)

Creates a Supertonic Text-to-Speech pipeline.

It validates all 4 sub-model method schemas, pre-allocates static execution
tensors, pre-parses voice styles into memory, and registers disposal hooks to
release all native resources.

## Type Parameters

### K

`K` _extends_ `PropertyKey`

Voice style keys record constraint.

## Parameters

### config

[`SupertonicTtsModel`](../type-aliases/SupertonicTtsModel.md)\<`K`\>

Supertonic TTS pipeline configuration containing model and asset paths.
See [SupertonicTtsModel](../type-aliases/SupertonicTtsModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run inference.

## Returns

`Promise`\<[`SupertonicTextToSpeech`](../type-aliases/SupertonicTextToSpeech.md)\<`K`\>\>

A promise resolving to the instantiated [SupertonicTextToSpeech](../type-aliases/SupertonicTextToSpeech.md)
runner.

## Throws

With code `LOAD_FAILED` if models, indexer, or
voice styles fail to load, or `SCHEMA_MISMATCH` if model schemas do not match
the Supertonic specification.
