# Function: labelEntityType()

> **labelEntityType**(`labelId`, `labelNames`): `string`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:375](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L375)

Maps a BIOES label id to its bare entity type (the part after the `-`), or
an empty string for `O` / unprefixed / out-of-range ids.

## Parameters

### labelId

`number`

Predicted label id.

### labelNames

readonly `string`[]

The BIOES label list.

## Returns

`string`

The entity type, or `''` for background.
