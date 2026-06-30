import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import {
  Canvas,
  Image as SkImage,
  BlendColor,
  Path,
  Skia,
  type SkImage as SkiaImageType,
} from '@shopify/react-native-skia';

import { theme } from '../theme';

const VIEW_WIDTH = Dimensions.get('window').width - 32;
const DEFAULT_VIEW_HEIGHT = Math.round((VIEW_WIDTH * 16) / 9);

/** A 2D point in the displayed image's pixel coordinates. */
type Point = { readonly x: number; readonly y: number };
/** A polygon (e.g. an OCR quad) in the displayed image's pixel coordinates. */
type Polygon = readonly Point[];

export interface ImageViewportProps {
  skiaImage: SkiaImageType | null;
  overlayImage?: SkiaImageType | null;
  masks?: { image: SkiaImageType; color: string }[];
  onPressPlaceholder: () => void;
  placeholderText?: string;
  overlayOpacity?: number;
  children?: React.ReactNode;
  /** Height of the preview box in px. Defaults to a 16:9 box. */
  height?: number;
  /** Polygons (in the displayed image's px) to stroke over the image, e.g. OCR quads. */
  boxes?: readonly Polygon[];
}

export function ImageViewport({
  skiaImage,
  overlayImage,
  masks,
  onPressPlaceholder,
  placeholderText = 'Tap to select an image from gallery',
  overlayOpacity = 0.8,
  children,
  height,
  boxes,
}: ImageViewportProps) {
  const viewHeight = height ?? DEFAULT_VIEW_HEIGHT;

  // Map image-pixel polygons into canvas space using the same contain-fit
  // transform Skia uses to draw the image, then build one stroked path.
  const boxesPath = useMemo(() => {
    if (!skiaImage || !boxes?.length) return null;
    const ow = skiaImage.width();
    const oh = skiaImage.height();
    if (ow === 0 || oh === 0) return null;
    const scale = Math.min(VIEW_WIDTH / ow, viewHeight / oh);
    const dx = (VIEW_WIDTH - ow * scale) / 2;
    const dy = (viewHeight - oh * scale) / 2;

    const path = Skia.Path.Make();
    for (const poly of boxes) {
      if (poly.length < 2) continue;
      path.moveTo(dx + poly[0]!.x * scale, dy + poly[0]!.y * scale);
      for (let i = 1; i < poly.length; i++) {
        path.lineTo(dx + poly[i]!.x * scale, dy + poly[i]!.y * scale);
      }
      path.close();
    }
    return path;
  }, [skiaImage, boxes, viewHeight]);

  if (!skiaImage) {
    return (
      <TouchableOpacity
        style={[styles.placeholder, { height: viewHeight }]}
        onPress={onPressPlaceholder}
      >
        <Text style={styles.placeholderText}>{placeholderText}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.canvasWrapper, { width: VIEW_WIDTH, height: viewHeight }]}>
      <Canvas style={styles.canvas}>
        <SkImage
          image={skiaImage}
          fit="contain"
          x={0}
          y={0}
          width={VIEW_WIDTH}
          height={viewHeight}
        />
        {overlayImage && (
          <SkImage
            image={overlayImage}
            fit="contain"
            x={0}
            y={0}
            width={VIEW_WIDTH}
            height={viewHeight}
            opacity={overlayOpacity}
          />
        )}
        {masks &&
          masks.map((item, index) => (
            <SkImage
              key={index}
              image={item.image}
              fit="contain"
              x={0}
              y={0}
              width={VIEW_WIDTH}
              height={viewHeight}
              opacity={overlayOpacity}
            >
              <BlendColor color={item.color} mode="srcIn" />
            </SkImage>
          ))}
        {boxesPath && <Path path={boxesPath} style="stroke" strokeWidth={2} color="#39FF14" />}
      </Canvas>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.radius.large,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.placeholderBackground,
    marginBottom: 20,
  },
  placeholderText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  canvasWrapper: {
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: theme.radius.large,
    overflow: 'hidden',
    marginBottom: 20,
  },
  canvas: { width: '100%', height: '100%' },
});
