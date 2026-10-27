# Function: useKeypointDetector()

> **useKeypointDetector**\<`F`, `L`\>(`config`, `options?`): `object`

Defined in: [hooks/useKeypointDetector.ts:28](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useKeypointDetector.ts#L28)

React hook to load and run a keypoint detection model.

This hook manages downloading (if remote URLs are provided) and loading the
model assets, compiling them, tracking download progress and load errors, and
releasing native memory when the component unmounts or the configuration
changes.

For imperative usage, see [createKeypointDetector](createKeypointDetector.md).

## Type Parameters

### F

`F` _extends_ `"xyxy"` \| `"xywh"` \| `"cxcywh"`

The bounding box format.

### L

`L` _extends_ `PropertyKey`

The landmark labels type.

## Parameters

### config

[`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`F`, `L`\>

The keypoint detection model configuration.
See [KeypointDetectorModel](../type-aliases/KeypointDetectorModel.md).

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [KeypointDetector](../type-aliases/KeypointDetector.md) (without `dispose`),
combined with loading state, download progress, and landmarks.

### detectKeypoints

> **detectKeypoints**: (`input`, `options?`) => `Promise`\<[`KeypointDetection`](../type-aliases/KeypointDetection.md)\<`F`, `L`\>[]\> \| `undefined` = `model.detectKeypoints`

### detectKeypointsWorklet

> **detectKeypointsWorklet**: (`input`, `options?`) => [`KeypointDetection`](../type-aliases/KeypointDetection.md)\<`F`, `L`\>[] \| `undefined` = `model.detectKeypointsWorklet`

### downloadProgress

> **downloadProgress**: `number`

### error

> **error**: `Error` \| `undefined`

### isReady

> **isReady**: `boolean` = `!!model`

### landmarks

> **landmarks**: readonly `L`[] = `config.modelOpts.landmarks`

### resource

> **resource**: [`KeypointDetectorModel`](../type-aliases/KeypointDetectorModel.md)\<`F`, `L`\> \| `undefined`

## See

[KeypointDetector](../type-aliases/KeypointDetector.md)
