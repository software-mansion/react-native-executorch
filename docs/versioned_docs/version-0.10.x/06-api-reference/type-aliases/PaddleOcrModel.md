# Type Alias: PaddleOcrModel

> **PaddleOcrModel** = `object`

Defined in: [extensions/cv/tasks/paddleOcr.ts:91](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L91)

Model configuration for the PP-OCRv6 pipeline: one fused detect/recognize PTE,
the charset published beside it, and the run options.

## Properties

### charsetPath

> `readonly` **charsetPath**: `string`

Defined in: [extensions/cv/tasks/paddleOcr.ts:99](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L99)

The recognizer charset published beside the model: a JSON array of strings,
one per class, where `charset[i]` labels logit `i + 1` (logit 0 is the CTC
blank). Resolved to a local path by the resource fetcher like `modelPath`.

---

### modelOpts

> `readonly` **modelOpts**: [`PaddleOcrModelOptions`](PaddleOcrModelOptions.md)

Defined in: [extensions/cv/tasks/paddleOcr.ts:101](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L101)

Run options. See [PaddleOcrModelOptions](PaddleOcrModelOptions.md).

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/cv/tasks/paddleOcr.ts:93](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L93)

The fused detect/recognize PTE. Resolved to a local path by the fetcher.
