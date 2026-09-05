# Function: styleTransferUrls()

> **styleTransferUrls**\<`Display`, `Slug`\>(`display`, `slug`): `object`

Defined in: [constants/modelUrls.ts:701](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/constants/modelUrls.ts#L701)

Builds the four `(backend, precision)` URLs for a single style-transfer style.

## Type Parameters

### Display

`Display` _extends_ `string`

### Slug

`Slug` _extends_ `string`

## Parameters

### display

`Display`

HF repo suffix (e.g. `rain-princess`).

### slug

`Slug`

.pte filename token (e.g. `rain_princess`). Differs from
`display` for styles whose names contain spaces.

## Returns

`object`

Per-(backend, precision) URLs for the requested style.

### coremlBase

> **coremlBase**: `string`

### coremlQuant

> **coremlQuant**: `string`

### xnnpackBase

> **xnnpackBase**: `string`

### xnnpackQuant

> **xnnpackQuant**: `string`
