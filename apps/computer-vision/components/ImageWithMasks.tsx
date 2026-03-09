import React, { useState } from 'react';
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
import type { SegmentedInstance } from 'react-native-executorch';
import type { LabelEnum } from 'react-native-executorch';

const INSTANCE_COLORS = [
  [255, 87, 51, 180],
  [51, 255, 87, 180],
  [51, 87, 255, 180],
  [255, 51, 246, 180],
  [51, 255, 246, 180],
  [243, 255, 51, 180],
  [141, 51, 255, 180],
  [255, 131, 51, 180],
  [51, 255, 131, 180],
  [131, 51, 255, 180],
];

interface Props {
  imageUri: string;
  instances: SegmentedInstance<LabelEnum>[];
  imageWidth: number;
  imageHeight: number;
}

function createMaskImage(
  mask: Uint8Array,
  width: number,
  height: number,
  color: number[]
): SkImage | null {
  const pixels = new Uint8Array(width * height * 4);
  for (let j = 0; j < mask.length; j++) {
    if (mask[j] > 0) {
      pixels[j * 4] = color[0];
      pixels[j * 4 + 1] = color[1];
      pixels[j * 4 + 2] = color[2];
      pixels[j * 4 + 3] = color[3];
    }
  }
  const data = Skia.Data.fromBytes(pixels);
  return Skia.Image.MakeImage(
    {
      width,
      height,
      alphaType: AlphaType.Premul,
      colorType: ColorType.RGBA_8888,
    },
    data,
    width * 4
  );
}

export default function ImageWithMasks({
  imageUri,
  instances,
  imageWidth,
  imageHeight,
}: Props) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const scaleX = layout.width / (imageWidth || 1);
  const scaleY = layout.height / (imageHeight || 1);
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (layout.width - imageWidth * scale) / 2;
  const offsetY = (layout.height - imageHeight * scale) / 2;

  const maskImages = instances
    .map((instance, i) => {
      const color = INSTANCE_COLORS[i % INSTANCE_COLORS.length];
      return createMaskImage(
        instance.mask,
        instance.maskWidth,
        instance.maskHeight,
        color
      );
    })
    .filter((img): img is SkImage => img !== null);

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setLayout({ width, height });
      }}
    >
      <Image
        style={styles.image}
        resizeMode="contain"
        source={
          imageUri
            ? { uri: imageUri }
            : require('../assets/icons/executorch_logo.png')
        }
      />

      {instances.length > 0 && (
        <View style={styles.overlay}>
          <Canvas style={styles.canvas}>
            {maskImages.map((maskImg, idx) => {
              const inst = instances[idx];
              const mx = inst.bbox.x1 * scale + offsetX;
              const my = inst.bbox.y1 * scale + offsetY;
              const mw = (inst.bbox.x2 - inst.bbox.x1) * scale;
              const mh = (inst.bbox.y2 - inst.bbox.y1) * scale;
              return (
                <SkiaImage
                  key={`mask-${idx}`}
                  image={maskImg}
                  fit="fill"
                  x={mx}
                  y={my}
                  width={mw}
                  height={mh}
                />
              );
            })}

            {instances.map((instance, idx) => {
              const color = INSTANCE_COLORS[idx % INSTANCE_COLORS.length];
              const bboxX = instance.bbox.x1 * scale + offsetX;
              const bboxY = instance.bbox.y1 * scale + offsetY;
              const bboxW = (instance.bbox.x2 - instance.bbox.x1) * scale;
              const bboxH = (instance.bbox.y2 - instance.bbox.y1) * scale;

              return (
                <Group key={`bbox-${idx}`}>
                  <Rect
                    x={bboxX}
                    y={bboxY}
                    width={bboxW}
                    height={bboxH}
                    style="stroke"
                    strokeWidth={2}
                    color={`rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`}
                  />
                </Group>
              );
            })}
          </Canvas>

          {instances.map((instance, idx) => {
            const color = INSTANCE_COLORS[idx % INSTANCE_COLORS.length];
            const bboxX = instance.bbox.x1 * scale + offsetX;
            const bboxY = instance.bbox.y1 * scale + offsetY;

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
                <Text style={styles.labelText}>
                  {String(instance.label) || 'Unknown'}{' '}
                  {(instance.score * 100).toFixed(0)}%
                </Text>
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
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
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
