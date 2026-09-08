# Function: useObjectDetector()

> **useObjectDetector**\<`F`, `L`\>(`config`, `options?`): `object`

Defined in: [hooks/useObjectDetector.ts:28](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useObjectDetector.ts#L28)

React hook to load and run an object detection model.

This hook manages downloading (if remote URLs are provided) and loading the
model assets, compiling them, tracking download progress and load errors, and
releasing native memory when the component unmounts or the configuration
changes.

For imperative usage, see [createObjectDetector](createObjectDetector.md).

## Type Parameters

### F

`F` _extends_ `"xyxy"` \| `"xywh"` \| `"cxcywh"`

The bounding box format.

### L

`L`

The type representing the object class labels.

## Parameters

### config

[`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`F`, `L`\>

The object detection model configuration.
See [ObjectDetectorModel](../type-aliases/ObjectDetectorModel.md).

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [ObjectDetector](../type-aliases/ObjectDetector.md) (without `dispose`),
combined with loading state, download progress, and labels.

### detectObjects

> **detectObjects**: (`input`, `options?`) => `Promise`\<[`ObjectDetection`](../type-aliases/ObjectDetection.md)\<`F`, `L`\>[]\> \| `undefined` = `model.detectObjects`

### detectObjectsWorklet

> **detectObjectsWorklet**: (`input`, `options?`) => [`ObjectDetection`](../type-aliases/ObjectDetection.md)\<`F`, `L`\>[] \| `undefined` = `model.detectObjectsWorklet`

### downloadProgress

> **downloadProgress**: `number`

### error

> **error**: `Error` \| `undefined`

### isReady

> **isReady**: `boolean` = `!!model`

### labels

> **labels**: readonly `L`[] = `config.modelOpts.labels`

### resource

> **resource**: [`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`F`, `L`\> \| `undefined`

## See

[ObjectDetector](../type-aliases/ObjectDetector.md)
