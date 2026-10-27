# Function: useInstanceSegmenter()

> **useInstanceSegmenter**\<`F`, `L`\>(`config`, `options?`): `object`

Defined in: [hooks/useInstanceSegmenter.ts:28](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useInstanceSegmenter.ts#L28)

React hook to load and run an instance segmentation model.

This hook manages downloading (if remote URLs are provided) and loading the
model assets, compiling them, tracking download progress and load errors, and
releasing native memory when the component unmounts or the configuration
changes.

For imperative usage, see [createInstanceSegmenter](createInstanceSegmenter.md).

## Type Parameters

### F

`F` _extends_ `"xyxy"` \| `"xywh"` \| `"cxcywh"`

The bounding box format.

### L

`L`

The class labels type.

## Parameters

### config

[`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`F`, `L`\>

The instance segmentation model configuration.
See [InstanceSegmenterModel](../type-aliases/InstanceSegmenterModel.md).

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [InstanceSegmenter](../type-aliases/InstanceSegmenter.md) (without `dispose`),
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

> **resource**: [`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`F`, `L`\> \| `undefined`

### segmentInstances

> **segmentInstances**: (`input`, `options?`) => `Promise`\<[`InstanceSegmentationResult`](../type-aliases/InstanceSegmentationResult.md)\<`F`, `L`\>[]\> \| `undefined` = `model.segmentInstances`

### segmentInstancesWorklet

> **segmentInstancesWorklet**: (`input`, `options?`) => [`InstanceSegmentationResult`](../type-aliases/InstanceSegmentationResult.md)\<`F`, `L`\>[] \| `undefined` = `model.segmentInstancesWorklet`

## See

[InstanceSegmenter](../type-aliases/InstanceSegmenter.md)
