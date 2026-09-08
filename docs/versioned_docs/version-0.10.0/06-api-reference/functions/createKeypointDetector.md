# Function: createKeypointDetector()

> **createKeypointDetector**\<`F`, `L`\>(`config`, `runtime?`): `Promise`\<[`KeypointDetector`](../type-aliases/KeypointDetector.md)\<`F`, `L`\>\>

Defined in: [extensions/cv/tasks/keypointDetection.ts:227](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/keypointDetection.ts#L227)

Creates an image keypoint detector runner for executing local Keypoint/Pose
Detection models.

It validates model inputs and output shapes (bounding boxes, confidence
scores, and landmark coordinates), pre-allocates execution tensors, setups
preprocessing, and sets up lifecycle disposals.

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

Keypoint task configuration containing path and options.
See [KeypointDetectorModel](../type-aliases/KeypointDetectorModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run the model
execution.

## Returns

`Promise`\<[`KeypointDetector`](../type-aliases/KeypointDetector.md)\<`F`, `L`\>\>

A promise resolving to the instantiated [KeypointDetector](../type-aliases/KeypointDetector.md) runner.

## Throws

With code `LOAD_FAILED` if model fails to load,
or `SCHEMA_MISMATCH` if model schema does not match keypoint detection spec.
