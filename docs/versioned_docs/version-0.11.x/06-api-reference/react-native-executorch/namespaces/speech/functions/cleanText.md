# Function: cleanText()

> **cleanText**(`text`): `string`

Defined in: [extensions/speech/utils/supertonicUtils.ts:101](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/utils/supertonicUtils.ts#L101)

Normalizes unicode, replaces symbols/abbreviations, strips emojis, and cleans
whitespace. Should be run on full input text prior to chunk partitioning.

## Parameters

### text

`string`

The raw input text.

## Returns

`string`

The normalized clean text.
