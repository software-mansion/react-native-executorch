# Function: encodeText()

> **encodeText**(`text`, `indexer`): `BigInt64Array`

Defined in: [extensions/speech/utils/supertonicUtils.ts:166](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/supertonicUtils.ts#L166)

Encodes preprocessed text to character unicode index ids based on
unicode_indexer.json.

## Parameters

### text

`string`

The preprocessed text.

### indexer

readonly `number`[]

The unicode indexer character mapping array.

## Returns

`BigInt64Array`

BigInt64Array of character IDs.
