# Interface: OCRDetection

Defined in: [packages/react-native-executorch/src/types/ocr.ts:14](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/types/ocr.ts#L14)

OCRDetection represents a single detected text instance in an image,
including its bounding box, recognized text, and confidence score.

## Properties

### bbox

> **bbox**: [`Point`](Point.md)[]

Defined in: [packages/react-native-executorch/src/types/ocr.ts:15](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/types/ocr.ts#L15)

An array of points defining the bounding box around the detected text.

***

### score

> **score**: `number`

Defined in: [packages/react-native-executorch/src/types/ocr.ts:17](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/types/ocr.ts#L17)

The confidence score of the OCR detection, ranging from 0 to 1.

***

### text

> **text**: `string`

Defined in: [packages/react-native-executorch/src/types/ocr.ts:16](https://github.com/software-mansion/react-native-executorch/blob/fb8c4994a25bab9bbad2c87a565a246cf0b7c346/packages/react-native-executorch/src/types/ocr.ts#L16)

The recognized text within the bounding box.
