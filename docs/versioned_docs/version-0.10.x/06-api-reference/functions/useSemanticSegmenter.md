# Function: useSemanticSegmenter()

> **useSemanticSegmenter**\<`L`\>(`config`, `options?`): `object`

Defined in: [hooks/useSemanticSegmenter.ts:26](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useSemanticSegmenter.ts#L26)

React hook to load and run a semantic segmentation model.

This hook manages downloading (if remote URLs are provided) and loading the
model assets, compiling them, tracking download progress and load errors, and
releasing native memory when the component unmounts or the configuration
changes.

For imperative usage, see [createSemanticSegmenter](createSemanticSegmenter.md).

## Type Parameters

### L

`L` _extends_ `PropertyKey` = `string`

The type representing the segmentation labels.

## Parameters

### config

[`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`L`\>

The semantic segmentation model configuration.
See [SemanticSegmenterModel](../type-aliases/SemanticSegmenterModel.md).

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [SemanticSegmenter](../type-aliases/SemanticSegmenter.md) (without `dispose`),
combined with loading state, download progress, and labels.

### downloadProgress

> **downloadProgress**: `number`

### error

> **error**: `Error` \| `undefined`

### isReady

> **isReady**: `boolean` = `!!model`

### labels

> **labels**: readonly `L`[] = `config.modelOpts.labels`

### resource

> **resource**: [`SemanticSegmenterModel`](../type-aliases/SemanticSegmenterModel.md)\<`L`\> \| `undefined`

### segment

> **segment**: (`input`, `colormap?`) => `Promise`\<[`SemanticSegmentationResult`](../type-aliases/SemanticSegmentationResult.md)\<`L`\>\> \| `undefined` = `model.segment`

### segmentWorklet

> **segmentWorklet**: (`input`, `colormap?`) => [`SemanticSegmentationResult`](../type-aliases/SemanticSegmentationResult.md)\<`L`\> \| `undefined` = `model.segmentWorklet`

## See

[SemanticSegmenter](../type-aliases/SemanticSegmenter.md)
