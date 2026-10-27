# Function: useInpainter()

> **useInpainter**(`config`, `options?`): `object`

Defined in: [hooks/useInpainter.ts:22](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/hooks/useInpainter.ts#L22)

React hook to load and run an image inpainting model.

This hook manages downloading (if remote URLs are provided) and loading the
model assets, compiling them, tracking download progress and load errors, and
releasing native memory when the component unmounts or the configuration
changes.

For imperative usage, see [createInpainter](createInpainter.md).

## Parameters

### config

[`InpainterModel`](../type-aliases/InpainterModel.md)

The inpainting model configuration.
See [InpainterModel](../type-aliases/InpainterModel.md).

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [Inpainter](../type-aliases/Inpainter.md) (without `dispose`),
combined with loading state and download progress.

### downloadProgress

> **downloadProgress**: `number`

### error

> **error**: `Error` \| `undefined`

### inpaint

> **inpaint**: (`image`, `mask`) => `Promise`\<[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)\> \| `undefined` = `model.inpaint`

### inpaintWorklet

> **inpaintWorklet**: (`image`, `mask`) => [`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md) \| `undefined` = `model.inpaintWorklet`

### isReady

> **isReady**: `boolean` = `!!model`

### resource

> **resource**: [`InpainterModel`](../type-aliases/InpainterModel.md) \| `undefined`

## See

[Inpainter](../type-aliases/Inpainter.md)
