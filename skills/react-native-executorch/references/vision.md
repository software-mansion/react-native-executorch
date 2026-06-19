# Vision

Image understanding and transformation: classification, object detection, semantic / instance segmentation, pose estimation, OCR, style transfer, text-to-image generation, and image / text embeddings.

All models are selected through the typed `models` registry: `models.<category>.<model>({ quant?, backend? })`. Calling with no args returns the platform default (CoreML on iOS / XNNPACK on Android for multi-backend models, quantized variant when published). Passing a backend a model doesn't ship is a compile-time error.

Every hook accepts image input as one of: a remote URL (`https://…`), a local file URI (`file://…`), a base64 string, or — for bundled assets — `require('../assets/img.jpg')`. Remote images are cached automatically.

---

## Image classification — `useClassification`

```tsx
import { useClassification, models } from 'react-native-executorch';

const model = useClassification({
  model: models.classification.efficientnet_v2_s(),
});

const labels = await model.forward('https://example.com/puppy.png');
// labels: Record<string, number> — ImageNet1k label → probability

const topThree = Object.entries(labels)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 3);
```

For the full ImageNet1k label set, import `Imagenet1kLabel`.

---

## Object detection — `useObjectDetection`

```tsx
import { useObjectDetection, models } from 'react-native-executorch';

const model = useObjectDetection({ model: models.object_detection.yolo26n() });

const detections = await model.forward('https://example.com/street.jpg', {
  detectionThreshold: 0.5, // minimum confidence (0–1)
  iouThreshold: 0.45, // NMS aggressiveness (0–1)
  inputSize: 640, // for multi-size YOLO models (384 / 512 / 640)
  classesOfInterest: ['PERSON', 'CAR'], // filter
});

for (const d of detections) {
  console.log(d.bbox, d.label, d.score);
}
```

`forward` returns `Detection[]` with `{ bbox: { x1, y1, x2, y2 }, label, score }`. Coordinates are pixel-space relative to the input image.

YOLO models support multiple input sizes — call `model.getAvailableInputSizes()` to enumerate them.

**Available accessors:** `models.object_detection.yolo26n` / `yolo26s` / `yolo26m` / `yolo26l` / `yolo26x`, `models.object_detection.rf_detr_nano`, `models.object_detection.ssdlite_320_mobilenet_v3_large`.

---

## Semantic segmentation — `useSemanticSegmentation`

Pixel-level classification.

```tsx
import {
  useSemanticSegmentation,
  models,
  DeeplabLabel,
} from 'react-native-executorch';

const model = useSemanticSegmentation({
  model: models.semantic_segmentation.deeplab_v3_resnet50(),
});

// Pass classesOfInterest + resizeToInput to also get per-class probability maps
const out = await model.forward(imageUri, ['CAT', 'DOG', 'PERSON'], true);
const argmax = out[DeeplabLabel.ARGMAX]; // class id per pixel
const catProbs = out['CAT']; // probability per pixel
```

**Tradeoff:** `resizeToInput: true` upsamples to the original image size — more memory and slower. With `false`, indices map to a 224×224 grid.

**Available accessors:** `models.semantic_segmentation.deeplab_v3_resnet50` / `deeplab_v3_resnet101` / `deeplab_v3_mobilenet_v3_large` / `lraspp_mobilenet_v3_large` / `fcn_resnet50` / `fcn_resnet101` / `selfie_segmentation`.

---

## Instance segmentation — `useInstanceSegmentation`

Per-instance masks (one mask per detected object).

```tsx
import { useInstanceSegmentation, models } from 'react-native-executorch';

const model = useInstanceSegmentation({
  model: models.instance_segmentation.yolo26n(),
});

const instances = await model.forward('https://example.com/street.jpg');
// instances: { bbox, label, score, mask }[]
```

**Available accessors:** `models.instance_segmentation.yolo26n` … `yolo26x`, `rf_detr_nano`, `fastsam_s`, `fastsam_x`.

---

## Pose estimation — `usePoseEstimation`

Detects humans and their COCO 17-keypoint skeletons (nose, eyes, ears, shoulders, elbows, wrists, hips, knees, ankles).

```tsx
import {
  usePoseEstimation,
  models,
  CocoKeypoint,
} from 'react-native-executorch';

const model = usePoseEstimation({ model: models.pose_estimation.yolo26n() });

const poses = await model.forward('https://example.com/person.jpg');
// poses: { bbox, score, keypoints: { x, y, confidence }[] }[]

for (const pose of poses) {
  const nose = pose.keypoints[CocoKeypoint.NOSE];
  console.log('Nose at', nose.x, nose.y, 'conf', nose.confidence);
}
```

Use the `CocoKeypoint` enum to index into `keypoints` by name.

---

## OCR — `useOCR` and `useVerticalOCR`

The OCR pipeline ships a CRAFT detector plus per-alphabet CRNN recognizers. Pick one with a language code via `models.ocr.craft({ language })`.

```tsx
import { useOCR, models } from 'react-native-executorch';

const ocr = useOCR({ model: models.ocr.craft({ language: 'en' }) });

const detections = await ocr.forward('https://example.com/receipt.jpg');
for (const d of detections) {
  console.log(d.text, d.score, d.bbox); // bbox = 4-point polygon
}
```

`OCRDetection`:

```ts
interface OCRDetection {
  bbox: { x: number; y: number }[]; // 4 corner points (supports rotated/skewed text)
  text: string;
  score: number; // 0–1
}
```

**Vertical / CJK text** — use `useVerticalOCR` with `independentCharacters: true`:

```tsx
import { useVerticalOCR, models } from 'react-native-executorch';

const ocr = useVerticalOCR({
  model: models.ocr.craft({ language: 'ch_sim' }),
  independentCharacters: true, // recommended for CJK; set false for vertical Latin
});

const detections = await ocr.forward(imageUri);
```

