import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Frame, useFrameOutput } from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import {
  Detection,
  RF_DETR_NANO,
  SSDLITE_320_MOBILENET_V3_LARGE,
  useObjectDetection,
} from 'react-native-executorch';
import { labelColor, labelColorBg } from '../utils/colors';
import { TaskProps } from './types';

type ObjModelId = 'objectDetectionSsdlite' | 'objectDetectionRfdetr';

type Props = TaskProps & { activeModel: ObjModelId };

export default function ObjectDetectionTask({
  activeModel,
  canvasSize,
  cameraPositionSync,
  frameKillSwitch,
  onFrameOutputChange,
  onReadyChange,
  onProgressChange,
  onGeneratingChange,
  onFpsChange,
}: Props) {
  const ssdlite = useObjectDetection({
    model: SSDLITE_320_MOBILENET_V3_LARGE,
    preventLoad: activeModel !== 'objectDetectionSsdlite',
  });
  const rfdetr = useObjectDetection({
    model: RF_DETR_NANO,
    preventLoad: activeModel !== 'objectDetectionRfdetr',
  });

  const active = activeModel === 'objectDetectionSsdlite' ? ssdlite : rfdetr;

  const [detections, setDetections] = useState<Detection[]>([]);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const lastFrameTimeRef = useRef(Date.now());

  useEffect(() => {
    onReadyChange(active.isReady);
  }, [active.isReady, onReadyChange]);

  useEffect(() => {
    onProgressChange(active.downloadProgress);
  }, [active.downloadProgress, onProgressChange]);

  useEffect(() => {
    onGeneratingChange(active.isGenerating);
  }, [active.isGenerating, onGeneratingChange]);

  const detRof = active.runOnFrame;

  const updateDetections = useCallback(
    (p: { results: Detection[]; imageWidth: number; imageHeight: number }) => {
      setDetections(p.results);
      setImageSize({ width: p.imageWidth, height: p.imageHeight });
      const now = Date.now();
      const diff = now - lastFrameTimeRef.current;
      if (diff > 0) onFpsChange(Math.round(1000 / diff), diff);
      lastFrameTimeRef.current = now;
    },
    [onFpsChange]
  );

  const frameOutput = useFrameOutput({
    pixelFormat: 'rgb',
    dropFramesWhileBusy: true,
    enablePreviewSizedOutputBuffers: true,
    onFrame: useCallback(
      (frame: Frame) => {
        'worklet';
        if (frameKillSwitch.getDirty()) {
          frame.dispose();
          return;
        }
        try {
          if (!detRof) return;
          const orientation = frame.orientation;
          // "up"/"down" = landscape orientations where buffer axes are swapped vs screen
          const swapAxes = orientation === 'up' || orientation === 'down';
          const screenW = swapAxes ? frame.height : frame.width;
          const screenH = swapAxes ? frame.width : frame.height;
          const result = detRof(frame, cameraPositionSync.getDirty(), 0.5);
          if (result) {
            scheduleOnRN(updateDetections, {
              results: result,
              imageWidth: screenW,
              imageHeight: screenH,
            });
          }
        } catch {
          // ignore
        } finally {
          frame.dispose();
        }
      },
      [detRof, frameKillSwitch, updateDetections, cameraPositionSync]
    ),
  });

  useEffect(() => {
    onFrameOutputChange(frameOutput);
  }, [frameOutput, onFrameOutputChange]);

  const scale = Math.max(
    canvasSize.width / imageSize.width,
    canvasSize.height / imageSize.height
  );
  const offsetX = (canvasSize.width - imageSize.width * scale) / 2;
  const offsetY = (canvasSize.height - imageSize.height * scale) / 2;

  return (
    <View style={[StyleSheet.absoluteFill]} pointerEvents="none">
      {detections.map((det, i) => {
        const left = det.bbox.x1 * scale + offsetX;
        const top = det.bbox.y1 * scale + offsetY;
        const w = (det.bbox.x2 - det.bbox.x1) * scale;
        const h = (det.bbox.y2 - det.bbox.y1) * scale;
        return (
          <View
            key={i}
            style={[
              styles.bbox,
              {
                left,
                top,
                width: w,
                height: h,
                borderColor: labelColor(det.label),
              },
            ]}
          >
            <View
              style={[
                styles.bboxLabel,
                { backgroundColor: labelColorBg(det.label) },
              ]}
            >
              <Text style={styles.bboxLabelText}>
                {det.label} {(det.score * 100).toFixed(1)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bbox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'cyan',
    borderRadius: 4,
  },
  bboxLabel: {
    position: 'absolute',
    top: -22,
    left: -2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bboxLabelText: { color: 'white', fontSize: 11, fontWeight: '600' },
});
