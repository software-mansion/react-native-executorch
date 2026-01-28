# Interface: OCRDetection

Defined in: [packages/react-native-executorch/src/types/ocr.ts:13](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/ocr.ts#L13)

OCRDetection represents a single detected text instance in an image,
including its bounding box, recognized text, and confidence score.

## Properties

### bbox

> **bbox**: [`Point`](Point.md)[]

Defined in: [packages/react-native-executorch/src/types/ocr.ts:14](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/ocr.ts#L14)

An array of points defining the bounding box around the detected text.

***

### score

> **score**: `number`

Defined in: [packages/react-native-executorch/src/types/ocr.ts:16](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/ocr.ts#L16)

The confidence score of the OCR detection, ranging from 0 to 1.

***

### text

> **text**: `string`

Defined in: [packages/react-native-executorch/src/types/ocr.ts:15](https://github.com/software-mansion/react-native-executorch/blob/a8b0a412aa07c92692caf0b31a2b58a5f754121c/packages/react-native-executorch/src/types/ocr.ts#L15)

The recognized text within the bounding box.
