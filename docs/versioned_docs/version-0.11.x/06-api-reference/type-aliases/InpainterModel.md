# Type Alias: InpainterModel

> **InpainterModel** = `object`

Defined in: [extensions/cv/tasks/inpainting.ts:59](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/inpainting.ts#L59)

Model configuration required to instantiate an inpainting task runner.

## Properties

### modelOpts

> `readonly` **modelOpts**: [`InpainterOptions`](InpainterOptions.md)

Defined in: [extensions/cv/tasks/inpainting.ts:66](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/inpainting.ts#L66)

Input preprocessing, output postprocessing and blending options.
`resizeMode` is fixed to `'stretch'`. See [InpainterOptions](InpainterOptions.md).

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/cv/tasks/inpainting.ts:61](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/cv/tasks/inpainting.ts#L61)

Local path or remote URL of the `.pte` model file.
