---
title: Computer Vision models usage
description: Reference for using Image Classification, Image Segmentation, and Object Detection models.
---

# useClassification

**Purpose:** Classify images into predefined categories.

**Use cases:** Image recognition apps, content filtering, product categorization, accessibility features.

## Basic Usage

```typescript
import { useClassification, EFFICIENTNET_V2_S } from 'react-native-executorch';

const model = useClassification({ model: EFFICIENTNET_V2_S });

const imageUri = 'file:///Users/.../cute_puppy.png';

try {
  const classesWithProbabilities = await model.forward(imageUri);
  console.log(classesWithProbabilities);
} catch (error) {
  console.error(error);
}
```

## Processing Results

```typescript
import { useClassification, EFFICIENTNET_V2_S } from 'react-native-executorch';

function App() {
  const model = useClassification({ model: EFFICIENTNET_V2_S });

  // ...
  const imageUri = 'file:///Users/.../cute_puppy.png';

  try {
    const classesWithProbabilities = await model.forward(imageUri);

    // Extract three classes with the highest probabilities
    const topThreeClasses = Object.entries(classesWithProbabilities)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([label, score]) => ({ label, score }));
  } catch (error) {
    console.error(error);
  }
  // ...
}
```

## Available Models

**Model constant:** `EFFICIENTNET_V2_S`

For the latest available models reference exported models in [HuggingFace Classification collection](https://huggingface.co/collections/software-mansion/classification)

## Troubleshooting

**Confidence interpretation:** The class with the highest probability is typically assigned, but multiple high probabilities may indicate model uncertainty.
**Image formats:** Accepts remote URLs, local file URIs, and base64-encoded images. Remote images are stored in the app's temporary directory.

## Additional references

- [useClassification docs](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useClassification)
- [HuggingFace Classification collection](https://huggingface.co/collections/software-mansion/classification)
- [Available model constants](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---classification)
- [useClassification API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useClassification)
- [Typescript API implementation of segmentation](https://docs.swmansion.com/react-native-executorch/docs/typescript-api/computer-vision/ClassificationModule)

---

# useImageSegmentation

**Purpose:** Classify each pixel in an image to detect objects on a per-pixel basis.

**Use cases:** Object detection, image editing, scene understanding.

## Basic Usage

```typescript
import {
  useImageSegmentation,
  DEEPLAB_V3_RESNET50,
  DeeplabLabel,
} from 'react-native-executorch';

const model = useImageSegmentation({ model: DEEPLAB_V3_RESNET50 });

const imageUri = 'file:///Users/.../cute_cat.png';

try {
  const outputDict = await model.forward(imageUri);
  console.log(outputDict[DeeplabLabel.ARGMAX]);
} catch (error) {
  console.error(error);
}
```

## Advanced Usage with Classes of Interest

```typescript
const model = useImageSegmentation({ model: DEEPLAB_V3_RESNET50 });

const handleSegmentation = async (imageUri: string) => {
  try {
    const outputDict = await model.forward(
      imageUri,
      [DeeplabLabel.CAT, DeeplabLabel.DOG, DeeplabLabel.PERSON],
      true
    );

    const argmaxArray = outputDict[DeeplabLabel.ARGMAX];

    const catProbabilities = outputDict[DeeplabLabel.CAT];
    const dogProbabilities = outputDict[DeeplabLabel.DOG];
    const personProbabilities = outputDict[DeeplabLabel.PERSON];
    // ...
  } catch (error) {
    console.error(error);
  }
};
```

## Available Models

**Model constant:** `DEEPLAB_V3_RESNET50`

For the latest available models check out exported models in [this HuggingFace Segmentation collection](https://huggingface.co/collections/software-mansion/image-segmentation)

## Troubleshooting

**Performance:** Setting `resize=true` significantly increases processing time. Use `resize=false` for better performance when you don't need original image dimensions.
**Memory usage:** Resize increases memory usage, especially with high-resolution images.
**Pixel mapping:** When `resize=false`, pixel indices map to a 224x224 grid. When `resize=true`, indices map to original image dimensions.

## Additional references

- [useImageSegmentation docs](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useImageSegmentation)
- [useImageSegmentation API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useImageSegmentation)
- [HuggingFace Segmentation collection](https://huggingface.co/collections/software-mansion/image-segmentation)
- [Typescript API implementation of segmentation](https://docs.swmansion.com/react-native-executorch/docs/typescript-api/computer-vision/ImageSegmentationModule)

---

# useObjectDetection

**Purpose:** Identify and locate objects within images by providing bounding boxes, labels, and confidence scores.

**Use cases:** Object detection.

## Basic Usage

```typescript
import {
  useObjectDetection,
  SSDLITE_320_MOBILENET_V3_LARGE,
} from 'react-native-executorch';

const model = useObjectDetection({ model: SSDLITE_320_MOBILENET_V3_LARGE });

try {
  const detections = await model.forward('https://url-to-image.jpg');

  for (const detection of detections) {
    console.log('Bounding box:', detection.bbox);
    console.log('Label:', detection.label);
    console.log('Confidence:', detection.score);
  }
} catch (error) {
  console.error(error);
}
```

## Detection Object Structure

Each detection returned by `forward` has the following structure:

```typescript
interface Bbox {
  x1: number; // Bottom-left x coordinate
  y1: number; // Bottom-left y coordinate
  x2: number; // Top-right x coordinate
  y2: number; // Top-right y coordinate
}

interface Detection {
  bbox: Bbox;
  label: keyof typeof CocoLabels; // Object class name
  score: number; // Confidence score (0-1)
}
```

## Available Models

**Model constant:** `SSDLITE_320_MOBILENET_V3_LARGE`

For the latest available models reference exported models in [HuggingFace Object Detection collection](https://huggingface.co/collections/software-mansion/object-detection)

## Troubleshooting

**Multiple detections:** The model may detect the same object multiple times with slightly different bounding boxes. Consider implementing non-maximum suppression (NMS) if needed.
**Confidence thresholds:** Adjust the confidence threshold based on your use case. Higher thresholds (>0.7) reduce false positives but may miss objects.
**Coordinate system:** Bounding box coordinates are in pixel space relative to the input image dimensions.

## Additional references

- [useObjectDetection docs](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useObjectDetection)
- [HuggingFace Object Detection collection](https://huggingface.co/collections/software-mansion/object-detection)
- [Available model constants](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---object-detection)
- [useObjectDetection API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useObjectDetection)
- [Typescript API implementation of Object Detection](https://docs.swmansion.com/react-native-executorch/docs/typescript-api/computer-vision/ObjectDetectionModule)
