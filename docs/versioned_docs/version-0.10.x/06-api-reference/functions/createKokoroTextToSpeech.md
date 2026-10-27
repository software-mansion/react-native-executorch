# Function: createKokoroTextToSpeech()

> **createKokoroTextToSpeech**\<`K`\>(`config`, `runtime?`): `Promise`\<[`KokoroTextToSpeech`](../type-aliases/KokoroTextToSpeech.md)\<`K`\>\>

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:163](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L163)

Creates a Kokoro Text-to-Speech pipeline.

It validates both sub-model method schemas, builds the grapheme-to-phoneme
pipeline, pre-parses the voice files into memory, and registers disposal
hooks to release all native resources.

## Type Parameters

### K

`K` _extends_ `PropertyKey`

Voice keys record constraint.

## Parameters

### config

[`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`K`\>

Kokoro TTS pipeline configuration containing model and asset paths.
See [KokoroTtsModel](../type-aliases/KokoroTtsModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run inference.

## Returns

`Promise`\<[`KokoroTextToSpeech`](../type-aliases/KokoroTextToSpeech.md)\<`K`\>\>

A promise resolving to the instantiated [KokoroTextToSpeech](../type-aliases/KokoroTextToSpeech.md) runner.

## Throws

With code `LOAD_FAILED` if models or voice files
fail to load, `SCHEMA_MISMATCH` if model schemas do not match the Kokoro
specification, or `INVALID_STATE` if phonemizer native support is missing.
