# Function: labelEntityType()

> **labelEntityType**(`labelId`, `labelNames`): `string`

Defined in: [extensions/nlp/utils/privacyFilterUtils.ts:375](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/nlp/utils/privacyFilterUtils.ts#L375)

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
