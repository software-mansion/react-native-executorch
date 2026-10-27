# Type Alias: KokoroTextToSpeech\<K\>

> **KokoroTextToSpeech**\<`K`\> = `object`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:151](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L151)

Kokoro text-to-speech task runner.

## Type Parameters

### K

`K` _extends_ `PropertyKey` = `string`

Voice keys record constraint.

## Properties

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:155](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L155)

Releases all allocated native resources.

#### Returns

`void`

---

### synthesize()

> `readonly` **synthesize**: (`text`, `options`) => `AsyncGenerator`\<[`KokoroTtsChunk`](KokoroTtsChunk.md)\>

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:166](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L166)

Streams synthesized audio chunks as an async generator as each text chunk finishes.

#### Parameters

##### text

`string`

Input text (or IPA phonemes) to synthesize into speech.

##### options

[`KokoroTtsOptions`](KokoroTtsOptions.md)\<`K`\>

Per-call execution options. See [KokoroTtsOptions](KokoroTtsOptions.md).

#### Returns

`AsyncGenerator`\<[`KokoroTtsChunk`](KokoroTtsChunk.md)\>

An AsyncGenerator yielding [KokoroTtsChunk](KokoroTtsChunk.md) audio buffers.

#### Throws

With code `INVALID_ARGUMENT` if the voice is unknown
or speed is out of range, `RESOURCE_BUSY` if the model is in use, or
`RESOURCE_DISPOSED` if disposed.

---

### synthesizeStop()

> `readonly` **synthesizeStop**: () => `void`

Defined in: [extensions/speech/tasks/kokoroTextToSpeech.ts:172](https://github.com/software-mansion/react-native-executorch/blob/182f231651acee34a84d33d6f9965acdd10c0767/packages/react-native-executorch/src/extensions/speech/tasks/kokoroTextToSpeech.ts#L172)

Cancels any in-flight synthesis started by [synthesize](#synthesize).

#### Returns

`void`
