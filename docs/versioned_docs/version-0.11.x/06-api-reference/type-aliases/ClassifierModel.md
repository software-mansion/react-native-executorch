# Type Alias: ClassifierModel\<L\>

> **ClassifierModel**\<`L`\> = `object`

Defined in: [extensions/cv/tasks/classification.ts:33](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/classification.ts#L33)

Model configuration required to instantiate a classifier task runner.

## Type Parameters

### L

`L`

## Properties

### modelOpts

> `readonly` **modelOpts**: [`ClassifierOptions`](ClassifierOptions.md)\<`L`\>

Defined in: [extensions/cv/tasks/classification.ts:41](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/classification.ts#L41)

Image preprocessing and label vocabulary. The `labels` array length must
match the model's output dimension.
See [ClassifierOptions](ClassifierOptions.md).

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/cv/tasks/classification.ts:35](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/classification.ts#L35)

Local path or remote URL of the `.pte` model file.
