# Function: usePrivacyFilter()

> **usePrivacyFilter**\<`Label`\>(`config`, `options?`): `object`

Defined in: [hooks/usePrivacyFilter.ts:27](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/usePrivacyFilter.ts#L27)

React hook to load and run a privacy filter (PII detection) model.

This hook manages downloading (if remote URLs are provided) and loading the
model assets and tokenizer files, tracking download progress and load errors,
and releasing native memory when the component unmounts or the configuration
changes.

For imperative usage, see [createPrivacyFilter](createPrivacyFilter.md).

## Type Parameters

### Label

`Label` _extends_ `string`

The model's BIOES label space, narrowing the detected entity
types when a concrete `models` registry entry is passed.

## Parameters

### config

[`PrivacyFilterModel`](../type-aliases/PrivacyFilterModel.md)\<`Label`\>

The privacy filter model configuration.
See [PrivacyFilterModel](../type-aliases/PrivacyFilterModel.md).

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [PrivacyFilter](../type-aliases/PrivacyFilter.md) (without `dispose`),
combined with loading state and download progress.

### detectPii

> **detectPii**: (`input`) => `Promise`\<[`PiiEntity`](../react-native-executorch/namespaces/nlp/interfaces/PiiEntity.md)\<[`PiiEntityType`](../react-native-executorch/namespaces/nlp/type-aliases/PiiEntityType.md)\<`Label`\>\>[]\> \| `undefined` = `model.detectPii`

### detectPiiWorklet

> **detectPiiWorklet**: (`input`) => [`PiiEntity`](../react-native-executorch/namespaces/nlp/interfaces/PiiEntity.md)\<[`PiiEntityType`](../react-native-executorch/namespaces/nlp/type-aliases/PiiEntityType.md)\<`Label`\>\>[] \| `undefined` = `model.detectPiiWorklet`

### downloadProgress

> **downloadProgress**: `number`

### error

> **error**: `Error` \| `undefined`

### isReady

> **isReady**: `boolean` = `!!model`

### resource

> **resource**: [`PrivacyFilterModel`](../type-aliases/PrivacyFilterModel.md)\<`Label`\> \| `undefined`

## See

[PrivacyFilter](../type-aliases/PrivacyFilter.md)
