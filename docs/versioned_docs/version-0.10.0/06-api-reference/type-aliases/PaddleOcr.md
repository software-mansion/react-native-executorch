# Type Alias: PaddleOcr

> **PaddleOcr** = `object`

Defined in: [extensions/cv/tasks/paddleOcr.ts:108](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L108)

PP-OCRv6 optical character recognition task runner.

## Properties

### dispose()

> `readonly` **dispose**: () => `void`

Defined in: [extensions/cv/tasks/paddleOcr.ts:112](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L112)

Releases all allocated native resources.

#### Returns

`void`

---

### recognizeCharacters()

> `readonly` **recognizeCharacters**: (`input`, `options?`) => `Promise`\<[`OcrDetection`](OcrDetection.md)[]\>

Defined in: [extensions/cv/tasks/paddleOcr.ts:121](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L121)

Detects and recognizes every text line in the given image.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

The input image buffer.

##### options?

[`RecognizeCharactersOptions`](RecognizeCharactersOptions.md)

Per-call overrides. See [RecognizeCharactersOptions](RecognizeCharactersOptions.md).

#### Returns

`Promise`\<[`OcrDetection`](OcrDetection.md)[]\>

A promise resolving to the recognized lines in reading order
(leftmost column top to bottom, then the next column).

---

### recognizeCharactersWorklet()

> `readonly` **recognizeCharactersWorklet**: (`input`, `options?`) => [`OcrDetection`](OcrDetection.md)[]

Defined in: [extensions/cv/tasks/paddleOcr.ts:130](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L130)

Synchronous version of [recognizeCharacters](#recognizecharacters) to be executed directly
on the caller or worklet thread.

#### Parameters

##### input

[`ImageBuffer`](../react-native-executorch/namespaces/cv/type-aliases/ImageBuffer.md)

##### options?

[`RecognizeCharactersOptions`](RecognizeCharactersOptions.md)

#### Returns

[`OcrDetection`](OcrDetection.md)[]
