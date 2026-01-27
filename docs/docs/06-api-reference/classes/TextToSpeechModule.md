# Class: TextToSpeechModule

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TextToSpeechModule.ts:14](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L14)

Module for Text to Speech (TTS) functionalities.

## Constructors

### Constructor

> **new TextToSpeechModule**(): `TextToSpeechModule`

#### Returns

`TextToSpeechModule`

## Properties

### nativeModule

> **nativeModule**: `any` = `null`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TextToSpeechModule.ts:18](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L18)

Native module instance

## Methods

### delete()

> **delete**(): `void`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TextToSpeechModule.ts:164](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L164)

Unloads the model from memory.

#### Returns

`void`

***

### forward()

> **forward**(`text`, `speed`): `Promise`\<`any`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TextToSpeechModule.ts:97](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L97)

Synthesizes the provided text into speech. 
Returns a promise that resolves to the full audio waveform as a `Float32Array`.

#### Parameters

##### text

`string`

The input text to be synthesized.

##### speed

`number` = `1.0`

Optional speed multiplier for the speech synthesis (default is 1.0).

#### Returns

`Promise`\<`any`\>

A promise resolving to the synthesized audio waveform.

***

### load()

> **load**(`config`, `onDownloadProgressCallback`): `Promise`\<`void`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TextToSpeechModule.ts:27](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L27)

Loads the model and voice assets specified by the config object. 
`onDownloadProgressCallback` allows you to monitor the current progress.

#### Parameters

##### config

[`TextToSpeechConfig`](../interfaces/TextToSpeechConfig.md)

Configuration object containing `model` source, `voice` and optional `preventLoad`.

##### onDownloadProgressCallback

(`progress`) => `void`

Optional callback to monitor download progress.

#### Returns

`Promise`\<`void`\>

***

### stream()

> **stream**(`input`): `AsyncGenerator`\<`Float32Array`\<`ArrayBufferLike`\>, `void`, `unknown`\>

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TextToSpeechModule.ts:112](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L112)

Starts a streaming synthesis session. Yields audio chunks as they are generated.

#### Parameters

##### input

[`TextToSpeechStreamingInput`](../interfaces/TextToSpeechStreamingInput.md)

Input object containing text and optional speed.

#### Returns

`AsyncGenerator`\<`Float32Array`\<`ArrayBufferLike`\>, `void`, `unknown`\>

An async generator yielding Float32Array audio chunks.

***

### streamStop()

> **streamStop**(): `void`

Defined in: [packages/react-native-executorch/src/modules/natural\_language\_processing/TextToSpeechModule.ts:157](https://github.com/software-mansion/react-native-executorch/blob/81b229bbed784732fe329dbbff41e28b06bdb54d/packages/react-native-executorch/src/modules/natural_language_processing/TextToSpeechModule.ts#L157)

Stops the streaming process if there is any ongoing.

#### Returns

`void`
