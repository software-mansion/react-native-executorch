# Type Alias: ImageEmbedderModel

> **ImageEmbedderModel** = `object`

Defined in: [extensions/cv/tasks/imageEmbedding.ts:20](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/imageEmbedding.ts#L20)

Model configuration required to instantiate an image embedder task runner.

## Properties

### modelOpts

> `readonly` **modelOpts**: [`ImagePreprocessorOptions`](../react-native-executorch/namespaces/cv/type-aliases/ImagePreprocessorOptions.md)

Defined in: [extensions/cv/tasks/imageEmbedding.ts:28](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/imageEmbedding.ts#L28)

Image preprocessing (resize, color conversion, normalization) for embedding
models.
See [ImagePreprocessorOptions](../react-native-executorch/namespaces/cv/type-aliases/ImagePreprocessorOptions.md).

---

### modelPath

> `readonly` **modelPath**: `string`

Defined in: [extensions/cv/tasks/imageEmbedding.ts:22](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/imageEmbedding.ts#L22)

Local path or remote URL of the `.pte` model file.
