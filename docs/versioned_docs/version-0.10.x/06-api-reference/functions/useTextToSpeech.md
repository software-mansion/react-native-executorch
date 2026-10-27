# Function: useTextToSpeech()

## Call Signature

> **useTextToSpeech**\<`K`\>(`config`, `options?`): `object`

Defined in: [hooks/useTextToSpeech.ts:31](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useTextToSpeech.ts#L31)

React hook to load and run the Kokoro Text-to-Speech pipeline.

This hook manages downloading (if remote URLs are provided) and loading the
model assets, phonemizer files, and voice style vectors, tracking download
progress and load errors, and releasing native memory when the component
unmounts or the configuration changes.

For imperative usage, see [createKokoroTextToSpeech](createKokoroTextToSpeech.md).

### Type Parameters

#### K

`K` _extends_ `PropertyKey`

Voice keys record constraint.

### Parameters

#### config

[`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`K`\>

The Kokoro TTS model configuration. See [KokoroTtsModel](../type-aliases/KokoroTtsModel.md).

#### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

### Returns

The same object as [KokoroTextToSpeech](../type-aliases/KokoroTextToSpeech.md) (without `dispose`),
combined with loading state and download progress.

#### downloadProgress

> **downloadProgress**: `number`

Download progress across every asset, in percent.

#### error

> **error**: `Error` \| `undefined`

The download or load error, if any.

#### isReady

> **isReady**: `boolean`

Whether the pipeline is loaded and ready to synthesize.

#### resource

> **resource**: [`KokoroTtsModel`](../type-aliases/KokoroTtsModel.md)\<`K`\> \| `undefined`

The config with every remote URL resolved to a local path.

#### synthesize

> **synthesize**: (`text`, `options`) => `AsyncGenerator`\<[`KokoroTtsChunk`](../type-aliases/KokoroTtsChunk.md)\> \| `undefined`

Streams synthesized audio chunks. Undefined until the pipeline is ready.

#### synthesizeStop

> **synthesizeStop**: () => `void` \| `undefined`

Cancels an in-flight synthesis. Undefined until the pipeline is ready.

### See

[KokoroTextToSpeech](../type-aliases/KokoroTextToSpeech.md)

## Call Signature

> **useTextToSpeech**\<`K`\>(`config`, `options?`): `object`

Defined in: [hooks/useTextToSpeech.ts:67](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useTextToSpeech.ts#L67)

React hook to load and run the Supertonic 3 Text-to-Speech pipeline.

This hook manages downloading (if remote URLs are provided) and loading the
model assets, indexer files, and voice style vectors, tracking download
progress and load errors, and releasing native memory when the component
unmounts or the configuration changes.

For imperative usage, see [createSupertonicTextToSpeech](createSupertonicTextToSpeech.md).

### Type Parameters

#### K

`K` _extends_ `PropertyKey`

Voice style keys record constraint.

### Parameters

#### config

[`SupertonicTtsModel`](../type-aliases/SupertonicTtsModel.md)\<`K`\>

The Supertonic TTS model configuration.
See [SupertonicTtsModel](../type-aliases/SupertonicTtsModel.md).

#### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

### Returns

The same object as [SupertonicTextToSpeech](../type-aliases/SupertonicTextToSpeech.md) (without `dispose`),
combined with loading state and download progress.

#### downloadProgress

> **downloadProgress**: `number`

Download progress across every asset, in percent.

#### error

> **error**: `Error` \| `undefined`

The download or load error, if any.

#### isReady

> **isReady**: `boolean`

Whether the pipeline is loaded and ready to synthesize.

#### resource

> **resource**: [`SupertonicTtsModel`](../type-aliases/SupertonicTtsModel.md)\<`K`\> \| `undefined`

The config with every remote URL resolved to a local path.

#### synthesize

> **synthesize**: (`text`, `options`) => `AsyncGenerator`\<[`SupertonicTtsChunk`](../type-aliases/SupertonicTtsChunk.md)\> \| `undefined`

Streams synthesized audio chunks. Undefined until the pipeline is ready.

#### synthesizeStop

> **synthesizeStop**: () => `void` \| `undefined`

Cancels an in-flight synthesis. Undefined until the pipeline is ready.

### See

[SupertonicTextToSpeech](../type-aliases/SupertonicTextToSpeech.md)
