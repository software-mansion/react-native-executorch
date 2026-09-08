# Function: createWhisperSpeechToText()

> **createWhisperSpeechToText**\<`L`\>(`config`, `runtime?`): `Promise`\<[`WhisperSpeechToText`](../type-aliases/WhisperSpeechToText.md)\<`L`\>\>

Defined in: [extensions/speech/tasks/whisperSpeechToText.ts:194](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/whisperSpeechToText.ts#L194)

Loads a Whisper model and returns a set of transcription helpers.

## Type Parameters

### L

`L` _extends_ `"en"` \| `"zh"` \| `"de"` \| `"es"` \| `"ru"` \| `"ko"` \| `"fr"` \| `"ja"` \| `"pt"` \| `"tr"` \| `"pl"` \| `"ca"` \| `"nl"` \| `"ar"` \| `"sv"` \| `"it"` \| `"id"` \| `"hi"` \| `"fi"` \| `"vi"` \| `"he"` \| `"uk"` \| `"el"` \| `"ms"` \| `"cs"` \| `"ro"` \| `"da"` \| `"hu"` \| `"ta"` \| `"no"` \| `"th"` \| `"ur"` \| `"hr"` \| `"bg"` \| `"lt"` \| `"la"` \| `"mi"` \| `"ml"` \| `"cy"` \| `"sk"` \| `"te"` \| `"fa"` \| `"lv"` \| `"bn"` \| `"sr"` \| `"az"` \| `"sl"` \| `"kn"` \| `"et"` \| `"mk"` \| `"br"` \| `"eu"` \| `"is"` \| `"hy"` \| `"ne"` \| `"mn"` \| `"bs"` \| `"kk"` \| `"sq"` \| `"sw"` \| `"gl"` \| `"mr"` \| `"pa"` \| `"si"` \| `"km"` \| `"sn"` \| `"yo"` \| `"so"` \| `"af"` \| `"oc"` \| `"ka"` \| `"be"` \| `"tg"` \| `"sd"` \| `"gu"` \| `"am"` \| `"yi"` \| `"lo"` \| `"uz"` \| `"fo"` \| `"ht"` \| `"ps"` \| `"tk"` \| `"nn"` \| `"mt"` \| `"sa"` \| `"lb"` \| `"my"` \| `"bo"` \| `"tl"` \| `"mg"` \| `"as"` \| `"tt"` \| `"haw"` \| `"ln"` \| `"ha"` \| `"ba"` \| `"jw"` \| `"su"` \| `"yue"` = `"en"` \| `"zh"` \| `"de"` \| `"es"` \| `"ru"` \| `"ko"` \| `"fr"` \| `"ja"` \| `"pt"` \| `"tr"` \| `"pl"` \| `"ca"` \| `"nl"` \| `"ar"` \| `"sv"` \| `"it"` \| `"id"` \| `"hi"` \| `"fi"` \| `"vi"` \| `"he"` \| `"uk"` \| `"el"` \| `"ms"` \| `"cs"` \| `"ro"` \| `"da"` \| `"hu"` \| `"ta"` \| `"no"` \| `"th"` \| `"ur"` \| `"hr"` \| `"bg"` \| `"lt"` \| `"la"` \| `"mi"` \| `"ml"` \| `"cy"` \| `"sk"` \| `"te"` \| `"fa"` \| `"lv"` \| `"bn"` \| `"sr"` \| `"az"` \| `"sl"` \| `"kn"` \| `"et"` \| `"mk"` \| `"br"` \| `"eu"` \| `"is"` \| `"hy"` \| `"ne"` \| `"mn"` \| `"bs"` \| `"kk"` \| `"sq"` \| `"sw"` \| `"gl"` \| `"mr"` \| `"pa"` \| `"si"` \| `"km"` \| `"sn"` \| `"yo"` \| `"so"` \| `"af"` \| `"oc"` \| `"ka"` \| `"be"` \| `"tg"` \| `"sd"` \| `"gu"` \| `"am"` \| `"yi"` \| `"lo"` \| `"uz"` \| `"fo"` \| `"ht"` \| `"ps"` \| `"tk"` \| `"nn"` \| `"mt"` \| `"sa"` \| `"lb"` \| `"my"` \| `"bo"` \| `"tl"` \| `"mg"` \| `"as"` \| `"tt"` \| `"haw"` \| `"ln"` \| `"ha"` \| `"ba"` \| `"jw"` \| `"su"` \| `"yue"`

Supported language codes constraint.

## Parameters

### config

[`WhisperSttModel`](../type-aliases/WhisperSttModel.md)\<`L`\>

Model paths, supported-language metadata, and VAD
configuration.
See [WhisperSttModel](../type-aliases/WhisperSttModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run the model
execution.

## Returns

`Promise`\<[`WhisperSpeechToText`](../type-aliases/WhisperSpeechToText.md)\<`L`\>\>

A promise resolving to the instantiated [WhisperSpeechToText](../type-aliases/WhisperSpeechToText.md)
runner.

## Throws

With code `LOAD_FAILED` if the model, tokenizer,
or VAD fails to load, or `SCHEMA_MISMATCH` if model schemas do not match the
Whisper specification.
