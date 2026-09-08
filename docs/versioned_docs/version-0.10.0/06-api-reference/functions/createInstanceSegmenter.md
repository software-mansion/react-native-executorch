# Function: createInstanceSegmenter()

> **createInstanceSegmenter**\<`F`, `L`\>(`config`, `runtime?`): `Promise`\<[`InstanceSegmenter`](../type-aliases/InstanceSegmenter.md)\<`F`, `L`\>\>

Defined in: [extensions/cv/tasks/instanceSegmentation.ts:166](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/instanceSegmentation.ts#L166)

Creates an instance segmenter runner for executing local Instance
Segmentation models.

It validates model input/output tensor shapes and types, pre-allocates
execution and auxiliary tensors, sets up an image preprocessor, and returns
execution and resource management controls.

## Type Parameters

### F

`F` _extends_ `"xyxy"` \| `"xywh"` \| `"cxcywh"`

The bounding box format type.

### L

`L`

The label type.

## Parameters

### config

[`InstanceSegmenterModel`](../type-aliases/InstanceSegmenterModel.md)\<`F`, `L`\>

Model configuration containing path and options.
See [InstanceSegmenterModel](../type-aliases/InstanceSegmenterModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run the model
execution.

## Returns

`Promise`\<[`InstanceSegmenter`](../type-aliases/InstanceSegmenter.md)\<`F`, `L`\>\>

A promise resolving to the instantiated [InstanceSegmenter](../type-aliases/InstanceSegmenter.md) runner.

## Throws

With code `LOAD_FAILED` if model fails to load,
or `SCHEMA_MISMATCH` if model schema does not match instance segmentation
spec.
