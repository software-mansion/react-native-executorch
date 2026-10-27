# Function: useSpeechToText()

> **useSpeechToText**\<`L`\>(`config`, `options?`): `object`

Defined in: [hooks/useSpeechToText.ts:26](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useSpeechToText.ts#L26)

React hook to load and run a Whisper speech-to-text (ASR) model.

This hook manages downloading (if remote URLs are provided) and loading the
model assets, tokenizer, and voice activity detector, tracking download
progress and load errors, and releasing native memory when the component
unmounts or the configuration changes.

For imperative usage, see [createWhisperSpeechToText](createWhisperSpeechToText.md).

## Type Parameters

### L

`L` _extends_ `"en"` \| `"zh"` \| `"de"` \| `"es"` \| `"ru"` \| `"ko"` \| `"fr"` \| `"ja"` \| `"pt"` \| `"tr"` \| `"pl"` \| `"ca"` \| `"nl"` \| `"ar"` \| `"sv"` \| `"it"` \| `"id"` \| `"hi"` \| `"fi"` \| `"vi"` \| `"he"` \| `"uk"` \| `"el"` \| `"ms"` \| `"cs"` \| `"ro"` \| `"da"` \| `"hu"` \| `"ta"` \| `"no"` \| `"th"` \| `"ur"` \| `"hr"` \| `"bg"` \| `"lt"` \| `"la"` \| `"mi"` \| `"ml"` \| `"cy"` \| `"sk"` \| `"te"` \| `"fa"` \| `"lv"` \| `"bn"` \| `"sr"` \| `"az"` \| `"sl"` \| `"kn"` \| `"et"` \| `"mk"` \| `"br"` \| `"eu"` \| `"is"` \| `"hy"` \| `"ne"` \| `"mn"` \| `"bs"` \| `"kk"` \| `"sq"` \| `"sw"` \| `"gl"` \| `"mr"` \| `"pa"` \| `"si"` \| `"km"` \| `"sn"` \| `"yo"` \| `"so"` \| `"af"` \| `"oc"` \| `"ka"` \| `"be"` \| `"tg"` \| `"sd"` \| `"gu"` \| `"am"` \| `"yi"` \| `"lo"` \| `"uz"` \| `"fo"` \| `"ht"` \| `"ps"` \| `"tk"` \| `"nn"` \| `"mt"` \| `"sa"` \| `"lb"` \| `"my"` \| `"bo"` \| `"tl"` \| `"mg"` \| `"as"` \| `"tt"` \| `"haw"` \| `"ln"` \| `"ha"` \| `"ba"` \| `"jw"` \| `"su"` \| `"yue"` = `"en"` \| `"zh"` \| `"de"` \| `"es"` \| `"ru"` \| `"ko"` \| `"fr"` \| `"ja"` \| `"pt"` \| `"tr"` \| `"pl"` \| `"ca"` \| `"nl"` \| `"ar"` \| `"sv"` \| `"it"` \| `"id"` \| `"hi"` \| `"fi"` \| `"vi"` \| `"he"` \| `"uk"` \| `"el"` \| `"ms"` \| `"cs"` \| `"ro"` \| `"da"` \| `"hu"` \| `"ta"` \| `"no"` \| `"th"` \| `"ur"` \| `"hr"` \| `"bg"` \| `"lt"` \| `"la"` \| `"mi"` \| `"ml"` \| `"cy"` \| `"sk"` \| `"te"` \| `"fa"` \| `"lv"` \| `"bn"` \| `"sr"` \| `"az"` \| `"sl"` \| `"kn"` \| `"et"` \| `"mk"` \| `"br"` \| `"eu"` \| `"is"` \| `"hy"` \| `"ne"` \| `"mn"` \| `"bs"` \| `"kk"` \| `"sq"` \| `"sw"` \| `"gl"` \| `"mr"` \| `"pa"` \| `"si"` \| `"km"` \| `"sn"` \| `"yo"` \| `"so"` \| `"af"` \| `"oc"` \| `"ka"` \| `"be"` \| `"tg"` \| `"sd"` \| `"gu"` \| `"am"` \| `"yi"` \| `"lo"` \| `"uz"` \| `"fo"` \| `"ht"` \| `"ps"` \| `"tk"` \| `"nn"` \| `"mt"` \| `"sa"` \| `"lb"` \| `"my"` \| `"bo"` \| `"tl"` \| `"mg"` \| `"as"` \| `"tt"` \| `"haw"` \| `"ln"` \| `"ha"` \| `"ba"` \| `"jw"` \| `"su"` \| `"yue"`

## Parameters

### config

[`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`L`\>

The Whisper speech-to-text model configuration.
See [WhisperSttModel](../type-aliases/WhisperSttModel.md).

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [WhisperSpeechToText](../type-aliases/WhisperSpeechToText.md) (without `dispose`),
combined with loading state and download progress.

### downloadProgress

> **downloadProgress**: `number`

### error

> **error**: `Error` \| `undefined`

### isReady

> **isReady**: `boolean` = `!!model`

### resource

> **resource**: [`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`L`\> \| `undefined`

### stream

> **stream**: (`options`) => `AsyncGenerator`\<\{ `committed`: `string`; `nonCommitted`: `string`; \}\> \| `undefined` = `model.stream`

### streamInsert

> **streamInsert**: (`audioChunk`) => `void` \| `undefined` = `model.streamInsert`

### streamStop

> **streamStop**: () => `void` \| `undefined` = `model.streamStop`

### transcribe

> **transcribe**: (`audio`, `options`, `onToken?`) => `Promise`\<`string`\> \| `undefined` = `model.transcribe`

### transcribeStop

> **transcribeStop**: () => `void` \| `undefined` = `model.transcribeStop`

### transcribeWorklet

> **transcribeWorklet**: (`audio`, `options`, `onToken?`) => `string` \| `undefined` = `model.transcribeWorklet`

## See

[WhisperSpeechToText](../type-aliases/WhisperSpeechToText.md)
