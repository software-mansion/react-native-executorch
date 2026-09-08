# Function: formatChunk()

> **formatChunk**(`chunk`, `lang?`): `string`

Defined in: [extensions/speech/utils/supertonicUtils.ts:127](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/supertonicUtils.ts#L127)

Formats a single text chunk by ensuring ending punctuation and wrapping with
language tags. Should be run on individual partitioned text chunks.

## Parameters

### chunk

`string`

The partitioned text chunk.

### lang?

`string`

The language code.

## Returns

`string`

The formatted chunk ready for model input.

## Throws

With code `INVALID_ARGUMENT` if `lang` is
unsupported.
