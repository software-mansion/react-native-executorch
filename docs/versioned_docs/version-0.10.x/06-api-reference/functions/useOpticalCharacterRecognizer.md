# Function: useOpticalCharacterRecognizer()

> **useOpticalCharacterRecognizer**(`config`, `options?`): `object`

Defined in: [hooks/useOpticalCharacterRecognizer.ts:21](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/hooks/useOpticalCharacterRecognizer.ts#L21)

React hook for the PP-OCRv6 pipeline.

It downloads and loads the model, tracks progress and errors, instantiates the
task runner, and cleans up native memory on unmount or config change. Heavy
work runs on a worklet thread; `recognizeCharacters` resolves with the
recognized regions in reading order.

For imperative usage, see [createPaddleOcr](createPaddleOcr.md).

## Parameters

### config

[`PaddleOcrModel`](../type-aliases/PaddleOcrModel.md)

OCR model configuration. Use a preset from `models.ocr.*`.

### options?

[`ResourceOptions`](../type-aliases/ResourceOptions.md)

Load and caching options. See [ResourceOptions](../type-aliases/ResourceOptions.md).

## Returns

`object`

The same object as [PaddleOcr](../type-aliases/PaddleOcr.md) (without `dispose`),
combined with loading state, download progress, and resource info.

### downloadProgress

> **downloadProgress**: `number`

### error

> **error**: `Error` \| `undefined`

### isReady

> **isReady**: `boolean` = `!!model`

### recognizeCharacters

> **recognizeCharacters**: (`input`, `options?`) => `Promise`\<[`OcrDetection`](../type-aliases/OcrDetection.md)[]\> \| `undefined` = `model.recognizeCharacters`

### recognizeCharactersWorklet

> **recognizeCharactersWorklet**: (`input`, `options?`) => [`OcrDetection`](../type-aliases/OcrDetection.md)[] \| `undefined` = `model.recognizeCharactersWorklet`

### resource

> **resource**: [`PaddleOcrModel`](../type-aliases/PaddleOcrModel.md) \| `undefined`

## See

[PaddleOcr](../type-aliases/PaddleOcr.md)
