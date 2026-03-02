---
title: OCR usage
description: Reference for using OCR and Vertical OCR.
---

# useOCR

**Purpose:** Detect and recognize horizontal text within images (Optical Character Recognition).

**Use cases:** Document scanning, receipt processing, business card reading, text extraction from photos.

## Basic Usage

```typescript
import { useOCR, OCR_ENGLISH } from 'react-native-executorch';

function App() {
  const model = useOCR({ model: OCR_ENGLISH });

  // ...
  for (const ocrDetection of await model.forward('https://url-to-image.jpg')) {
    console.log('Bounding box: ', ocrDetection.bbox);
    console.log('Bounding label: ', ocrDetection.text);
    console.log('Bounding score: ', ocrDetection.score);
  }
  // ...
}
```

## Understanding the Detection Object

```typescript
interface Point {
  x: number;
  y: number;
}

interface OCRDetection {
  bbox: Point[]; // 4 corner points of bounding box
  text: string; // Recognized text
  score: number; // Confidence score (0-1)
}
```

The `bbox` array contains four points representing the corners of the detected text region, allowing for rotated or skewed text detection.

## Language Support

Different recognizer models support different alphabets and languages:

```typescript
import {
  useOCR,
  OCR_ENGLISH,
  RECOGNIZER_LATIN_CRNN,
  RECOGNIZER_CYRILLIC_CRNN,
  DETECTOR_CRAFT,
} from 'react-native-executorch';

// For English (uses Latin alphabet)
const englishOCR = useOCR({ model: OCR_ENGLISH });

// For custom language configuration
const customOCR = useOCR({
  model: {
    detectorSource: DETECTOR_CRAFT,
    recognizerSource: RECOGNIZER_CYRILLIC_CRNN,
    language: 'ru', // Russian
  },
});
```

**Important:** The recognizer model must match the alphabet of your target language. For example, use `RECOGNIZER_LATIN_CRNN` for English, Polish, German, etc., and `RECOGNIZER_CYRILLIC_CRNN` for Russian, Ukrainian, etc.

## Available Models

For all supported alphabets and languages, see [OCR Supported Alphabets](https://docs.swmansion.com/react-native-executorch/docs/api-reference#ocr-supported-alphabets) and exported models in [HuggingFace OCR collection](https://huggingface.co/collections/software-mansion/ocr).

## Troubleshooting

**Text orientation:** This hook is designed for horizontal text. For vertical text (e.g., traditional Chinese/Japanese), use `useVerticalOCR`.
**Language/alphabet matching:** Ensure the recognizer model matches your target language's alphabet.
**Image quality:** Higher resolution and better contrast improve recognition accuracy.

## Additional references

- [useOCR docs](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useOCR)
- [HuggingFace OCR collection](https://huggingface.co/collections/software-mansion/ocr)
- [OCR Supported Alphabets](https://docs.swmansion.com/react-native-executorch/docs/api-reference#ocr-supported-alphabets)
- [useOCR API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useOCR)
- [Typescript API implementation of useOCR](https://docs.swmansion.com/react-native-executorch/docs/typescript-api/computer-vision/OCRModule)

---

# useVerticalOCR

**Purpose:** Detect and recognize vertical text within images (experimental).

**Use cases:** Traditional Chinese/Japanese text recognition, vertical signage, manga/comic text extraction.

## Basic Usage

```typescript
import { useVerticalOCR, OCR_ENGLISH } from 'react-native-executorch';

function App() {
  const model = useVerticalOCR({
    model: OCR_ENGLISH,
    independentCharacters: true,
  });

  // ...
  for (const ocrDetection of await model.forward('https://url-to-image.jpg')) {
    console.log('Bounding box: ', ocrDetection.bbox);
    console.log('Bounding label: ', ocrDetection.text);
    console.log('Bounding score: ', ocrDetection.score);
  }
  // ...
}
```

## Character vs Word Mode

The `independentCharacters` parameter controls how text is processed:

```typescript
// Character mode - each character detected separately (better for CJK)
const charMode = useVerticalOCR({
  model: OCR_CHINESE,
  independentCharacters: true,
});

// Word mode - characters grouped into words (better for Latin alphabets)
const wordMode = useVerticalOCR({
  model: OCR_ENGLISH,
  independentCharacters: false,
});
```

## Understanding the Detection Object

```typescript
interface Point {
  x: number;
  y: number;
}

interface OCRDetection {
  bbox: Point[]; // 4 corner points of bounding box
  text: string; // Recognized text
  score: number; // Confidence score (0-1)
}
```

## Available Models

For all supported alphabets and languages, see [OCR Supported Alphabets](https://docs.swmansion.com/react-native-executorch/docs/api-reference#ocr-supported-alphabets) and exported models in [HuggingFace OCR collection](https://huggingface.co/collections/software-mansion/ocr).

## Troubleshooting

**Experimental status:** This hook is experimental and may have limitations with certain text layouts or languages.
**Character vs word mode:** Use `independentCharacters: true` for CJK languages, `false` for Latin alphabets.
**Alphabet matching:** Ensure the recognizer matches your target language's alphabet.

## Additional references

- [useVerticalOCR docs](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useVerticalOCR)
- [HuggingFace OCR collection](https://huggingface.co/collections/software-mansion/ocr)
- [OCR Supported Alphabets](https://docs.swmansion.com/react-native-executorch/docs/api-reference#ocr-supported-alphabets)
- [useVerticalOCR API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useVerticalOCR)
- [Typescript API implementation of useVerticalOCR](https://docs.swmansion.com/react-native-executorch/docs/typescript-api/computer-vision/VerticalOCRModule)
