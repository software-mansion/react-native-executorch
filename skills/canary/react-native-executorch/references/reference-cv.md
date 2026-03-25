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

**Model constants:** `EFFICIENTNET_V2_S`, `EFFICIENTNET_V2_S_QUANTIZED`

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

# useSemanticSegmentation

**Purpose:** Classify each pixel in an image to detect objects on a per-pixel basis.

**Use cases:** Object detection, image editing, scene understanding.

## Basic Usage

```typescript
import {
  useSemanticSegmentation,
  DEEPLAB_V3_RESNET50,
  DeeplabLabel,
} from 'react-native-executorch';

const model = useSemanticSegmentation({ model: DEEPLAB_V3_RESNET50 });

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
const model = useSemanticSegmentation({ model: DEEPLAB_V3_RESNET50 });

const handleSegmentation = async (imageUri: string) => {
  try {
    const outputDict = await model.forward(
      imageUri,
      ['CAT', 'DOG', 'PERSON'],
      true
    );

    const argmaxArray = outputDict['ARGMAX'];

    const catProbabilities = outputDict['CAT'];
    const dogProbabilities = outputDict['DOG'];
    const personProbabilities = outputDict['PERSON'];
    // ...
  } catch (error) {
    console.error(error);
  }
};
```

## Available Models

**Model constants:** `DEEPLAB_V3_RESNET50`, `DEEPLAB_V3_RESNET101`, `DEEPLAB_V3_MOBILENET_V3_LARGE`, `LRASPP_MOBILENET_V3_LARGE`, `FCN_RESNET50`, `FCN_RESNET101`, `SELFIE_SEGMENTATION` — plus quantized variants (e.g. `DEEPLAB_V3_RESNET50_QUANTIZED`)

For the latest available models check out exported models in [this HuggingFace Segmentation collection](https://huggingface.co/collections/software-mansion/image-segmentation)

## Troubleshooting

**Performance:** Setting `resizeToInput=true` significantly increases processing time. Use `resizeToInput=false` for better performance when you don't need original image dimensions.
**Memory usage:** `resizeToInput` increases memory usage, especially with high-resolution images.
**Pixel mapping:** When `resizeToInput=false`, pixel indices map to a 224x224 grid. When `resizeToInput=true`, indices map to original image dimensions.

## Additional references

- [useSemanticSegmentation docs](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useSemanticSegmentation)
- [useSemanticSegmentation API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useSemanticSegmentation)
- [HuggingFace Segmentation collection](https://huggingface.co/collections/software-mansion/image-segmentation)
- [Typescript API implementation of segmentation](https://docs.swmansion.com/react-native-executorch/docs/typescript-api/computer-vision/SemanticSegmentationModule)

---

# useObjectDetection

**Purpose:** Identify and locate objects within images by providing bounding boxes, labels, and confidence scores.

**Use cases:** Object detection.

## Basic Usage

```typescript
import { useObjectDetection, YOLO26N } from 'react-native-executorch';

const model = useObjectDetection({ model: YOLO26N });

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

## Detection Options

`forward` accepts an optional second argument to tune inference:

```typescript
const detections = await model.forward('https://url-to-image.jpg', {
  detectionThreshold: 0.5, // minimum confidence score (0-1)
  iouThreshold: 0.45, // NMS IoU threshold (0-1)
  inputSize: 640, // for YOLO multi-size models (e.g. 384, 512, 640)
  classesOfInterest: ['PERSON', 'CAR'], // filter to specific classes only
});
```

## Available Input Sizes (YOLO)

YOLO models support multiple input sizes. Use `getAvailableInputSizes()` to query them:

```typescript
const sizes = model.getAvailableInputSizes();
console.log(sizes); // e.g. [384, 512, 640]
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

interface Detection<L extends LabelEnum = typeof CocoLabel> {
  bbox: Bbox;
  label: keyof L; // Object class name, defaults to CocoLabel keys
  score: number; // Confidence score (0-1)
}
```

## Available Models

**Model constants:** `YOLO26N`, `YOLO26S`, `YOLO26M`, `YOLO26L`, `YOLO26X`, `RF_DETR_NANO`, `SSDLITE_320_MOBILENET_V3_LARGE`

For the latest available models reference exported models in [HuggingFace Object Detection collection](https://huggingface.co/collections/software-mansion/object-detection)

## Troubleshooting

**Multiple detections:** Use `iouThreshold` to tune NMS aggressiveness. Lower values merge more overlapping boxes.
**Confidence thresholds:** Adjust `detectionThreshold` based on your use case. Higher values (>0.7) reduce false positives but may miss objects.
**Coordinate system:** Bounding box coordinates are in pixel space relative to the input image dimensions.

## Additional references

- [useObjectDetection docs](https://docs.swmansion.com/react-native-executorch/docs/hooks/computer-vision/useObjectDetection)
- [HuggingFace Object Detection collection](https://huggingface.co/collections/software-mansion/object-detection)
- [Available model constants](https://docs.swmansion.com/react-native-executorch/docs/api-reference#models---object-detection)
- [useObjectDetection API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference/functions/useObjectDetection)
- [Typescript API implementation of Object Detection](https://docs.swmansion.com/react-native-executorch/docs/typescript-api/computer-vision/ObjectDetectionModule)
