import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Frame, useFrameOutput } from 'react-native-vision-camera';
import { scheduleOnRN } from 'react-native-worklets';
import {
  STYLE_TRANSFER_CANDY,
  STYLE_TRANSFER_MOSAIC,
  useStyleTransfer,
} from 'react-native-executorch';
import {
  AlphaType,
  Canvas,
  ColorType,
  Image as SkiaImage,
  Skia,
  SkImage,
} from '@shopify/react-native-skia';
import { FRAME_TARGET_RESOLUTION, TaskProps } from './types';

type StyleModelId = 'styleTransferCandy' | 'styleTransferMosaic';

type Props = TaskProps & { activeModel: StyleModelId };

export default function StyleTransferTask({
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
  const candy = useStyleTransfer({
    model: STYLE_TRANSFER_CANDY,
    preventLoad: activeModel !== 'styleTransferCandy',
  });
  const mosaic = useStyleTransfer({
    model: STYLE_TRANSFER_MOSAIC,
    preventLoad: activeModel !== 'styleTransferMosaic',
  });

  const active = activeModel === 'styleTransferCandy' ? candy : mosaic;

  const [styledImage, setStyledImage] = useState<SkImage | null>(null);
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

  useEffect(() => {
    setStyledImage((prev) => {
      prev?.dispose();
      return null;
    });
  }, [activeModel]);

  useEffect(() => {
    return () => {
      setStyledImage((prev) => {
        prev?.dispose();
        return null;
      });
    };
  }, []);

  const styleRof = active.runOnFrame;

  const updateImage = useCallback(
    (img: SkImage) => {
      setStyledImage((prev) => {
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
          if (!styleRof) return;
          const isFrontCamera = cameraPositionSync.getDirty() === 'front';
          const result = styleRof(frame, isFrontCamera);
          if (result) {
            const pixels = new Uint8Array(result.dataPtr.buffer);
            const skData = Skia.Data.fromBytes(pixels);
            const img = Skia.Image.MakeImage(
              {
                width: result.sizes[1]!,
                height: result.sizes[0]!,
                alphaType: AlphaType.Unpremul,
                colorType: ColorType.RGBA_8888,
              },
              skData,
              result.sizes[1]! * 4
            );
            if (img) scheduleOnRN(updateImage, img);
          }
        } catch {
          // Frame may be disposed before processing completes — transient, safe to ignore.
        } finally {
          frame.dispose();
        }
      },
      [cameraPositionSync, frameKillSwitch, styleRof, updateImage]
    ),
  });

  useEffect(() => {
    onFrameOutputChange(frameOutput);
  }, [frameOutput, onFrameOutputChange]);

  if (!styledImage) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <SkiaImage
          image={styledImage}
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
