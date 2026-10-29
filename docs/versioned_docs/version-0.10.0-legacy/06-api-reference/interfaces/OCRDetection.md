# Interface: OCRDetection

Defined in: [types/ocr.ts:14](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/ocr.ts#L14)

OCRDetection represents a single detected text instance in an image,
including its bounding box, recognized text, and confidence score.

## Properties

### bbox

> **bbox**: [`Bbox`](Bbox.md)

Defined in: [types/ocr.ts:15](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/ocr.ts#L15)

The axis-aligned bounding box around the detected text, with `x1`/`y1` as the top-left corner and `x2`/`y2` as the bottom-right corner.

---

### score

> **score**: `number`

Defined in: [types/ocr.ts:17](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/ocr.ts#L17)

The confidence score of the OCR detection, ranging from 0 to 1.

---

### text

> **text**: `string`

Defined in: [types/ocr.ts:16](https://github.com/software-mansion/react-native-executorch/blob/0e95b8934cc7318c1b30a8e534444a8b50d25230/packages/react-native-executorch/src/types/ocr.ts#L16)

The recognized text within the bounding box.
