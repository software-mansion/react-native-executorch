import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles, theme } from '../../theme';
import { useImage } from '@shopify/react-native-skia';
import { useKeypointDetector, models, type KeypointDetection } from 'react-native-executorch';
import type { ImageBuffer } from 'react-native-executorch/cv';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getImage, skImageToBuffer } from '../../utils';
import { ModelPicker, type ModelOption } from '../../components/ModelPicker';
import { ImageViewport } from '../../components/ImageViewport';
import { ModelStatus } from '../../components/ModelStatus';
import { LatencyIndicator } from '../../components/LatencyIndicator';
import { Button } from '../../components/Button';
import { BoundingBox } from '../../components/BoundingBox';

const MODEL_OPTIONS: ModelOption[] = [
  {
    label: 'BlazeFace (XNNPACK FP32)',
    value: models.keypointDetection.BLAZEFACE.XNNPACK_FP32,
  },
  {
    label: 'Face Mesh (XNNPACK FP32)',
    value: models.keypointDetection.FACEMESH.XNNPACK_FP32,
  },
  {
    label: 'Face Mesh (CoreML FP16)',
    value: models.keypointDetection.FACEMESH.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
  {
    label: 'YOLO26 Pose (XNNPACK FP32)',
    value: models.keypointDetection.YOLO26_POSE.SIZE_384.XNNPACK_FP32,
  },
  {
    label: 'RF-DETR Keypoint (XNNPACK FP32)',
    value: models.keypointDetection.RFDETR_KEYPOINT.XNNPACK_FP32,
  },
  {
    label: 'RF-DETR Keypoint (CoreML FP16)',
    value: models.keypointDetection.RFDETR_KEYPOINT.COREML_FP16,
    disabled: Platform.OS !== 'ios',
  },
];

/**
 * The face mesh models see one already-cropped face, and their presence score
 * falls off a cliff once the face stops filling the frame: on the same photo it
 * reads 0.95 when the face fills 70% and 0.003 at 50%. So they get a detector in
 * front of them rather than the whole picture.
 */
const FACEMESH_MODELS = [
  models.keypointDetection.FACEMESH.XNNPACK_FP32,
  models.keypointDetection.FACEMESH.COREML_FP16,
];

/** Padding around the detector's box, as a fraction of its longest side. */
const FACE_CROP_PADDING = 0.25;

/** Side of the square the face is resampled into: the mesh's input size. */
const FACE_CROP_SIZE = 192;

type Face = KeypointDetection<'xyxy', string>;

/**
 * Cuts a square, padded crop around a detected face, rotated so the eyes are
 * level. The mesh was trained on upright faces: fed an axis-aligned crop of a
 * tilted head, its landmarks drift ~5 px at 30 degrees and it loses the face
 * entirely near 90, while a levelled crop stays within ~2 px at any angle.
 * @param src The image to cut from.
 * @param face The detector's face, in `src`'s pixels.
 * @returns The crop and a mapping from its pixels back to `src`'s.
 */
function cropToFace(src: ImageBuffer, face: Face) {
  const { box, landmarks } = face;
  const channels = src.data.length / (src.width * src.height);
  const { leftEye, rightEye } = landmarks;
  const angle = Math.atan2(rightEye!.y - leftEye!.y, rightEye!.x - leftEye!.x);
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  const centerX = (box.xmin + box.xmax) / 2;
  const centerY = (box.ymin + box.ymax) / 2;
  const side = Math.max(box.xmax - box.xmin, box.ymax - box.ymin) * (1 + 2 * FACE_CROP_PADDING);
  const scale = side / FACE_CROP_SIZE;

  // Crop pixel -> source pixel: scale up, rotate by the eye angle, move onto the face.
  const toSource = (x: number, y: number) => {
    const dx = (x - FACE_CROP_SIZE / 2) * scale;
    const dy = (y - FACE_CROP_SIZE / 2) * scale;
    return { x: centerX + dx * cos - dy * sin, y: centerY + dx * sin + dy * cos };
  };

  // Bilinear resample; anything outside the source stays black.
  const data = new Uint8Array(FACE_CROP_SIZE * FACE_CROP_SIZE * channels);
  for (let row = 0; row < FACE_CROP_SIZE; row++) {
    for (let col = 0; col < FACE_CROP_SIZE; col++) {
      const { x, y } = toSource(col + 0.5, row + 0.5);
      const x0 = Math.floor(x - 0.5);
      const y0 = Math.floor(y - 0.5);
      if (x0 < 0 || y0 < 0 || x0 + 1 >= src.width || y0 + 1 >= src.height) continue;
      const fx = x - 0.5 - x0;
      const fy = y - 0.5 - y0;
      const i00 = (y0 * src.width + x0) * channels;
      const i10 = i00 + src.width * channels;
      const out = (row * FACE_CROP_SIZE + col) * channels;
      for (let c = 0; c < channels; c++) {
        const top = src.data[i00 + c]! * (1 - fx) + src.data[i00 + channels + c]! * fx;
        const bottom = src.data[i10 + c]! * (1 - fx) + src.data[i10 + channels + c]! * fx;
        data[out + c] = top * (1 - fy) + bottom * fy;
      }
    }
  }

  return {
    buffer: { ...src, data, width: FACE_CROP_SIZE, height: FACE_CROP_SIZE },
    toSource,
    scale,
  };
}

/**
 * Moves a mesh out of the crop's coordinates and back onto the full image.
 * @param detection The detection, in the crop's pixels.
 * @param crop The crop it was run on.
 * @returns The same detection in the full image's pixels, boxed by its hull.
 */
function mapToSource(detection: Face, crop: ReturnType<typeof cropToFace>): Face {
  const landmarks = Object.fromEntries(
    Object.entries(detection.landmarks).map(([key, point]) => {
      const moved = { ...point, ...crop.toSource(point.x, point.y) };
      return [
        key,
        point.depth === undefined ? moved : { ...moved, depth: point.depth * crop.scale },
      ];
    })
  ) as Face['landmarks'];

  const points = Object.values(landmarks);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    ...detection,
    box: {
      ...detection.box,
      xmin: Math.min(...xs),
      ymin: Math.min(...ys),
      xmax: Math.max(...xs),
      ymax: Math.max(...ys),
    },
    landmarks,
  };
}

