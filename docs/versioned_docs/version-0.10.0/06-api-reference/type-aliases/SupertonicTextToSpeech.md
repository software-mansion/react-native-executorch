# Type Alias: SupertonicTextToSpeech\<K\>

> **SupertonicTextToSpeech**\<`K`\> = `object`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:137](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L137)

Supertonic text-to-speech task runner.

## Type Parameters

### K

`K` _extends_ `PropertyKey` = `string`

Voice style keys record constraint.

## Properties

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:139](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L139)

Releases all allocated native models and static execution tensors.

#### Returns

`void`

---

### synthesize()

> `readonly` **synthesize**: (`text`, `options`) => `AsyncGenerator`\<[`SupertonicTtsChunk`](SupertonicTtsChunk.md)\>

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:153](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L153)

Streams synthesized audio chunks as an async generator as each text chunk
finishes.

#### Parameters

##### text

`string`

Input text string to synthesize into speech.

##### options

[`SupertonicTtsOptions`](SupertonicTtsOptions.md)\<`K`\>

Per-call execution options.
See [SupertonicTtsOptions](SupertonicTtsOptions.md).

#### Returns

`AsyncGenerator`\<[`SupertonicTtsChunk`](SupertonicTtsChunk.md)\>

An AsyncGenerator yielding [SupertonicTtsChunk](SupertonicTtsChunk.md) audio
buffers.

#### Throws

With code `INVALID_ARGUMENT` if voice style is
invalid or language is unsupported, `RESOURCE_BUSY` if the model is in use,
or `RESOURCE_DISPOSED` if disposed.

---

### synthesizeStop()

> `readonly` **synthesizeStop**: () => `void`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:159](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L159)

Cancels any in-flight synthesis started by [synthesize](#synthesize).

#### Returns

`void`
