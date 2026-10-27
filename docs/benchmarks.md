# Benchmarks

These benchmarks measure model variants directly on physical iOS and Android hardware. Coverage varies by task, model variant, and device; each chart shows the measurements available for its selected model. We profile the complete end-to-end pipeline—from camera frames, audio, and text through pre-processing, forward inference on mobile silicon, and post-processing—alongside isolated ExecuTorch runtime latency, peak RAM, cold-start load times, and binary download sizes.

### Backends and Precision[​](#backends-and-precision "Direct link to Backends and Precision")

Each variant is defined by two choices:

* **Backend (Where it runs):** The hardware execution engine. **XNNPACK** runs on mobile CPUs for universal compatibility across iOS and Android; **Core ML** targets the Apple Neural Engine (NPU) and GPU on iOS; **Vulkan** runs on Android GPUs; and **MLX** uses Apple Silicon unified memory. To configure which backends are compiled into your app, see [Native Libraries](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/native-libraries.md).
* **Precision (How weights are stored):** The numerical format of model weights. Full precision (`fp32`) preserves original fidelity at the cost of larger downloads and RAM. Reduced precision (`fp16`) and integer quantization (`int8`, `4-bit`) reduce weight storage and memory use and can speed up computation; evaluate accuracy for your task. See [Exporting Custom Models](https://docs.swmansion.com/react-native-executorch/docs/core-and-advanced/exporting-custom-models.md) for lowering details.

Explore the charts below to compare backends and find the optimal balance for your app.

## Devices[​](#devices "Direct link to Devices")

Measurements were collected on physical iOS and Android devices spanning flagship, modern mid-tier, and legacy hardware tiers. All numbers come from release builds of React Native ExecuTorch 0.11.0-dev (`main` shortly after v0.10.0), measured in September 2026, with supplemental quantized LLM, depth estimation, ColBERT, and inpainting runs in October 2026.

| Device                   | Backends tested                       | Variants | Notes                                                                                                       |
| ------------------------ | ------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| Samsung Galaxy S26 Ultra | XNNPACK (121), Vulkan (24)            | 145      | Snapdragon SM8850; historical standard-task results and 21 quantized LLM variants                           |
| Google Pixel 10          | XNNPACK (100), Vulkan (24)            | 124      | Google Tensor G5; historical standard-task measurements                                                     |
| Samsung Galaxy S20+      | XNNPACK (132), Vulkan (34)            | 166      | Exynos 990; historical results plus supplemental quantized LLM, depth, ColBERT, and inpainting measurements |
| Samsung Galaxy S24       | XNNPACK (32), Vulkan (9)              | 41       | Supplemental quantized LLM, depth estimation, ColBERT, and inpainting measurements                          |
| iPhone 17                | XNNPACK (130), Core ML (81), MLX (38) | 249      | A19; historical results plus supplemental quantized LLM, depth, ColBERT, and inpainting measurements        |
| iPhone SE (3rd gen)      | XNNPACK (99), Core ML (73), MLX (15)  | 187      | A15 Bionic with 4 GB RAM; historical standard-task measurements                                             |

Memory values report peak process footprint during a separate inference pass, including the app baseline: total PSS on Android and `phys_footprint` on iOS. Some supplemental iPhone LLM measurements use a fresh process for each model.

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)GPU memory accounting

Memory figures reflect sampled process usage during inference. They may under-report GPU memory usage and miss brief peaks, and they exclude peaks during model loading. Memory accounting also varies across devices and backends, so use these values as a guide rather than as minimum RAM requirements or a direct comparison of GPU memory usage.

## Results[​](#results "Direct link to Results")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Performance and Precision Trade-offs

These benchmarks measure execution latency, memory utilization, and initialization times. Quantized models (such as `int8` or `8da4w`) significantly reduce memory footprint and download size while accelerating inference, but should always be evaluated for task accuracy on your specific application datasets. Run-to-run variations on physical mobile devices are common due to background system tasks and dynamic thermal management.