**Alphabet matching matters.** Latin and Cyrillic share a detector but use different recognizers. Pass the language code that matches the script you want to read. Unsupported languages throw `LanguageNotSupported`. Full alphabet support list: webfetch [OCR Supported Alphabets](https://docs.swmansion.com/react-native-executorch/docs/api-reference#ocr-supported-alphabets).

---

## Style transfer — `useStyleTransfer`

Apply one of four pre-trained artistic styles to an image.

```tsx
import { useStyleTransfer, models } from 'react-native-executorch';

const model = useStyleTransfer({ model: models.style_transfer.candy() });

// Default: returns PixelData (raw RGB buffer)
const pixelData = await model.forward(imageUri);

// Pass 'url' as second arg to get a file URI back
const styledUri = await model.forward(imageUri, 'url');
```

**Available accessors:** `models.style_transfer.candy` / `mosaic` / `rain_princess` / `udnie`.

Generated images are written to the app's temporary directory. Expect a few seconds of inference per image.

---

## Text-to-image — `useTextToImage`

On-device Stable Diffusion (BK-SDM tiny).

```tsx
import { useTextToImage, models } from 'react-native-executorch';

const model = useTextToImage({
  model: models.image_generation.bk_sdm_tiny_vpred_256(),
});

const image = await model.forward('a medieval castle by the sea', 256, 25);
// image: base64 PNG. Render with <Image source={{ uri: `data:image/png;base64,${image}` }} />
```

Signature: `generate(prompt, imageSize?, numSteps?)`. Image size must be a multiple of 32. Expect 20–60 s per image depending on device, size, and step count. Use `bk_sdm_tiny_vpred_256` on lower-end devices; `bk_sdm_tiny_vpred_512` on high-end devices.

---

## Image embeddings — `useImageEmbeddings`

CLIP-based image vectors for similarity / search. Pair with `useTextEmbeddings` (using the CLIP text encoder) for cross-modal retrieval.

```tsx
import { useImageEmbeddings, models } from 'react-native-executorch';

const model = useImageEmbeddings({
  model: models.image_embedding.clip_vit_base_patch32_image(),
});

const v1 = await model.forward(imageUri1); // Float32Array
const v2 = await model.forward(imageUri2);

// Returned vectors are L2-normalized — cosine similarity = dot product
const sim = v1.reduce((s, x, i) => s + x * v2[i], 0);
```

Images are auto-resized to 224 × 224.

---

## Text embeddings — `useTextEmbeddings`

Sentence-level embeddings for semantic search, similarity, clustering, or RAG. Listed under vision because the CLIP text encoder is the cross-modal pair to image embeddings.

```tsx
import { useTextEmbeddings, models } from 'react-native-executorch';

const model = useTextEmbeddings({
  model: models.text_embedding.all_minilm_l6_v2(),
});

const v1 = await model.forward('Hello world');
const v2 = await model.forward('Greetings everyone');
const cosine = v1.reduce((s, x, i) => s + x * v2[i], 0); // pre-normalized
```

| Accessor                                                      | Max tokens | Dim | Use case                          |
| ------------------------------------------------------------- | ---------- | --- | --------------------------------- |
| `models.text_embedding.all_minilm_l6_v2`                      | 254        | 384 | General purpose                   |
| `models.text_embedding.all_mpnet_base_v2`                     | 382        | 768 | Higher quality, slower            |
| `models.text_embedding.multi_qa_minilm_l6_cos_v1`             | 509        | 384 | Q&A / semantic search             |
| `models.text_embedding.multi_qa_mpnet_base_dot_v1`            | 510        | 768 | Q&A / semantic search             |
| `models.text_embedding.distiluse_base_multilingual_cased_v2`  | 128        | 512 | Multilingual                      |
| `models.text_embedding.paraphrase_multilingual_minilm_l12_v2` | 128        | 384 | Multilingual paraphrase           |
| `models.text_embedding.clip_vit_base_patch32_text`            | 74         | 512 | Pair with image embeddings (CLIP) |

Text exceeding `Max tokens` is truncated. Use `useTokenizer` (see [setup.md](./setup.md)) to count first.

**Building a full RAG pipeline?** Don't roll your own — use [react-native-rag](https://github.com/software-mansion-labs/react-native-rag) (sibling library). It wraps `useTextEmbeddings` + `useLLM` with `ExecuTorchEmbeddings` / `ExecuTorchLLM`, ships a `MemoryVectorStore` + an op-sqlite persistence plugin, and exposes a `useRAG` hook. See [setup.md](./setup.md) for an end-to-end example.

---

## Troubleshooting

- **`MemoryAllocationFailed` at load.** Step down to a smaller accessor (e.g. `yolo26n` instead of `yolo26x`) or pass `{ quant: true }` if a quantized variant is published.
- **`LanguageNotSupported` from OCR.** The requested language has no published CRAFT/CRNN recognizer pair. Use `'en'` for Latin or the relevant ISO code for the script you need.
- **Style transfer or text-to-image is slow.** Both are compute-heavy; show a progress indicator. For text-to-image, lower `numSteps` and use the 256 model on mid-range devices.
- **Image embeddings cosine similarity outside [-1, 1].** Vectors are pre-normalized — the dot product is already the cosine. If you see anomalies, verify you're not double-normalizing.

---

## See also

- [API reference](https://docs.swmansion.com/react-native-executorch/docs/api-reference) — per-hook signatures
- [HuggingFace collections](https://huggingface.co/software-mansion) — pre-exported model artefacts
- [setup.md](./setup.md) — loading strategies, error handling, custom `.pte` models
