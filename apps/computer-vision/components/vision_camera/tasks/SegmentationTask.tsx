import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Frame, useFrameOutput } from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import { models, useSemanticSegmentation } from 'react-native-executorch';
import {
  AlphaType,
  Canvas,
  ColorType,
  Image as SkiaImage,
  Skia,
  SkImage,
} from '@shopify/react-native-skia';
import { CLASS_COLORS } from '../../utils/colors';
import { FRAME_TARGET_RESOLUTION, TaskProps } from './types';
const semanticSegmentation = models.semantic_segmentation;

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
  cameraPositionSync,
  frameKillSwitch,
  onFrameOutputChange,
  onReadyChange,
  onProgressChange,
  onGeneratingChange,
  onFpsChange,
  onErrorChange,
}: Props) {
  const segDeeplabResnet50 = useSemanticSegmentation({
    model: semanticSegmentation.deeplab_v3_resnet50(),
    preventLoad: activeModel !== 'segmentationDeeplabResnet50',
  });
  const segDeeplabResnet101 = useSemanticSegmentation({
    model: semanticSegmentation.deeplab_v3_resnet101(),
    preventLoad: activeModel !== 'segmentationDeeplabResnet101',
  });
  const segDeeplabMobilenet = useSemanticSegmentation({
    model: semanticSegmentation.deeplab_v3_mobilenet_v3_large(),
    preventLoad: activeModel !== 'segmentationDeeplabMobilenet',
  });
  const segLraspp = useSemanticSegmentation({
    model: semanticSegmentation.lraspp_mobilenet_v3_large(),
    preventLoad: activeModel !== 'segmentationLraspp',
  });
  const segFcnResnet50 = useSemanticSegmentation({
    model: semanticSegmentation.fcn_resnet50(),
    preventLoad: activeModel !== 'segmentationFcnResnet50',
  });
  const segFcnResnet101 = useSemanticSegmentation({
    model: semanticSegmentation.fcn_resnet101(),
    preventLoad: activeModel !== 'segmentationFcnResnet101',
  });
  const segSelfie = useSemanticSegmentation({
    model: semanticSegmentation.selfie_segmentation(),
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
    (p: { img: SkImage; screenW: number; screenH: number }) => {
      setMaskImage((prev) => {
        prev?.dispose();
        return p.img;
      });
      setImageSize({ width: p.screenW, height: p.screenH });
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
          if (!segRof) return;
          const isFrontCamera = cameraPositionSync.getDirty() === 'front';
          const result = segRof(frame, isFrontCamera, [], false);
          if (result?.ARGMAX) {
            const argmax: Int32Array = result.ARGMAX;
            // Native rotates the mask into screen-space (see
            // `inverseRotateMat`). Derive screen-space dims from
            // `frame.orientation`: portrait orientations ("left"/"right")
            // swap sensor-native width/height, landscape ones keep them.
            const orient = frame.orientation;
            const isScreenPortrait = orient === 'left' || orient === 'right';
            const screenW = isScreenPortrait ? frame.height : frame.width;
            const screenH = isScreenPortrait ? frame.width : frame.height;
            // Mask buffer dims: the C++ side returns the mask at model output
            // resolution (the `resizeToInput=false` arg below). All built-in
            // segmentation models output a square spatial map (e.g. 520×520),
            // so sqrt(length) recovers the side. Non-square model outputs
            // would need dims exposed from native.
            const maskSide = Math.round(Math.sqrt(argmax.length));
            const maskW = maskSide;
            const maskH = maskSide;
            const pixels = new Uint8Array(maskW * maskH * 4);
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
                width: maskW,
                height: maskH,
                alphaType: AlphaType.Unpremul,
                colorType: ColorType.RGBA_8888,
              },
              skData,
              maskW * 4
            );
            if (img) scheduleOnRN(updateMask, { img, screenW, screenH });
          }
        } catch {
          // Frame may be disposed before processing completes — transient, safe to ignore.
        } finally {
          frame.dispose();
        }
      },
      [cameraPositionSync, colors, frameKillSwitch, segRof, updateMask]
    ),
  });

  useEffect(() => {
    onFrameOutputChange(frameOutput);
  }, [frameOutput, onFrameOutputChange]);

  if (!maskImage) return null;

  // Match the camera preview's cover-scale + center layout so the mask
  // aligns pixel-for-pixel with what the user sees. `fit="fill"` lets the
  // (square) mask stretch into the preview rect — which is computed in
  // screen-space dims rather than the sensor-native ones.
  const scale = Math.max(
    canvasSize.width / imageSize.width,
    canvasSize.height / imageSize.height
  );
  const dstW = imageSize.width * scale;
  const dstH = imageSize.height * scale;
  const offsetX = (canvasSize.width - dstW) / 2;
  const offsetY = (canvasSize.height - dstH) / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <SkiaImage
          image={maskImage}
          fit="fill"
          x={offsetX}
          y={offsetY}
          width={dstW}
          height={dstH}
        />
      </Canvas>
    </View>
  );
}
