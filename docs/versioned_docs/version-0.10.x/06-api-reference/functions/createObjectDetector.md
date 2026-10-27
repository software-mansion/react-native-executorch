# Function: createObjectDetector()

> **createObjectDetector**\<`F`, `L`\>(`config`, `runtime?`): `Promise`\<[`ObjectDetector`](../type-aliases/ObjectDetector.md)\<`F`, `L`\>\>

Defined in: [extensions/cv/tasks/objectDetection.ts:141](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/objectDetection.ts#L141)

Creates an object detector runner for executing local Object Detection
models.

It validates the model inputs and outputs requirements, pre-allocates the
necessary static execution tensors (boxes, scores, classes), sets up an image
preprocessor, and registers clean disposal hooks to clear all native memory.

## Type Parameters

### F

`F` _extends_ `"xyxy"` \| `"xywh"` \| `"cxcywh"`

The bounding box format.

### L

`L`

The type representing the class labels.

## Parameters

### config

[`ObjectDetectorModel`](../type-aliases/ObjectDetectorModel.md)\<`F`, `L`\>

Object detector task configuration containing path and options.
See [ObjectDetectorModel](../type-aliases/ObjectDetectorModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run the model
execution.

## Returns

`Promise`\<[`ObjectDetector`](../type-aliases/ObjectDetector.md)\<`F`, `L`\>\>

A promise resolving to the instantiated [ObjectDetector](../type-aliases/ObjectDetector.md) runner.

## Throws

With code `LOAD_FAILED` if model fails to load,
or `SCHEMA_MISMATCH` if model schema does not match object detection spec.
