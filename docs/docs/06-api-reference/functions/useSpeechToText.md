# Function: useSpeechToText()

> **useSpeechToText**(`speechToTextConfiguration`): `object`

Defined in: [packages/react-native-executorch/src/hooks/natural_language_processing/useSpeechToText.ts:12](https://github.com/software-mansion/react-native-executorch/blob/cf09248d1b9fa5a88d8413f22ade5e99a246be08/packages/react-native-executorch/src/hooks/natural_language_processing/useSpeechToText.ts#L12)

## Parameters

### speechToTextConfiguration

Configuration object containing `model` source and optional `preventLoad` flag.

#### model

[`SpeechToTextModelConfig`](../interfaces/SpeechToTextModelConfig.md)

Object containing:

`isMultilingual` - A boolean flag indicating whether the model supports multiple languages.

`encoderSource` - A string that specifies the location of a `.pte` file for the encoder.

`decoderSource` - A string that specifies the location of a `.pte` file for the decoder.

`tokenizerSource` - A string that specifies the location to the tokenizer for the model.

#### preventLoad?

`boolean` = `false`

Boolean that can prevent automatic model loading (and downloading the data if you load it for the first time) after running the hook.

## Returns

Ready to use Speech to Text model.

### committedTranscription

> **committedTranscription**: `string`

Contains the part of the transcription that is finalized and will not change. Useful for displaying stable results during streaming.

### decode()

> **decode**: (...`args`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Runs the decoder of the model. Passing `number[]` is deprecated.

#### Parameters

##### args

...\[`number`[] \| `Int32Array`\<`ArrayBufferLike`\>, `number`[] \| `Float32Array`\<`ArrayBufferLike`\>\]

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

### downloadProgress

> **downloadProgress**: `number`

Tracks the progress of the model download process.

### encode()

> **encode**: (...`args`) => `Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

Runs the encoding part of the model on the provided waveform. Passing `number[]` is deprecated.

#### Parameters

##### args

...\[`number`[] \| `Float32Array`\<`ArrayBufferLike`\>\]

#### Returns

`Promise`\<`Float32Array`\<`ArrayBufferLike`\>\>

### error

> **error**: [`RnExecutorchError`](../classes/RnExecutorchError.md) \| `null`

Contains the error message if the model failed to load.

### isGenerating

> **isGenerating**: `boolean`

Indicates whether the model is currently processing an inference.

### isReady

> **isReady**: `boolean`

Indicates whether the model has successfully loaded and is ready for inference.

### nonCommittedTranscription

> **nonCommittedTranscription**: `string`

Contains the part of the transcription that is still being processed and may change. Useful for displaying live, partial results during streaming.

### stream()

> **stream**: (`options?`) => `Promise`\<`string`\>

Starts a streaming transcription process. Use in combination with `streamInsert` to feed audio chunks and `streamStop` to end the stream. The argument is an options object, e.g. `{ language: 'es' }` for multilingual models. Updates `committedTranscription` and `nonCommittedTranscription` as transcription progresses.

#### Parameters

##### options?

[`DecodingOptions`](../interfaces/DecodingOptions.md)

Decoding options including language.

#### Returns

`Promise`\<`string`\>

### streamInsert()

> **streamInsert**: (...`args`) => `void`

Inserts a chunk of audio data (sampled at 16kHz) into the ongoing streaming transcription. Call this repeatedly as new audio data becomes available. Passing `number[]` is deprecated.

#### Parameters

##### args

...\[`number`[] \| `Float32Array`\<`ArrayBufferLike`\>\]

#### Returns

`void`

### streamStop()

> **streamStop**: (...`args`) => `void`

Stops the ongoing streaming transcription process.

#### Parameters

##### args

...\[\]

#### Returns

`void`

### transcribe()

> **transcribe**: (...`args`) => `Promise`\<`string`\>

Starts a transcription process for a given input array, which should be a waveform at 16kHz. The second argument is an options object, e.g. `{ language: 'es' }` for multilingual models. Resolves a promise with the output transcription when the model is finished. Passing `number[]` is deprecated.

#### Parameters

##### args

...\[`number`[] \| `Float32Array`\<`ArrayBufferLike`\>, [`DecodingOptions`](../interfaces/DecodingOptions.md)\]

#### Returns

`Promise`\<`string`\>