### [Image Classification](https://docs.swmansion.com/react-native-executorch/docs/extensions/image-classification.md)[​](#image-classification "Direct link to image-classification")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** 512x512 RGBA frame (synthetic test image: vertical color gradient with three solid ellipses).
* **Pipeline Structure:** The preprocessor resizes the raw image buffer to the model's input dimensions `[1, 3, H, W]` (using `stretch` mode for EfficientNet-V2-S), converts format layout to channels-first `[3, H, W]`, and normalizes pixel values. Post-processing applies `softmax` over output logits, maps confidence scores to ImageNet-1K class labels, and sorts the predictions by confidence.

Modelefficientnet-v2-s

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)Core ML (NPU/GPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision

### [Object Detection](https://docs.swmansion.com/react-native-executorch/docs/extensions/object-detection.md)[​](#object-detection "Direct link to object-detection")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** 640x640 RGBA frame (vertical color gradient with three solid ellipses).
* **Pipeline Structure:** Preprocessing resizes or letterboxes the input frame into the model's expected dimensions `[1, 3, H, W]` (ranging from 320x320 for SSDLite to 384x384, 512x512, or 640x640 across YOLO26 and RF-DETR variants). The model outputs candidate bounding boxes `[N, 4]`, confidence scores `[N]`, and class indices `[N]`. Post-processing executes Non-Maximum Suppression (NMS) to eliminate overlapping detections, maps class indices to COCO labels, and decodes and scales bounding boxes back to the original image dimensions.

Modelrfdetr-nano

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)Core ML (NPU/GPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision

### [Instance Segmentation](https://docs.swmansion.com/react-native-executorch/docs/extensions/instance-segmentation.md)[​](#instance-segmentation "Direct link to instance-segmentation")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** 640x640 RGBA frame.
* **Pipeline Structure:** Preprocessing resizes the input buffer to the model's input shape `[1, 3, H, W]` (ranging from 384x384 to 640x640 across FastSAM, YOLO26, and RF-DETR variants). The model outputs candidate boxes `[N, 4]`, confidence scores `[N]`, class indices `[N]`, and prototype mask logits `[N, MH, MW]`. Post-processing runs NMS on boxes, then for each surviving detection: scales the box to image coordinates, resizes the instance mask to original dimensions, thresholds mask logits, crops to the bounding box, and generates a grayscale mask buffer.

Modelfastsam-s

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)Core ML (NPU/GPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision

### [Semantic Segmentation](https://docs.swmansion.com/react-native-executorch/docs/extensions/semantic-segmentation.md)[​](#semantic-segmentation "Direct link to semantic-segmentation")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** 512x512 RGBA frame.
* **Pipeline Structure:** Preprocessing resizes and normalizes the image to the model input dimensions `[1, 3, H, W]`. The model outputs class logits `[1, K, H, W]` (or `[1, 1, H, W]` for single-class/selfie models). For multi-class models, post-processing performs an `argmax` across class channels, applies a color palette (`applyColormap`) to create an RGBA mask buffer, and resizes the colored mask to original input dimensions. For single-class models, it applies `sigmoid` and grayscale mapping.

Modeldeeplab-v3-mobilenet-v3-large

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)Core ML (NPU/GPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision

### [Pose & Keypoints](https://docs.swmansion.com/react-native-executorch/docs/extensions/pose-and-keypoints.md)[​](#pose--keypoints "Direct link to pose--keypoints")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** 512x512 RGBA frame.
* **Pipeline Structure:** Preprocessing resizes and normalizes the image buffer to `[1, 3, H, W]`. The model directly outputs candidate bounding boxes `[N, 4]`, confidence scores `[N]`, and landmark coordinates `[N, K, 3]` (17 body keypoints for YOLO/RF-DETR or 6 facial landmarks for BlazeFace, with x, y, confidence per point). Post-processing executes weighted Non-Maximum Suppression (NMS) to cluster overlapping candidates, computes confidence-weighted averages for both box and landmark coordinates, and scales them back to original image dimensions.

Modelblazeface

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision

### [Style Transfer](https://docs.swmansion.com/react-native-executorch/docs/extensions/style-transfer.md)[​](#style-transfer "Direct link to style-transfer")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** 512x512 RGBA frame.
* **Pipeline Structure:** Preprocessing resizes the input buffer to the model's fixed input dimensions `[3, H, W]` and normalizes it. The feedforward style network outputs stylized feature maps `[3, H, W]`. Post-processing denormalizes values, converts RGB to RGBA, and resizes the styled image back to the original canvas dimensions.
* **Memory Footprint:** Feedforward style networks maintain full spatial resolution across internal feature representations without heavy pooling, which produces massive intermediate activation tensors. Peak memory routinely exceeds 1.1 GB despite tiny weight files (\~2 MB).

Modelcandy

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)Core ML (NPU/GPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision

### [Depth Estimation](https://docs.swmansion.com/react-native-executorch/docs/extensions/depth-estimation.md)[​](#depth-estimation "Direct link to depth-estimation")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** Fixed 512x512 RGBA synthetic frame.
* **Pipeline Structure:** The depth estimator resizes and normalizes the frame, executes the model, and resizes the raw depth map back to the input dimensions. Timings cover the full pipeline; output values retain the model's depth interpretation.

Modeldepth-anything-v2-small

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)Core ML (NPU/GPU)Vulkan (GPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision

### [Image Inpainting](https://docs.swmansion.com/react-native-executorch/docs/extensions/image-inpainting.md)[​](#image-inpainting "Direct link to image-inpainting")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** Fixed 512x512 RGBA synthetic frame and a single-channel mask marking the central 256x256 square as the region to fill (25% of the image).
* **Pipeline Structure:** MI-GAN resizes the image and mask to the model's 256x256 or 512x512 input, normalizes the image, and reconstructs the masked region. The output is resized back to 512x512 and blended with the original image through the mask. Timings include preprocessing, inference, and blending for the Places2 and Faces checkpoints.

Modelmigan-faces-256

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)Core ML (NPU/GPU)Vulkan (GPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision

### [Image Embeddings](https://docs.swmansion.com/react-native-executorch/docs/extensions/image-embeddings.md)[​](#image-embeddings "Direct link to image-embeddings")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** 512x512 RGBA frame.
* **Pipeline Structure:** Powered by CLIP ViT-B/32, preprocessing resizes and normalizes the input image buffer to 224x224 (`[1, 3, 224, 224]`). The model outputs a 512-dimensional embedding vector `[1, 512]`. Post-processing reads the raw float32 tensor data directly into a `Float32Array` with virtually zero compute overhead, meaning total pipeline time is dominated almost entirely by model execution and image preprocessing.

Modelclip-vit-base-patch32

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)Core ML (NPU/GPU)Vulkan (GPU)MLX (Apple GPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision

### [OCR](https://docs.swmansion.com/react-native-executorch/docs/extensions/optical-character-recognition.md)[​](#ocr "Direct link to ocr")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** 640x640 RGBA frame.
* **Pipeline Structure:** Powered by PP-OCRv6 inside a single fused model with two execution methods. First, DBNet text detection (`forward_detect`) letterboxes the 640x640 frame and detects oriented quadrilaterals (`Quad` with 4 corner points). The detected quads are sorted into reading order. Second, each quad is rectified to the text recognizer canvas and evaluated by SVTR (`forward_recognize`), followed by greedy CTC decoding to text strings.
* **Mixed Precision:** The model uses mixed precision: an int8 DBNet detector paired with an fp32 SVTR recognizer (kept in fp32 because int8 quantization degrades accuracy on the SVTR attention stack).

Modelpaddle-ppocrv6-small

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)Core ML (NPU/GPU)Vulkan (GPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision

### [Text to Image](https://docs.swmansion.com/react-native-executorch/docs/extensions/text-to-image.md)[​](#text-to-image "Direct link to text-to-image")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** Prompt (`a small wooden sailboat on a calm lake at sunrise`), fixed random seed.
* **Pipeline Structure:** Powered by SDXS-512-DreamShaper, a distilled **single-step** latent diffusion model with no iterative denoising loop and no classifier-free guidance. First, a CLIP text encoder (`encode`) transforms 77 token IDs into text conditioning `[1, 77, 768]`. Next, a single UNet forward pass (`denoise`) updates initial Gaussian noise latents at timestep 999. Finally, a TAESD tiny decoder (`decode`) reconstructs the 4-channel latents `[1, 4, 64, 64]` into a full 512x512 RGBA image.

Modelsdxs-512-dreamshaper

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)Core ML (NPU/GPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision

### [Text Embeddings](https://docs.swmansion.com/react-native-executorch/docs/extensions/text-embeddings.md)[​](#text-embeddings "Direct link to text-embeddings")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** Fixed 4-sentence English paragraph (\~80 words).
* **Pipeline Structure:** The tokenizer converts input text into `int64` token IDs and an attention mask `[1, sequence_length]`, truncated only if exceeding the model's maximum sequence length. Sequence pooling and normalization are baked directly into the exported `.pte` model graph, which outputs the final embedding vector `[1, D]` (or `[D]`). Post-processing reads the raw embedding vector with negligible overhead.

Modelall-minilm-l6-v2

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)Core ML (NPU/GPU)Vulkan (GPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision

### [ColBERT Embeddings](https://docs.swmansion.com/react-native-executorch/docs/extensions/colbert-retrieval.md)[​](#colbert-embeddings "Direct link to colbert-embeddings")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** The same fixed English paragraph used for text embeddings, encoded as a document.
* **Pipeline Structure:** Tokenization, document marker insertion and padding, model execution, and removal of masked or skiplisted token vectors. The result is a matrix of normalized per-token embeddings. Query encoding and MaxSim retrieval scoring are outside this measurement.

Modellfm2-5-colbert-350-m

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)MLX (Apple GPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision

### [Privacy Filter](https://docs.swmansion.com/react-native-executorch/docs/extensions/privacy-filter.md)[​](#privacy-filter "Direct link to privacy-filter")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** Fixed 3-sentence paragraph containing sample PII entities (name, email, phone number, address, and account number).
* **Pipeline Structure:** The tokenizer converts input text into subword token IDs and an attention mask. The model evaluates token-level classification logits over a BIOES label space (`B-`, `I-`, `O`, `E-`, `S-`). Post-processing parses the BIOES grammar and detects structured entity spans (`PiiEntity` with entity type label, character start/end offsets, text, and confidence). Inputs exceeding the model window are evaluated via 50% overlapping sliding windows.

Modelnemotron

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)MLX (Apple GPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision

### [LLM Chat & Text Generation](https://docs.swmansion.com/react-native-executorch/docs/extensions/llm-chat-and-generation.md)[​](#llm-chat--text-generation "Direct link to llm-chat--text-generation")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Variants:** Quantized LLMs only.
* **Collection:** The S26 Ultra LLM results retain the September measurements. Supplemental S20+, S24, and iPhone 17 LLM runs were collected in October using the fixed-prompt harness described below.
* **Input:** Prompt (`List three uses for a paperclip.`), 64 tokens generated with EOS ignored, temperature 0 (greedy decoding), and the KV cache reset before each independent prompt.
* **Prefill vs. Decode & Memory:** The short prompt isolates autoregressive token generation throughput (tokens/second) and time to first token (TTFT). Autoregressive decoding executes one forward pass per generated token. Memory requirements include model weights, allocated key-value (KV) cache buffers, and intermediate tensors.

On iPhone 17, Phi-4 Mini was omitted. Qwen3 4B (XNNPACK) terminated after critical memory-pressure warnings, including in a fresh-process retry. On Galaxy S24, Android's low-memory killer terminated Gemma4 Omni E2B (Vulkan) during loading in a fresh-process retry. Only successful measurements are charted.

Modelbielik-v3-1-5-b

Tokens / sec

**Tokens / sec**Autoregressive decoding throughput (tokens generated per second).

Time to First Token

**Time to First Token**Latency from prompt input to the generation of the first token (prompt prefill).

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)

