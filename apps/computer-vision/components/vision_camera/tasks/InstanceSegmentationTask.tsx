import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Frame, useFrameOutput } from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import {
  SegmentedInstance,
  YOLO26N_SEG,
  RF_DETR_NANO_SEG,
  useInstanceSegmentation,
  CocoLabel,
  CocoLabelYolo,
} from 'react-native-executorch';
import { Canvas, Image as SkiaImage } from '@shopify/react-native-skia';
import { labelColor, labelColorBg } from '../utils/colors';
import { TaskProps } from './types';
import {
  buildDisplayInstances,
  DisplayInstance,
} from '../../../components/ImageWithMasks';

type InstSegModelId =
  | 'instanceSegmentationYolo26n'
  | 'instanceSegmentationRfdetr';

type Props = TaskProps & { activeModel: InstSegModelId };

export default function InstanceSegmentationTask({
  activeModel,
  canvasSize,
  cameraPosition,
  frameKillSwitch,
  onFrameOutputChange,
  onReadyChange,
  onProgressChange,
  onGeneratingChange,
  onFpsChange,
}: Props) {
  const yolo26n = useInstanceSegmentation({
    model: YOLO26N_SEG,
    preventLoad: activeModel !== 'instanceSegmentationYolo26n',
  });
  const rfdetr = useInstanceSegmentation({
    model: RF_DETR_NANO_SEG,
    preventLoad: activeModel !== 'instanceSegmentationRfdetr',
  });

  const active =
    activeModel === 'instanceSegmentationYolo26n' ? yolo26n : rfdetr;

  const [instances, setInstances] = useState<DisplayInstance[]>([]);
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

  const instSegRof = active.runOnFrame;

  const updateInstances = useCallback(
    (p: {
      results:
        | SegmentedInstance<typeof CocoLabel>[]
        | SegmentedInstance<typeof CocoLabelYolo>[];
      imageWidth: number;
      imageHeight: number;
    }) => {
      const displayInstances = buildDisplayInstances(
        p.results.map((inst) => ({
          ...inst,
          label: String(inst.label),
        }))
      );
      setInstances((prev) => {
        // Dispose old mask images
        prev.forEach((inst) => inst.maskImage.dispose());
        return displayInstances;
      });
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
    onFrame: useCallback(
      (frame: Frame) => {
        'worklet';
        if (frameKillSwitch.getDirty()) {
          frame.dispose();
          return;
        }
        try {
          if (!instSegRof) return;
          const iw = frame.width > frame.height ? frame.height : frame.width;
          const ih = frame.width > frame.height ? frame.width : frame.height;
          const result = instSegRof(frame, {
            confidenceThreshold: 0.5,
            iouThreshold: 0.5,
            maxInstances: 5,
            returnMaskAtOriginalResolution: false,
            ...(activeModel === 'instanceSegmentationYolo26n' && {
              inputSize: 384,
            }),
          });
          if (result) {
            scheduleOnRN(updateInstances, {
              results: result,
              imageWidth: iw,
              imageHeight: ih,
            });
          }
        } catch {
          // ignore
        } finally {
          frame.dispose();
        }
      },
      [instSegRof, frameKillSwitch, updateInstances, activeModel]
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
    <View
      style={[
        StyleSheet.absoluteFill,
        cameraPosition === 'front' && { transform: [{ scaleX: -1 }] },
      ]}
      pointerEvents="none"
    >
      {/* Render masks */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {instances.map((inst, i) => {
          const x = inst.bbox.x1 * scale + offsetX;
          const y = inst.bbox.y1 * scale + offsetY;
          const w = (inst.bbox.x2 - inst.bbox.x1) * scale;
          const h = (inst.bbox.y2 - inst.bbox.y1) * scale;
          return (
            <SkiaImage
              key={`mask-${i}`}
              image={inst.maskImage}
              x={x}
              y={y}
              width={w}
              height={h}
              fit="fill"
            />
          );
        })}
      </Canvas>
      {/* Render bounding boxes */}
      {instances.map((inst, i) => {
        const left = inst.bbox.x1 * scale + offsetX;
        const top = inst.bbox.y1 * scale + offsetY;
        const w = (inst.bbox.x2 - inst.bbox.x1) * scale;
        const h = (inst.bbox.y2 - inst.bbox.y1) * scale;
        const label = String(inst.label);
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
                borderColor: labelColor(label),
              },
            ]}
          >
            <View
              style={[
                styles.bboxLabel,
                { backgroundColor: labelColorBg(label) },
                cameraPosition === 'front' && { transform: [{ scaleX: -1 }] },
              ]}
            >
              <Text style={styles.bboxLabelText}>
                {label} {(inst.score * 100).toFixed(1)}
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
