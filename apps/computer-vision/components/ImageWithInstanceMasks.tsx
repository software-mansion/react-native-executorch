import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import {
  Canvas,
  Image as SkiaImage,
  Skia,
  AlphaType,
  ColorType,
  SkImage,
  Rect,
  Group,
} from '@shopify/react-native-skia';

// Color palette for different instances
const DEFAULT_COLORS = [
  [255, 87, 51, 180], // Red
  [51, 255, 87, 180], // Green
  [51, 87, 255, 180], // Blue
  [255, 51, 246, 180], // Magenta
  [51, 255, 246, 180], // Cyan
  [243, 255, 51, 180], // Yellow
  [141, 51, 255, 180], // Purple
  [255, 131, 51, 180], // Orange
  [51, 255, 131, 180], // Spring Green
  [131, 51, 255, 180], // Violet
];

interface SegmentedInstance {
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  mask?: Uint8Array;
  maskWidth?: number;
  maskHeight?: number;
  label: string;
  score: number;
  instanceId: number;
}

interface Props {
  imageUri: string;
  instances: SegmentedInstance[];
  imageWidth: number;
  imageHeight: number;
  showMasks?: boolean;
  colors?: number[][];
}

export default function ImageWithInstanceMasks({
  imageUri,
  instances,
  imageWidth,
  imageHeight,
  showMasks = true,
  colors = DEFAULT_COLORS,
}: Props) {
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [maskImages, setMaskImages] = useState<SkImage[]>([]);

  // Generate Skia mask images when instances change
  useEffect(() => {
    if (!showMasks || !instances.length) {
      setMaskImages([]);
      return;
    }

    const images: SkImage[] = [];
    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i];
      if (!instance.mask || !instance.maskWidth || !instance.maskHeight) {
        continue;
      }

      const color = colors[i % colors.length];
      const pixels = new Uint8Array(
        instance.maskWidth * instance.maskHeight * 4
      );

      for (let j = 0; j < instance.mask.length; j++) {
        if (instance.mask[j] > 0) {
          pixels[j * 4] = color[0];
          pixels[j * 4 + 1] = color[1];
          pixels[j * 4 + 2] = color[2];
          pixels[j * 4 + 3] = color[3];
        } else {
          pixels[j * 4 + 3] = 0;
        }
      }

      const data = Skia.Data.fromBytes(pixels);
      const img = Skia.Image.MakeImage(
        {
          width: instance.maskWidth,
          height: instance.maskHeight,
          alphaType: AlphaType.Premul,
          colorType: ColorType.RGBA_8888,
        },
        data,
        instance.maskWidth * 4
      );

      if (img) {
        images.push(img);
      }
    }

    setMaskImages(images);
  }, [instances, showMasks, colors]);

  const calculateScale = () => {
    const scaleX = canvasSize.width / (imageWidth || 1);
    const scaleY = canvasSize.height / (imageHeight || 1);
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (canvasSize.width - imageWidth * scale) / 2;
    const offsetY = (canvasSize.height - imageHeight * scale) / 2;
    return { scale, offsetX, offsetY };
  };

  const { scale, offsetX, offsetY } = calculateScale();

  return (
    <View style={styles.container}>
      {/* Base Image */}
      <View style={styles.imageContainer}>
        <Image
          style={styles.image}
          resizeMode="contain"
          source={
            imageUri
              ? { uri: imageUri }
              : require('../assets/icons/executorch_logo.png')
          }
        />
      </View>

      {/* Masks and Bounding Boxes */}
      {instances.length > 0 && (
        <View
          style={styles.canvasContainer}
          onLayout={(e) =>
            setCanvasSize({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            })
          }
        >
          <Canvas style={styles.canvas}>
            {/* Render masks */}
            {showMasks &&
              maskImages.map((maskImg, idx) => (
                <SkiaImage
                  key={`mask-${idx}`}
                  image={maskImg}
                  fit="contain"
                  x={0}
                  y={0}
                  width={canvasSize.width}
                  height={canvasSize.height}
                />
              ))}

            {/* Render bounding boxes */}
            {instances.map((instance, idx) => {
              const color = colors[idx % colors.length];
              const bboxX = instance.bbox.x1 * scale + offsetX;
              const bboxY = instance.bbox.y1 * scale + offsetY;
              const bboxWidth = (instance.bbox.x2 - instance.bbox.x1) * scale;
              const bboxHeight = (instance.bbox.y2 - instance.bbox.y1) * scale;

              return (
                <Group key={`bbox-${idx}`}>
                  <Rect
                    x={bboxX}
                    y={bboxY}
                    width={bboxWidth}
                    height={bboxHeight}
                    style="stroke"
                    strokeWidth={2}
                    color={`rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`}
                  />
                </Group>
              );
            })}
          </Canvas>

          {/* Render labels using React Native Text */}
          {instances.map((instance, idx) => {
            const color = colors[idx % colors.length];
            const bboxX = instance.bbox.x1 * scale + offsetX;
            const bboxY = instance.bbox.y1 * scale + offsetY;
            const labelText = `${instance.label || 'Unknown'} ${(instance.score * 100).toFixed(0)}%`;

            return (
              <View
                key={`label-${idx}`}
                style={[
                  styles.labelContainer,
                  {
                    left: bboxX,
                    top: bboxY - 20,
                    backgroundColor: `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.9)`,
                  },
                ]}
              >
                <Text style={styles.labelText}>{labelText}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
  labelContainer: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
