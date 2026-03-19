import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Frame, useFrameOutput } from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import { OCR_ENGLISH, OCRDetection, useOCR } from 'react-native-executorch';
import Svg, { Polygon, Text as SvgText } from 'react-native-svg';
import { TaskProps } from './types';

type Props = Omit<TaskProps, 'activeModel'>;

export default function OCRTask({
  canvasSize,
  cameraPositionSync,
  frameKillSwitch,
  onFrameOutputChange,
  onReadyChange,
  onProgressChange,
  onGeneratingChange,
  onFpsChange,
}: Props) {
  const model = useOCR({ model: OCR_ENGLISH });
  const [detections, setDetections] = useState<OCRDetection[]>([]);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const lastFrameTimeRef = useRef(Date.now());

  useEffect(() => {
    onReadyChange(model.isReady);
  }, [model.isReady, onReadyChange]);

  useEffect(() => {
    onProgressChange(model.downloadProgress);
  }, [model.downloadProgress, onProgressChange]);

  useEffect(() => {
    onGeneratingChange(model.isGenerating);
  }, [model.isGenerating, onGeneratingChange]);

  const ocrRof = model.runOnFrame;

  const updateDetections = useCallback(
    (p: { results: OCRDetection[]; frameW: number; frameH: number }) => {
      setDetections(p.results);
      setImageSize({ width: p.frameW, height: p.frameH });
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
          if (!ocrRof) return;
          const isMirrored = cameraPositionSync.getDirty() === 'front';
          const result = ocrRof(frame, isMirrored);
          if (result) {
            scheduleOnRN(updateDetections, {
              results: result,
              frameW: frame.height,
              frameH: frame.width,
            });
          }
        } catch {
          // ignore
        } finally {
          frame.dispose();
        }
      },
      [cameraPositionSync, frameKillSwitch, ocrRof, updateDetections]
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

  if (!detections.length) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg
        width={canvasSize.width}
        height={canvasSize.height}
        style={StyleSheet.absoluteFill}
      >
        {detections.map((det, i) => {
          const pts = det.bbox
            .map((p) => `${p.x * scale + offsetX},${p.y * scale + offsetY}`)
            .join(' ');
          const labelX = det.bbox[0]!.x * scale + offsetX;
          const labelY = det.bbox[0]!.y * scale + offsetY - 4;
          return (
            <React.Fragment key={i}>
              <Polygon
                points={pts}
                fill="none"
                stroke="cyan"
                strokeWidth={2}
              />
              <SvgText
                x={labelX}
                y={labelY}
                fill="white"
                fontSize={12}
                fontWeight="bold"
              >
                {det.text}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
