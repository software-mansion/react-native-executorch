# Function: useColbertEmbedder()

> **useColbertEmbedder**(`config`, `options?`): `object`

Defined in: [hooks/useColbertEmbedder.ts:25](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/hooks/useColbertEmbedder.ts#L25)

React hook to load and run a late-interaction (ColBERT) embedding model.

This hook manages downloading (if remote URLs are provided) and loading the
model assets and tokenizer files, tracking download progress and load errors,
and releasing native memory when the component unmounts or the configuration
changes.

For imperative usage, see [createColbertEmbedder](createColbertEmbedder.md).

## Parameters

### config

[`ColbertEmbedderModel`](../type-aliases/ColbertEmbedderModel.md)

The ColBERT embedder model configuration.
See [ColbertEmbedderModel](../type-aliases/ColbertEmbedderModel.md).

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [ColbertEmbedder](../type-aliases/ColbertEmbedder.md) (without `dispose`),
combined with loading state and download progress.

### downloadProgress

> **downloadProgress**: `number`

### embed

> **embed**: (`input`, `kind`) => `Promise`\<[`ColbertTokenEmbeddings`](../type-aliases/ColbertTokenEmbeddings.md)\> \| `undefined` = `model.embed`

### embedWorklet

> **embedWorklet**: (`input`, `kind`) => [`ColbertTokenEmbeddings`](../type-aliases/ColbertTokenEmbeddings.md) \| `undefined` = `model.embedWorklet`

### error

> **error**: `Error` \| `undefined`

### isReady

> **isReady**: `boolean` = `!!model`

### maxSim

> **maxSim**: (`query`, `document`) => `number` \| `undefined` = `model.maxSim`

### resource

> **resource**: [`ColbertEmbedderModel`](../type-aliases/ColbertEmbedderModel.md) \| `undefined`

## See

[ColbertEmbedder](../type-aliases/ColbertEmbedder.md)
