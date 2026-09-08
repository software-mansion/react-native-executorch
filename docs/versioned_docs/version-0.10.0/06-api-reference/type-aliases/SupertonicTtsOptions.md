# Type Alias: SupertonicTtsOptions\<K\>

> **SupertonicTtsOptions**\<`K`\> = `object`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:99](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L99)

Per-call execution options for Supertonic Text-to-Speech synthesis.

## Type Parameters

### K

`K` _extends_ `PropertyKey`

Voice style keys record constraint.

## Properties

### lang?

> `readonly` `optional` **lang**: [`SupertonicLanguage`](../react-native-executorch/namespaces/speech/type-aliases/SupertonicLanguage.md)

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:110](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L110)

Language ISO code (e.g. 'en', 'ko', 'es', 'na').

---

### maxChunkLength?

> `readonly` `optional` **maxChunkLength**: `number`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:112](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L112)

Maximum character limit per text chunk.

---

### speed?

> `readonly` `optional` **speed**: `number`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:106](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L106)

Speech speed factor (range: 0.8 to 1.2).

---

### totalSteps?

> `readonly` `optional` **totalSteps**: `number`

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:108](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L108)

Number of flow-matching denoising steps.

---

### voiceStyle

> `readonly` **voiceStyle**: `K` \| [`SupertonicVoiceStyle`](../react-native-executorch/namespaces/speech/type-aliases/SupertonicVoiceStyle.md)

Defined in: [extensions/speech/tasks/supertonicTextToSpeech.ts:104](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/speech/tasks/supertonicTextToSpeech.ts#L104)

Voice style key matching one of the keys in `config.voiceStyles`, or a raw
[SupertonicVoiceStyle](../react-native-executorch/namespaces/speech/type-aliases/SupertonicVoiceStyle.md) object.
