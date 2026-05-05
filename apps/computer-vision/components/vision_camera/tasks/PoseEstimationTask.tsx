import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Frame, useFrameOutput } from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle, Line } from 'react-native-svg';
import {
  usePoseEstimation,
  PoseDetections,
  YOLO26N_POSE,
} from 'react-native-executorch';
import { TaskProps } from './types';
import { COCO_SKELETON_CONNECTIONS } from '../../utils/cocoSkeleton';

type Props = TaskProps & { activeModel: 'poseEstimationYolo26n' };

// Colors for different people
const PERSON_COLORS = ['lime', 'cyan', 'magenta', 'yellow', 'orange', 'pink'];

export default function PoseEstimationTask({
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
  const poseModel = usePoseEstimation({
    model: YOLO26N_POSE,
    preventLoad: activeModel !== 'poseEstimationYolo26n',
  });

  const [detections, setDetections] = useState<PoseDetections>([]);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const lastFrameTimeRef = useRef(Date.now());

  useEffect(() => {
    onErrorChange(poseModel.error ? String(poseModel.error) : null);
  }, [poseModel.error, onErrorChange]);

  useEffect(() => {
    onReadyChange(poseModel.isReady);
  }, [poseModel.isReady, onReadyChange]);

  useEffect(() => {
    onProgressChange(poseModel.downloadProgress);
  }, [poseModel.downloadProgress, onProgressChange]);

  useEffect(() => {
    onGeneratingChange(poseModel.isGenerating);
  }, [poseModel.isGenerating, onGeneratingChange]);

  const poseRof = poseModel.runOnFrame;

  const updateDetections = useCallback(
    (p: {
      results: PoseDetections;
      imageWidth: number;
      imageHeight: number;
    }) => {
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
          if (!poseRof) return;
          const isFrontCamera = cameraPositionSync.getDirty() === 'front';
          const result = poseRof(frame, isFrontCamera, {
            detectionThreshold: 0.5,
          });
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
          // Frame may be disposed before processing completes
        } finally {
          frame.dispose();
        }
      },
      [cameraPositionSync, poseRof, frameKillSwitch, updateDetections]
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
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill}>
        {detections.map((personKeypoints, personIdx) => {
          const color = PERSON_COLORS[personIdx % PERSON_COLORS.length];
          const isVisible = (kp: { x: number; y: number }) =>
            kp.x >= 0 &&
            kp.y >= 0 &&
            kp.x <= imageSize.width &&
            kp.y <= imageSize.height;
          return (
            <React.Fragment key={`person-${personIdx}`}>
              {/* Draw skeleton lines */}
              {COCO_SKELETON_CONNECTIONS.map(([from, to], lineIdx) => {
                const kp1 = personKeypoints[from];
                const kp2 = personKeypoints[to];
                if (!kp1 || !kp2) return null;
                if (!isVisible(kp1) || !isVisible(kp2)) return null;
                const x1 = kp1.x * scale + offsetX;
                const y1 = kp1.y * scale + offsetY;
                const x2 = kp2.x * scale + offsetX;
                const y2 = kp2.y * scale + offsetY;
                return (
                  <Line
                    key={`person-${personIdx}-line-${lineIdx}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth={3}
                  />
                );
              })}
              {/* Draw keypoints */}
              {Object.entries(personKeypoints)
                .filter(([, kp]) => isVisible(kp))
                .map(([name, kp]) => {
                  const cx = kp.x * scale + offsetX;
                  const cy = kp.y * scale + offsetY;
                  return (
                    <Circle
                      key={`person-${personIdx}-kp-${name}`}
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill="red"
                    />
                  );
                })}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
