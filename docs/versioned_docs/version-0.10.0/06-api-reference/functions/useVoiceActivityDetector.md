# Function: useVoiceActivityDetector()

> **useVoiceActivityDetector**(`config`, `options?`): `object`

Defined in: [hooks/useVoiceActivityDetector.ts:24](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useVoiceActivityDetector.ts#L24)

React hook to load and run a Voice Activity Detection (VAD) model.

This hook manages downloading (if remote URLs are provided) and loading the
model assets, compiling them, tracking download progress and load errors, and
releasing native memory when the component unmounts or the configuration
changes.

For imperative usage, see [createFsmnVoiceActivityDetector](createFsmnVoiceActivityDetector.md).

## Parameters

### config

[`FsmnVadModel`](../type-aliases/FsmnVadModel.md)

The VAD model configuration. See [FsmnVadModel](../type-aliases/FsmnVadModel.md).

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [FsmnVoiceActivityDetector](../type-aliases/FsmnVoiceActivityDetector.md) (without `dispose`),
combined with loading state and download progress.

### detectVoice

> **detectVoice**: (`waveform`, `options?`) => `Promise`\<[`VadSegment`](../type-aliases/VadSegment.md)[]\> \| `undefined` = `model.detectVoice`

### detectVoiceOnStream

> **detectVoiceOnStream**: (`chunk`, `options?`) => [`VadEvent`](../type-aliases/VadEvent.md) \| `undefined` \| `undefined` = `model.detectVoiceOnStream`

### detectVoiceWorklet

> **detectVoiceWorklet**: (`waveform`, `options?`) => [`VadSegment`](../type-aliases/VadSegment.md)[] \| `undefined` = `model.detectVoiceWorklet`

### downloadProgress

> **downloadProgress**: `number`

### error

> **error**: `Error` \| `undefined`

### isReady

> **isReady**: `boolean` = `!!model`

### resetStream

> **resetStream**: () => `void` \| `undefined` = `model.resetStream`

### resource

> **resource**: [`FsmnVadModel`](../type-aliases/FsmnVadModel.md) \| `undefined`

## See

[FsmnVoiceActivityDetector](../type-aliases/FsmnVoiceActivityDetector.md)
