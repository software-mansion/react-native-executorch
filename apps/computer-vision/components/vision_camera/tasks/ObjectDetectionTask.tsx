import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Frame, useFrameOutput } from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import {
  models,
  Detection,
  useObjectDetection,
  CocoLabel,
  CocoLabelYolo,
  BlazeFaceLabel,
  ObjectDetectionModelSources,
} from 'react-native-executorch';
import BoundingBoxes from '../../BoundingBoxes';
import { FRAME_TARGET_RESOLUTION, TaskProps } from './types';
const objectDetection = models.object_detection;

const BLAZEFACE: ObjectDetectionModelSources = {
  modelName: 'blazeface',
  modelSource: require('../../../assets/blazeface.pte'),
};

type ObjModelId =
  | 'objectDetectionSsdlite'
  | 'objectDetectionRfdetr'
  | 'objectDetectionYolo26n'
  | 'objectDetectionBlazeface';

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
    model: objectDetection.ssdlite_320_mobilenet_v3_large(),
    preventLoad: activeModel !== 'objectDetectionSsdlite',
  });
  const rfdetr = useObjectDetection({
    model: objectDetection.rf_detr_nano(),
    preventLoad: activeModel !== 'objectDetectionRfdetr',
  });
  const yolo26n = useObjectDetection({
    model: objectDetection.yolo26n(),
    preventLoad: activeModel !== 'objectDetectionYolo26n',
  });
  const blazeface = useObjectDetection({
    model: BLAZEFACE,
    preventLoad: activeModel !== 'objectDetectionBlazeface',
  });

  const detectors = {
    objectDetectionSsdlite: ssdlite,
    objectDetectionRfdetr: rfdetr,
    objectDetectionYolo26n: yolo26n,
    objectDetectionBlazeface: blazeface,
  } satisfies Record<ObjModelId, unknown>;
  const active = detectors[activeModel];

  type CommonDetection = Omit<Detection, 'label'> & { label: string };

  const [detections, setDetections] = useState<CommonDetection[]>([]);
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
    (p: {
      results:
        | Detection<typeof CocoLabel>[]
        | Detection<typeof CocoLabelYolo>[]
        | Detection<typeof BlazeFaceLabel>[];
      imageWidth: number;
      imageHeight: number;
    }) => {
      setDetections(
        p.results.map((det) => ({
          ...det,
          label: String(det.label),
        }))
      );
      setImageSize({ width: p.imageWidth, height: p.imageHeight });
      const now = Date.now();
      const diff = now - lastFrameTimeRef.current;
      if (diff > 0) onFpsChange(Math.round(1000 / diff), diff);
      lastFrameTimeRef.current = now;
    },
    [onFpsChange]
  );

  const frameOutput = useFrameOutput({
    targetResolution: FRAME_TARGET_RESOLUTION,
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
          const result = detRof(frame, isFrontCamera, {
            detectionThreshold: 0.5,
          });
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
        containerWidth={canvasSize.width}
      />
    </View>
  );
}
