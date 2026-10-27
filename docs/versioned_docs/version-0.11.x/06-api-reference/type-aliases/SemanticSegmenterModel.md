# Type Alias: SemanticSegmenterModel\<L\>

> **SemanticSegmenterModel**\<`L`\> = `object`

Defined in: [extensions/cv/tasks/semanticSegmentation.ts:45](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/semanticSegmentation.ts#L45)

Model configuration required to instantiate a segmenter task runner.

## Type Parameters

### L

`L`

## Properties

### modelOpts

> `readonly` **modelOpts**: [`SemanticSegmenterOptions`](SemanticSegmenterOptions.md)\<`L`\>

Defined in: [extensions/cv/tasks/semanticSegmentation.ts:53](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/semanticSegmentation.ts#L53)

Image preprocessing, output mask interpolation, and label vocabulary.
`resizeMode` is fixed to `'stretch'`.
See [SemanticSegmenterOptions](SemanticSegmenterOptions.md).

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/cv/tasks/semanticSegmentation.ts:47](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/semanticSegmentation.ts#L47)

Local path or remote URL of the `.pte` model file.
