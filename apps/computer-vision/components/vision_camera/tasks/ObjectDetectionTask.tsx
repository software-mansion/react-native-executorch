import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Frame, useFrameOutput } from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import {
  Detection,
  RF_DETR_NANO,
  SSDLITE_320_MOBILENET_V3_LARGE,
  useObjectDetection,
} from 'react-native-executorch';
import BoundingBoxes from '../../BoundingBoxes';
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
  onErrorChange,
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
    onErrorChange(active.error ? String(active.error) : null);
  }, [active.error, onErrorChange]);

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
          const isFrontCamera = cameraPositionSync.getDirty() === 'front';
          const result = detRof(frame, isFrontCamera, 0.5);
          // Sensor frames are landscape-native, so width/height are swapped
          // relative to portrait screen orientation.
          const screenW = frame.height;
          const screenH = frame.width;
          if (result) {
            scheduleOnRN(updateDetections, {
              results: result,
              imageWidth: screenW,
              imageHeight: screenH,
            });
          }
        } catch {
          // Frame may be disposed before processing completes — transient, safe to ignore.
        } finally {
          frame.dispose();
        }
      },
      [cameraPositionSync, detRof, frameKillSwitch, updateDetections]
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
      <BoundingBoxes
        detections={detections}
        scaleX={scale}
        scaleY={scale}
        offsetX={offsetX}
        offsetY={offsetY}
      />
    </View>
  );
}
