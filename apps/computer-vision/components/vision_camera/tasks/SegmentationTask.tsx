import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Frame, useFrameOutput } from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import {
  DEEPLAB_V3_RESNET50_QUANTIZED,
  DEEPLAB_V3_RESNET101_QUANTIZED,
  DEEPLAB_V3_MOBILENET_V3_LARGE_QUANTIZED,
  FCN_RESNET50_QUANTIZED,
  FCN_RESNET101_QUANTIZED,
  LRASPP_MOBILENET_V3_LARGE_QUANTIZED,
  SELFIE_SEGMENTATION,
  useSemanticSegmentation,
} from 'react-native-executorch';
import {
  AlphaType,
  Canvas,
  ColorType,
  Image as SkiaImage,
  Skia,
  SkImage,
} from '@shopify/react-native-skia';
import { CLASS_COLORS } from '../utils/colors';
import { TaskProps } from './types';

type SegModelId =
  | 'segmentationDeeplabResnet50'
  | 'segmentationDeeplabResnet101'
  | 'segmentationDeeplabMobilenet'
  | 'segmentationLraspp'
  | 'segmentationFcnResnet50'
  | 'segmentationFcnResnet101'
  | 'segmentationSelfie';

type Props = TaskProps & { activeModel: SegModelId };

export default function SegmentationTask({
  activeModel,
  canvasSize,
  frameKillSwitch,
  onFrameOutputChange,
  onReadyChange,
  onProgressChange,
  onGeneratingChange,
  onFpsChange,
}: Props) {
  const segDeeplabResnet50 = useSemanticSegmentation({
    model: DEEPLAB_V3_RESNET50_QUANTIZED,
    preventLoad: activeModel !== 'segmentationDeeplabResnet50',
  });
  const segDeeplabResnet101 = useSemanticSegmentation({
    model: DEEPLAB_V3_RESNET101_QUANTIZED,
    preventLoad: activeModel !== 'segmentationDeeplabResnet101',
  });
  const segDeeplabMobilenet = useSemanticSegmentation({
    model: DEEPLAB_V3_MOBILENET_V3_LARGE_QUANTIZED,
    preventLoad: activeModel !== 'segmentationDeeplabMobilenet',
  });
  const segLraspp = useSemanticSegmentation({
    model: LRASPP_MOBILENET_V3_LARGE_QUANTIZED,
    preventLoad: activeModel !== 'segmentationLraspp',
  });
  const segFcnResnet50 = useSemanticSegmentation({
    model: FCN_RESNET50_QUANTIZED,
    preventLoad: activeModel !== 'segmentationFcnResnet50',
  });
  const segFcnResnet101 = useSemanticSegmentation({
    model: FCN_RESNET101_QUANTIZED,
    preventLoad: activeModel !== 'segmentationFcnResnet101',
  });
  const segSelfie = useSemanticSegmentation({
    model: SELFIE_SEGMENTATION,
    preventLoad: activeModel !== 'segmentationSelfie',
  });

  const active = {
    segmentationDeeplabResnet50: segDeeplabResnet50,
    segmentationDeeplabResnet101: segDeeplabResnet101,
    segmentationDeeplabMobilenet: segDeeplabMobilenet,
    segmentationLraspp: segLraspp,
    segmentationFcnResnet50: segFcnResnet50,
    segmentationFcnResnet101: segFcnResnet101,
    segmentationSelfie: segSelfie,
  }[activeModel];

  const [maskImage, setMaskImage] = useState<SkImage | null>(null);
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

  // Clear stale mask when the segmentation model variant changes
  useEffect(() => {
    setMaskImage((prev) => {
      prev?.dispose();
      return null;
    });
  }, [activeModel]);

  // Dispose native Skia image on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      setMaskImage((prev) => {
        prev?.dispose();
        return null;
      });
    };
  }, []);

  const segRof = active.runOnFrame;

  const updateMask = useCallback(
    (img: SkImage) => {
      setMaskImage((prev) => {
        prev?.dispose();
        return img;
      });
      const now = Date.now();
      const diff = now - lastFrameTimeRef.current;
      if (diff > 0) onFpsChange(Math.round(1000 / diff), diff);
      lastFrameTimeRef.current = now;
    },
    [onFpsChange]
  );

  // CLASS_COLORS captured directly in closure — worklets cannot import modules
  const colors = CLASS_COLORS;

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
          if (!segRof) return;
          const result = segRof(frame, [], false);
          if (result?.ARGMAX) {
            const argmax: Int32Array = result.ARGMAX;
            const side = Math.round(Math.sqrt(argmax.length));
            const pixels = new Uint8Array(side * side * 4);
            for (let i = 0; i < argmax.length; i++) {
              const color = colors[argmax[i]!] ?? [0, 0, 0, 0];
              pixels[i * 4] = color[0]!;
              pixels[i * 4 + 1] = color[1]!;
              pixels[i * 4 + 2] = color[2]!;
              pixels[i * 4 + 3] = color[3]!;
            }
            const skData = Skia.Data.fromBytes(pixels);
            const img = Skia.Image.MakeImage(
              {
                width: side,
                height: side,
                alphaType: AlphaType.Unpremul,
                colorType: ColorType.RGBA_8888,
              },
              skData,
              side * 4
            );
            if (img) scheduleOnRN(updateMask, img);
          }
        } catch {
          // ignore
        } finally {
          frame.dispose();
        }
      },
      [colors, frameKillSwitch, segRof, updateMask]
    ),
  });

  useEffect(() => {
    onFrameOutputChange(frameOutput);
  }, [frameOutput, onFrameOutputChange]);

  if (!maskImage) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <SkiaImage
          image={maskImage}
          fit="cover"
          x={0}
          y={0}
          width={canvasSize.width}
          height={canvasSize.height}
        />
      </Canvas>
    </View>
  );
}
