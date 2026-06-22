import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import {
  Canvas,
  Image as SkImage,
  type SkImage as SkiaImageType,
} from '@shopify/react-native-skia';

import { theme } from '../theme';

const VIEW_WIDTH = Dimensions.get('window').width - 32;
const VIEW_HEIGHT = Math.round((VIEW_WIDTH * 16) / 9);

export interface ImageViewportProps {
  skiaImage: SkiaImageType | null;
  overlayImage?: SkiaImageType | null;
  onPressPlaceholder: () => void;
  placeholderText?: string;
  overlayOpacity?: number;
}

export function ImageViewport({
  skiaImage,
  overlayImage,
  onPressPlaceholder,
  placeholderText = 'Tap to select an image from gallery',
  overlayOpacity = 0.8,
}: ImageViewportProps) {
  if (!skiaImage) {
    return (
      <TouchableOpacity style={styles.placeholder} onPress={onPressPlaceholder}>
        <Text style={styles.placeholderText}>{placeholderText}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.canvasWrapper, { width: VIEW_WIDTH, height: VIEW_HEIGHT }]}>
      <Canvas style={styles.canvas}>
        <SkImage
          image={skiaImage}
          fit="contain"
          x={0}
          y={0}
          width={VIEW_WIDTH}
          height={VIEW_HEIGHT}
        />
        {overlayImage && (
          <SkImage
            image={overlayImage}
            fit="contain"
            x={0}
            y={0}
            width={VIEW_WIDTH}
            height={VIEW_HEIGHT}
            opacity={overlayOpacity}
          />
        )}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    height: VIEW_HEIGHT,
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
