# Type Alias: SemanticSegmenter\<L\>

> **SemanticSegmenter**\<`L`\> = `object`

Defined in: [extensions/cv/tasks/semanticSegmentation.ts:78](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/semanticSegmentation.ts#L78)

Semantic segmentation task runner.

## Type Parameters

### L

`L` _extends_ `PropertyKey` = `string`

The type representing the segmentation labels.

## Properties

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/cv/tasks/semanticSegmentation.ts:82](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/semanticSegmentation.ts#L82)

Releases all allocated native resources.

#### Returns

`void`

---

### segment()

> `readonly` **segment**: (`input`, `colormap?`) => `Promise`\<[`SemanticSegmentationResult`](SemanticSegmentationResult.md)\<`L`\>\>

Defined in: [extensions/cv/tasks/semanticSegmentation.ts:107](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/semanticSegmentation.ts#L107)

Runs semantic segmentation asynchronously.

For models returning logits for all classes, this performs an argmax over
the class dimensions to identify the highest-probability class per pixel,
then maps each class index to an RGBA color from the colormap. The final
mapped colormap is returned in the result.

For models returning only a single logit value for the positive class, this
applies a sigmoid activation, normalizes the probability values to
grayscale (0-255), and converts the output to a grayscale RGBA mask. No
colormap is applied, and the colormap in the result is undefined.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

The input image buffer to segment.

##### colormap?

`Partial`\<[`ColorMap`](ColorMap.md)\<`L`\>\>

Optional partial color mapping overrides for labels
(applicable only for multi-class models). If not provided, a default
colormap is automatically generated with distinct, high-contrast colors
(with the first label defaulting to transparent). If a partial map is
provided, any labels omitted from it will default to being rendered as
fully transparent.

#### Returns

`Promise`\<[`SemanticSegmentationResult`](SemanticSegmentationResult.md)\<`L`\>\>

A promise resolving to the segmentation result.

#### Throws

With code `RESOURCE_BUSY` if the model is in
use, or `RESOURCE_DISPOSED` if disposed.

---

### segmentWorklet()

> `readonly` **segmentWorklet**: (`input`, `colormap?`) => [`SemanticSegmentationResult`](SemanticSegmentationResult.md)\<`L`\>

Defined in: [extensions/cv/tasks/semanticSegmentation.ts:116](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/semanticSegmentation.ts#L116)

Synchronous version of [segment](#segment) to be executed directly on the
caller or worklet thread.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

##### colormap?

`Partial`\<[`ColorMap`](ColorMap.md)\<`L`\>\>

#### Returns

[`SemanticSegmentationResult`](SemanticSegmentationResult.md)\<`L`\>
