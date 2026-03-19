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

const MAX_MASK_DIM = 256;

/** Display-only data — no raw mask buffers. */
export interface DisplayInstance {
  bbox: { x1: number; y1: number; x2: number; y2: number };
  label: string;
  score: number;
  maskImage: SkImage;
}

/**
 * Convert raw segmentation output into lightweight display instances.
 * Call this eagerly (in the forward callback) so raw Uint8Array masks
 * can be garbage-collected immediately.
 */
export function buildDisplayInstances(
  rawInstances: {
    bbox: { x1: number; y1: number; x2: number; y2: number };
    mask: Uint8Array;
    maskWidth: number;
    maskHeight: number;
    label: string | number;
    score: number;
  }[]
): DisplayInstance[] {
  return rawInstances
    .map((inst, i) => {
      const color = INSTANCE_COLORS[i % INSTANCE_COLORS.length];
      const img = createMaskImage(
        inst.mask,
        inst.maskWidth,
        inst.maskHeight,
        color
      );
      if (!img) return null;
      return {
        bbox: inst.bbox,
        label: String(inst.label),
        score: inst.score,
        maskImage: img,
      };
    })
    .filter((d): d is DisplayInstance => d !== null);
}

function createMaskImage(
  mask: Uint8Array,
  srcW: number,
  srcH: number,
  color: number[]
): SkImage | null {
  const downscale = Math.min(1, MAX_MASK_DIM / Math.max(srcW, srcH));
  const dstW = Math.max(1, Math.round(srcW * downscale));
  const dstH = Math.max(1, Math.round(srcH * downscale));

  const pixels = new Uint8Array(dstW * dstH * 4);
  const r = color[0],
    g = color[1],
    b = color[2],
    a = color[3];

  for (let dy = 0; dy < dstH; dy++) {
    const sy = Math.min(Math.floor(dy / downscale), srcH - 1);
    for (let dx = 0; dx < dstW; dx++) {
      const sx = Math.min(Math.floor(dx / downscale), srcW - 1);
      if (mask[sy * srcW + sx] > 0) {
        const idx = (dy * dstW + dx) * 4;
        pixels[idx] = r;
        pixels[idx + 1] = g;
        pixels[idx + 2] = b;
        pixels[idx + 3] = a;
      }
    }
  }

  const data = Skia.Data.fromBytes(pixels);
  const image = Skia.Image.MakeImage(
    {
      width: dstW,
      height: dstH,
      alphaType: AlphaType.Premul,
      colorType: ColorType.RGBA_8888,
    },
    data,
    dstW * 4
  );
  data.dispose();
  return image;
}

interface Props {
  imageUri: string;
  instances: DisplayInstance[];
  imageWidth: number;
  imageHeight: number;
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
            {instances.map((inst, idx) => {
              const mx = inst.bbox.x1 * scale + offsetX;
              const my = inst.bbox.y1 * scale + offsetY;
              const mw = (inst.bbox.x2 - inst.bbox.x1) * scale;
              const mh = (inst.bbox.y2 - inst.bbox.y1) * scale;
              return (
                <SkiaImage
                  key={`mask-${idx}`}
                  image={inst.maskImage}
                  fit="fill"
                  x={mx}
                  y={my}
                  width={mw}
                  height={mh}
                />
              );
            })}

            {instances.map((inst, idx) => {
              const color = INSTANCE_COLORS[idx % INSTANCE_COLORS.length];
              const bboxX = inst.bbox.x1 * scale + offsetX;
              const bboxY = inst.bbox.y1 * scale + offsetY;
              const bboxW = (inst.bbox.x2 - inst.bbox.x1) * scale;
              const bboxH = (inst.bbox.y2 - inst.bbox.y1) * scale;

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

          {instances.map((inst, idx) => {
            const color = INSTANCE_COLORS[idx % INSTANCE_COLORS.length];
            const bboxX = inst.bbox.x1 * scale + offsetX;
            const bboxY = inst.bbox.y1 * scale + offsetY;

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
                  {inst.label || 'Unknown'} {(inst.score * 100).toFixed(0)}%
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
