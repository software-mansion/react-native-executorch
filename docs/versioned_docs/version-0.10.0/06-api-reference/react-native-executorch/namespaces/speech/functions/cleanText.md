# Function: cleanText()

> **cleanText**(`text`): `string`

Defined in: [extensions/speech/utils/supertonicUtils.ts:101](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/utils/supertonicUtils.ts#L101)

Normalizes unicode, replaces symbols/abbreviations, strips emojis, and cleans
whitespace. Should be run on full input text prior to chunk partitioning.

## Parameters

### text

`string`

The raw input text.

## Returns

`string`

The normalized clean text.