↑ Higher is better

Tokens / sec<!-- -->: Autoregressive decoding throughput (tokens generated per second).

Labels below bars indicate model precision

### [Speech to Text](https://docs.swmansion.com/react-native-executorch/docs/extensions/speech-to-text.md)[​](#speech-to-text "Direct link to speech-to-text")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** 10 seconds of mono audio sampled at 16 kHz.
* **Pipeline Structure:** The Whisper model's `encode` method ingests the raw 1D Float32 audio waveform directly, internally computing log-mel spectrogram features and encoder representations. Autoregressive decoding (`decode`) runs token by token to generate transcript text.
* **Synthetic Input Note:** The benchmark uses synthetic, voice-shaped audio rather than meaningful human speech. Because the recognizer transcribes no semantic content, Whisper emits minimal tokens, meaning decoder iterations are low and benchmark numbers are dominated by the encoder. Expect higher latency on real audio with continuous speech.

Modelwhisper-base

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)Core ML (NPU/GPU)Vulkan (GPU)MLX (Apple GPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision

### [Text to Speech](https://docs.swmansion.com/react-native-executorch/docs/extensions/text-to-speech.md)[​](#text-to-speech "Direct link to text-to-speech")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** Fixed 2-sentence English paragraph.

* **Pipeline Structure:** Covers multi-stage neural TTS architectures:

  <!-- -->

  * **Kokoro:** Text is normalized, phonemized via espeak-ng, and synthesized into 24 kHz audio through two sub-models (duration predictor and acoustic synthesizer conditioned on reference voice embeddings).
  * **Supertonic:** Text is cleaned, unicode-indexed, and synthesized into 44.1 kHz audio across four sub-models (text encoder, duration predictor, flow-matching vector estimator denoising steps, and vocoder).

* **Latency Scaling:** Synthesis latency scales with input text length and generated audio duration.

Modelkokoro-de

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)Core ML (NPU/GPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision

### [Voice Activity Detection](https://docs.swmansion.com/react-native-executorch/docs/extensions/voice-activity-detection.md)[​](#voice-activity-detection "Direct link to voice-activity-detection")

![](data:image/svg+xml,%3csvg%20width='21'%20height='20'%20viewBox='0%200%2021%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5%2014.99V15'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%205V12'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10.5%2019C15.4706%2019%2019.5%2014.9706%2019.5%2010C19.5%205.02944%2015.4706%201%2010.5%201C5.52944%201%201.5%205.02944%201.5%2010C1.5%2014.9706%205.52944%2019%2010.5%2019Z'%20stroke='%23001A72'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)![](data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10%2014.99V15'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%205V12'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M10%2019C14.9706%2019%2019%2014.9706%2019%2010C19%205.02944%2014.9706%201%2010%201C5.02944%201%201%205.02944%201%2010C1%2014.9706%205.02944%2019%2010%2019Z'%20stroke='%23F8F9FF'%20stroke-width='1.5'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/svg%3e)Input & Pipeline Details

* **Input:** 10 seconds of mono audio sampled at 16 kHz.
* **Pipeline Structure:** Native JSI `extractFrames` slices the 1D audio waveform into 25 ms overlapping frames with a 10 ms hop length, applying per-frame mean removal, pre-emphasis filtering (0.97), and a periodic Hann window. The FSMN-VAD model processes the framed representations to compute per-frame speech probabilities. Post-processing applies thresholding with hysteresis, segment padding, and silence merging to output speech intervals `[start, end]` in seconds.

Modelfsmn-vad

Pipeline Time

**Pipeline Time**Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

ExecuTorch Model Time

**ExecuTorch Model Time**Time spent exclusively executing the model forward pass within the ExecuTorch runtime.

Model Time Share

**Model Time Share**Percentage of total pipeline time spent in ExecuTorch model execution vs. pre/post-processing.

Peak Process Memory

**Peak Process Memory**Sampled process footprint during inference, including the app baseline: total PSS on Android and phys\_footprint on iOS. GPU memory may be under-counted; loading peaks and brief peaks are not captured reliably.

Load Time

**Load Time**Cold-start duration to load model weights and initialize the runtime session.

Model Size

**Model Size**Binary download file size of the compiled model bundle.

Backends

XNNPACK (CPU)

↓ Lower is better

Pipeline Time<!-- -->: Mean end-to-end pipeline execution time (pre-processing, inference, and post-processing).

Labels below bars indicate model precision
