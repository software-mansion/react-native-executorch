# Type Alias: SemanticSegmentationResult\<L\>

> **SemanticSegmentationResult**\<`L`\> = `object`

Defined in: [extensions/cv/tasks/semanticSegmentation.ts:66](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/semanticSegmentation.ts#L66)

Result structure representing the output of a semantic segmentation task.

## Type Parameters

### L

`L` _extends_ `PropertyKey`

## Properties

### buffer

> `readonly` **buffer**: [`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

Defined in: [extensions/cv/tasks/semanticSegmentation.ts:68](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/semanticSegmentation.ts#L68)

Generated output RGBA image buffer containing the colored segmentation mask.

---

### colormap?

> `readonly` `optional` **colormap**: [`ColorMap`](ColorMap.md)\<`L`\>

Defined in: [extensions/cv/tasks/semanticSegmentation.ts:70](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/semanticSegmentation.ts#L70)

Applied color map mapping each class label to its RGBA tuple.
