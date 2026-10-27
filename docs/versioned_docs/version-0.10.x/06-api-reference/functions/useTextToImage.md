# Function: useTextToImage()

> **useTextToImage**(`config`, `options?`): `object`

Defined in: [hooks/useTextToImage.ts:24](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useTextToImage.ts#L24)

React hook to load and run an SDXS text-to-image synthesis model.

This hook manages downloading (if remote URLs are provided) and loading the
model assets and tokenizer files, tracking download progress and load errors,
and releasing native memory when the component unmounts or the configuration
changes.

For imperative usage, see [createSdxsTextToImage](createSdxsTextToImage.md).

## Parameters

### config

[`SdxsTextToImageModel`](../type-aliases/SdxsTextToImageModel.md)

The SDXS model configuration. See [SdxsTextToImageModel](../type-aliases/SdxsTextToImageModel.md).

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [SdxsTextToImage](../type-aliases/SdxsTextToImage.md) (without `dispose`),
combined with loading state and download progress.

### downloadProgress

> **downloadProgress**: `number`

### error

> **error**: `Error` \| `undefined`

### generate

> **generate**: (`prompt`, `seed?`) => `Promise`\<[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)\> \| `undefined` = `model.generate`

### generateWorklet

> **generateWorklet**: (`prompt`, `seed?`) => [`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) \| `undefined` = `model.generateWorklet`

### isReady

> **isReady**: `boolean` = `!!model`

### resource

> **resource**: [`SdxsTextToImageModel`](../type-aliases/SdxsTextToImageModel.md) \| `undefined`

## See

[SdxsTextToImage](../type-aliases/SdxsTextToImage.md)
