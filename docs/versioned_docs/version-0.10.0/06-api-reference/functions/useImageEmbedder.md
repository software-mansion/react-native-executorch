# Function: useImageEmbedder()

> **useImageEmbedder**(`config`, `options?`): `object`

Defined in: [hooks/useImageEmbedder.ts:25](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useImageEmbedder.ts#L25)

React hook to load and run an image embedding model.

This hook manages downloading (if remote URLs are provided) and loading the
model assets, compiling them, tracking download progress and load errors, and
releasing native memory when the component unmounts or the configuration
changes.

For imperative usage, see [createImageEmbedder](createImageEmbedder.md).

## Parameters

### config

[`ImageEmbedderModel`](../type-aliases/ImageEmbedderModel.md)

The image embedder model configuration.
See [ImageEmbedderModel](../type-aliases/ImageEmbedderModel.md).

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [ImageEmbedder](../type-aliases/ImageEmbedder.md) (without `dispose`),
combined with loading state and download progress.

### downloadProgress

> **downloadProgress**: `number`

### embed

> **embed**: (`input`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\> \| `undefined` = `model.embed`

### embedWorklet

> **embedWorklet**: (`input`) => `Float32Array` \| `undefined` = `model.embedWorklet`

### error

> **error**: `Error` \| `undefined`

### isReady

> **isReady**: `boolean` = `!!model`

### resource

> **resource**: [`ImageEmbedderModel`](../type-aliases/ImageEmbedderModel.md) \| `undefined`

## See

[ImageEmbedder](../type-aliases/ImageEmbedder.md)