const VIEW_WIDTH = Dimensions.get('window').width - 32;
const VIEW_HEIGHT = Math.round((VIEW_WIDTH * 16) / 9);

function KeypointContent() {
  const insets = useSafeAreaInsets();
  const [selectedModel, setSelectedModel] = useState<any>(MODEL_OPTIONS[0].value);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<KeypointDetection<'xyxy', string>[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const skiaImage = useImage(imageUri, (err) => setError(err.message || String(err)));

  const needsFaceCrop = FACEMESH_MODELS.includes(selectedModel);

  const {
    isReady,
    downloadProgress,
    error: loadError,
    detectKeypoints,
    detectKeypointsWorklet,
  } = useKeypointDetector(selectedModel);

  // The face detector that feeds the mesh. It is always loaded rather than
  // loaded on demand — hooks cannot be conditional — but it is 0.6 MB.
  const faceDetector = useKeypointDetector(models.keypointDetection.BLAZEFACE.DEFAULT);

  const handlePickImage = async (useCamera: boolean) => {
    setError(null);
    try {
      const uri = await getImage(useCamera);
      if (uri) {
        setImageUri(uri);
        setResults([]);
        setLatency(null);
      }
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const runDetection = async (sync: boolean) => {
    if (!skiaImage || !detectKeypoints || !detectKeypointsWorklet) return;
    if (needsFaceCrop && !faceDetector.isReady) return;
    if (!sync) setIsProcessing(true);
    setError(null);
    try {
      const buffer = skImageToBuffer(skiaImage);
      const start = Date.now();

      const run = (input: ImageBuffer) =>
        (sync ? detectKeypointsWorklet(input) : detectKeypoints(input)) as
          | KeypointDetection<'xyxy', string>[]
          | Promise<KeypointDetection<'xyxy', string>[]>;

      let output: KeypointDetection<'xyxy', string>[];
      if (needsFaceCrop) {
        // Find the face, cut a levelled crop around it, mesh the crop, then put
        // the result back where it came from.
        const faces = (await faceDetector.detectKeypoints!(buffer)) as KeypointDetection<
          'xyxy',
          string
        >[];
        const crop = faces[0] ? cropToFace(buffer, faces[0]) : null;
        if (!crop) {
          setLatency(Date.now() - start);
          setResults([]);
          setError('No face found. Face Mesh needs a photo with a clearly visible face.');
          return;
        }
        output = (await run(crop.buffer)).map((d) => mapToSource(d, crop));
      } else {
        output = await run(buffer);
      }

      setLatency(Date.now() - start);
      setResults(output);
      if (output.length === 0) {
        // An empty result is the common outcome here and renders as nothing at
        // all, so say which stage produced it rather than leaving a blank image.
        setError(
          needsFaceCrop
            ? 'The mesh scored the cropped face below its presence threshold.'
            : 'No detection above the confidence threshold.'
        );
      }
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      if (!sync) setIsProcessing(false);
    }
  };

  let scaleX = 1;
  let scaleY = 1;
  let offsetX = 0;
  let offsetY = 0;

  if (skiaImage) {
    const imgW = skiaImage.width();
    const imgH = skiaImage.height();
    const scale = Math.min(VIEW_WIDTH / imgW, VIEW_HEIGHT / imgH);
    const displayedW = imgW * scale;
    const displayedH = imgH * scale;
    offsetX = (VIEW_WIDTH - displayedW) / 2;
    offsetY = (VIEW_HEIGHT - displayedH) / 2;
    scaleX = scale;
    scaleY = scale;
  }

  // The face detector has to be up too, otherwise Run would look enabled and
  // then do nothing.
  const canRun = isReady && (!needsFaceCrop || faceDetector.isReady);
  const activeError = loadError ? String(loadError) : error;

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={[
        commonStyles.contentContainer,
        { paddingBottom: insets.bottom + theme.spacing.large },
      ]}
    >
      <Text style={commonStyles.description}>
        Upload or capture an image to run keypoint/pose estimation on it. Face Mesh sees one
        already-cropped face, so BlazeFace runs first and it meshes that crop.
      </Text>

      <ModelPicker
        label="Model"
        options={MODEL_OPTIONS}
        selectedValue={selectedModel}
        onValueChange={(model) => {
          setSelectedModel(model);
          setResults([]);
          setLatency(null);
          setError(null);
        }}
      />

      <ModelStatus
        isReady={canRun}
        downloadProgress={downloadProgress}
        error={activeError}
        modelTypeLabel="keypoint model"
      />

      <ImageViewport skiaImage={skiaImage} onPressPlaceholder={() => handlePickImage(false)}>
        {skiaImage && results.length > 0 && (
          <View style={styles.overlayContainer} pointerEvents="none">
            {results.map((det, index: number) => {
              const strokeColor = '#00ff00';
              const bgColor = 'rgba(0, 255, 0, 0.15)';
              const landmarkColor = '#ff00ff';
              const isDense = Object.keys(det.landmarks).length > 24;

              const left = offsetX + det.box.xmin * scaleX;
              const top = offsetY + det.box.ymin * scaleY;
              const width = (det.box.xmax - det.box.xmin) * scaleX;
              const height = (det.box.ymax - det.box.ymin) * scaleY;

              return (
                <React.Fragment key={index}>
                  {/* Bounding Box */}
                  <BoundingBox
                    left={left}
                    top={top}
                    width={width}
                    height={height}
                    borderColor={strokeColor}
                    backgroundColor={bgColor}
                    label={`Det ${Math.round(det.confidence * 100)}%`}
                  />

                  {/* Landmarks. A mesh has hundreds of them, so past a couple
                      of dozen the per-point labels stop being readable and the
                      dots shrink to keep the shape visible. */}
                  {Object.entries(det.landmarks).map(([key, point]) => {
                    const x = offsetX + point.x * scaleX;
                    const y = offsetY + point.y * scaleY;
                    if (isDense) {
                      return (
                        <View
                          key={key}
                          style={[
                            styles.meshDot,
                            { left: x - 1, top: y - 1, backgroundColor: landmarkColor },
                          ]}
                        />
                      );
                    }
                    return (
                      <View
                        key={key}
                        style={[
                          styles.landmarkContainer,
                          {
                            left: x - 50,
                            top: y - 4,
                          },
                        ]}
                      >
                        <View style={[styles.landmarkDot, { backgroundColor: landmarkColor }]} />
                        <Text style={[styles.landmarkText, { color: landmarkColor }]}>
                          {key}: {Math.round(point.confidence * 100)}%
                        </Text>
                      </View>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </View>
        )}
      </ImageViewport>

      <View style={commonStyles.buttonRow}>
        <Button title="Gallery" onPress={() => handlePickImage(false)} variant="secondary" />
        <Button title="Camera" onPress={() => handlePickImage(true)} variant="secondary" />
      </View>

      <View style={commonStyles.buttonRow}>
        <Button
          title="Run Async"
          onPress={() => runDetection(false)}
          disabled={!skiaImage || !canRun || isProcessing}
          loading={isProcessing}
        />
        <Button
          title="Run Sync"
          onPress={() => runDetection(true)}
          disabled={!skiaImage || !canRun || isProcessing}
          variant="accent"
        />
      </View>

      <LatencyIndicator latency={latency} />
    </ScrollView>
  );
}

export default function KeypointScreen() {
  return (
    <ScreenWrapper>
      <KeypointContent />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  meshDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  landmarkContainer: {
    position: 'absolute',
    width: 100,
    alignItems: 'center',
  },
  landmarkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff00ff',
    borderWidth: 1,
    borderColor: '#fff',
  },
  landmarkText: {
    color: '#ff00ff',
    fontSize: 8,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    textAlign: 'center',
  },
});
