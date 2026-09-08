# Type Alias: StyleTransferModel

> **StyleTransferModel** = `object`

Defined in: [extensions/cv/tasks/styleTransfer.ts:42](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/styleTransfer.ts#L42)

Model configuration required to instantiate a style transfer task runner.

## Properties

### modelOpts

> `readonly` **modelOpts**: [`StyleTransferOptions`](StyleTransferOptions.md)

Defined in: [extensions/cv/tasks/styleTransfer.ts:50](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/styleTransfer.ts#L50)

Input preprocessing and output postprocessing (normalization back to uint8,
interpolation). `resizeMode` is fixed to `'stretch'`.
See [StyleTransferOptions](StyleTransferOptions.md).

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/cv/tasks/styleTransfer.ts:44](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/styleTransfer.ts#L44)

Local path or remote URL of the `.pte` model file.
