---
title: Segment Anything with FastSAM
---

[FastSAM](https://github.com/CASIA-IVA-Lab/FastSAM) is a class-agnostic, promptable segmentation model. Unlike YOLO or RF-DETR (which return labelled detections), FastSAM segments **every** instance in an image without classifying them — you then pick the one you want with a point, box, or text prompt.

`FASTSAM_S` and `FASTSAM_X` are loaded with the regular [`useInstanceSegmentation`](./useInstanceSegmentation.md) hook. `react-native-executorch` ships three small selector utilities to pick an instance from the hook's output: `selectByPoint`, `selectByBox`, and `selectByText`.

## API Reference

- [`selectByPoint` API Reference](../../06-api-reference/functions/selectByPoint.md)
- [`selectByBox` API Reference](../../06-api-reference/functions/selectByBox.md)
- [`selectByText` API Reference](../../06-api-reference/functions/selectByText.md)

## High Level Overview

The workflow has three steps:

1. Load `FASTSAM_S` (or `FASTSAM_X`) with `useInstanceSegmentation`.
2. Run `forward(image)` once — the result is every detected instance.
3. Use a selector to pick the one matching the user's prompt. Re-run a selector when the prompt changes; you don't need to call `forward` again.

```typescript
import {
  useInstanceSegmentation,
  selectByPoint,
  selectByBox,
  selectByText,
  FASTSAM_S,
} from 'react-native-executorch';

const model = useInstanceSegmentation({ model: FASTSAM_S });

try {
  const instances = await model.forward(imageUri);

  // Point: the smallest instance whose mask covers (x, y).
  const a = selectByPoint(instances, x, y);
  console.log('point match:', a?.bbox);

  // Box: the instance with highest IoU with the prompt box.
  const b = selectByBox(instances, { x1, y1, x2, y2 });
  console.log('box match:', b?.bbox);

  // Text: highest cosine similarity between text and per-instance image
  // embeddings (you must provide the embeddings, e.g. with CLIP).
  const c = selectByText(instances, instanceEmbeddings, textEmbedding);
  console.log('text match:', c?.bbox);
} catch (error) {
  console.error(error);
}
```

The hook output is typed as [`SegmentedInstance<typeof FastSAMLabel>`](../../06-api-reference/interfaces/SegmentedInstance.md). FastSAM emits a single label, [`FastSAMLabel.OBJECT`](../../06-api-reference/enumerations/FastSAMLabel.md) (`'OBJECT' = 0`).

## Selecting by point

`selectByPoint` returns the instance whose mask covers the point `(x, y)`. When several instances overlap (e.g. a small object inside a larger one), the one with the smallest bounding box wins; ties are broken by confidence. Returns `null` if no mask covers the point.

It accepts three arguments:

- `instances` (required) - The array of [`SegmentedInstance`](../../06-api-reference/interfaces/SegmentedInstance.md) returned by `forward()`.
- `x` (required) - X coordinate of the prompt point, in the **original image's** pixel space.
- `y` (required) - Y coordinate of the prompt point, in the **original image's** pixel space.

:::info
`returnMaskAtOriginalResolution: true` (the default) is required for `selectByPoint` — masks must be in original image coordinates so they align with the touch coordinates passed in.
:::

## Selecting by box

`selectByBox` returns the instance with the highest IoU with the prompt box. Useful for "draw a box around what you want" UX. Returns `null` if no instance overlaps.

It accepts two arguments:

- `instances` (required) - The array of [`SegmentedInstance`](../../06-api-reference/interfaces/SegmentedInstance.md) returned by `forward()`.
- `box` (required) - A [`Bbox`](../../06-api-reference/interfaces/Bbox.md) (`{ x1, y1, x2, y2 }`) in the original image's pixel space.

## Selecting by text

`selectByText` returns the instance whose image embedding has the highest cosine similarity with the text embedding. The caller produces the embeddings — typically by cropping each instance's bbox and running [CLIP](./useImageEmbeddings.md) image encoder, plus running the [CLIP text encoder](../01-natural-language-processing/useTextEmbeddings.md) on the prompt.

It accepts three arguments:

- `instances` (required) - The array of [`SegmentedInstance`](../../06-api-reference/interfaces/SegmentedInstance.md) returned by `forward()`.
- `instanceEmbeddings` (required) - One `Float32Array` per instance, in the same order as `instances`. Throws if lengths differ.
- `textEmbedding` (required) - A `Float32Array` for the text prompt.

Embeddings do not need to be pre-normalized. Returns `null` only when `instances` is empty.

### Example with CLIP

```typescript
import {
  useInstanceSegmentation,
  useImageEmbeddings,
  useTextEmbeddings,
  selectByText,
  FASTSAM_S,
  CLIP_VIT_BASE_PATCH32_IMAGE_QUANTIZED,
  CLIP_VIT_BASE_PATCH32_TEXT,
} from 'react-native-executorch';

function App() {
  const sam = useInstanceSegmentation({ model: FASTSAM_S });
  const clipImage = useImageEmbeddings({
    model: CLIP_VIT_BASE_PATCH32_IMAGE_QUANTIZED,
  });
  const clipText = useTextEmbeddings({ model: CLIP_VIT_BASE_PATCH32_TEXT });

  const handlePrompt = async (imageUri: string, prompt: string) => {
    if (!sam.isReady || !clipImage.isReady || !clipText.isReady) return;

    try {
      const instances = await sam.forward(imageUri);

      // Embed each instance's bbox crop. Cropping is your responsibility —
      // any image manipulator (e.g. expo-image-manipulator) works.
      const instanceEmbeddings = await Promise.all(
        instances.map((inst) =>
          clipImage.forward(cropToBbox(imageUri, inst.bbox))
        )
      );

      const textEmb = await clipText.forward(prompt);
      const match = selectByText(instances, instanceEmbeddings, textEmb);
      console.log('match:', match?.bbox, match?.score);
    } catch (error) {
      console.error(error);
    }
  };

  // ...
}
```

:::tip
Embedding all instances is the slow part of text prompts (one CLIP forward per instance). Cache `instanceEmbeddings` and reuse them across multiple text queries on the same image; only invalidate when you call `sam.forward` again.
:::

## Example app

The [`computer-vision`](https://github.com/software-mansion/react-native-executorch/tree/main/apps/computer-vision/app/segment_anything) example contains a working "Segment Anything" screen with all three prompt modes wired up.
