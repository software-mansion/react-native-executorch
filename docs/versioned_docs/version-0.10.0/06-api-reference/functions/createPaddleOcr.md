# Function: createPaddleOcr()

> **createPaddleOcr**(`config`, `runtime?`): `Promise`\<[`PaddleOcr`](../type-aliases/PaddleOcr.md)\>

Defined in: [extensions/cv/tasks/paddleOcr.ts:400](https://github.com/software-mansion/react-native-executorch/blob/3f13b59a1822638b61c565b9a47fd48a19c45551/packages/react-native-executorch/src/extensions/cv/tasks/paddleOcr.ts#L400)

Creates the PP-OCRv6 runner: one pass detects text quads on the whole page,
warps each to the recognizer canvas and reads it, returning the lines in
reading order.

## Parameters

### config

[`PaddleOcrModel`](../type-aliases/PaddleOcrModel.md)

PaddleOCR task configuration containing the model, charset,
and detection thresholds. See [PaddleOcrModel](../type-aliases/PaddleOcrModel.md).

### runtime?

`WorkletRuntime`

Optional worklet runtime thread on which to run detection and
recognition.

## Returns

`Promise`\<[`PaddleOcr`](../type-aliases/PaddleOcr.md)\>

A promise resolving to the instantiated [PaddleOcr](../type-aliases/PaddleOcr.md) runner.

## Throws

With code `LOAD_FAILED` if the model or charset
fails to load, `SCHEMA_MISMATCH` if the loaded model does not match the
PP-OCRv6 detect/recognize contract, or if the charset does not match the
recognizer's vocabulary.
