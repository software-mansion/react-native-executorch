# Function: useTextEmbedder()

> **useTextEmbedder**(`config`, `options?`): `object`

Defined in: [hooks/useTextEmbedder.ts:22](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useTextEmbedder.ts#L22)

React hook to load and run a text embedding model.

This hook manages downloading (if remote URLs are provided) and loading the
model assets and tokenizer files, tracking download progress and load errors,
and releasing native memory when the component unmounts or the configuration
changes.

For imperative usage, see [createTextEmbedder](createTextEmbedder.md).

## Parameters

### config

[`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md)

The text embedder model configuration.
See [TextEmbedderModel](../type-aliases/TextEmbedderModel.md).

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [TextEmbedder](../type-aliases/TextEmbedder.md) (without `dispose`),
combined with loading state and download progress.

### downloadProgress

> **downloadProgress**: `number`

### embed

> **embed**: (`input`, `prompt?`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\> \| `undefined` = `model.embed`

### embedWorklet

> **embedWorklet**: (`input`, `prompt?`) => `Float32Array` \| `undefined` = `model.embedWorklet`

### error

> **error**: `Error` \| `undefined`

### isReady

> **isReady**: `boolean` = `!!model`

### resource

> **resource**: [`TextEmbedderModel`](../type-aliases/TextEmbedderModel.md) \| `undefined`

## See

[TextEmbedder](../type-aliases/TextEmbedder.md)
