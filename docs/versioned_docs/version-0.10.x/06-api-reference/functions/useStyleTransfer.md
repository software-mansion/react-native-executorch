# Function: useStyleTransfer()

> **useStyleTransfer**(`config`, `options?`): `object`

Defined in: [hooks/useStyleTransfer.ts:22](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useStyleTransfer.ts#L22)

React hook to load and run an image style transfer model.

This hook manages downloading (if remote URLs are provided) and loading the
model assets, compiling them, tracking download progress and load errors, and
releasing native memory when the component unmounts or the configuration
changes.

For imperative usage, see [createStyleTransfer](createStyleTransfer.md).

## Parameters

### config

[`StyleTransferModel`](../type-aliases/StyleTransferModel.md)

The style transfer model configuration.
See [StyleTransferModel](../type-aliases/StyleTransferModel.md).

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [StyleTransfer](../type-aliases/StyleTransfer.md) (without `dispose`),
combined with loading state and download progress.

### downloadProgress

> **downloadProgress**: `number`

### error

> **error**: `Error` \| `undefined`

### isReady

> **isReady**: `boolean` = `!!model`

### resource

> **resource**: [`StyleTransferModel`](../type-aliases/StyleTransferModel.md) \| `undefined`

### transferStyle

> **transferStyle**: (`input`) => `Promise`\<[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)\> \| `undefined` = `model.transferStyle`

### transferStyleWorklet

> **transferStyleWorklet**: (`input`) => [`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) \| `undefined` = `model.transferStyleWorklet`

## See

[StyleTransfer](../type-aliases/StyleTransfer.md)
