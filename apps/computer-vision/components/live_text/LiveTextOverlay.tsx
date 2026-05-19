import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { OCRDetection } from 'react-native-executorch';

const ACCENT = '#FFD60A';

type Props = {
  detections: OCRDetection[];
  imageSize: { width: number; height: number };
  canvasSize: { width: number; height: number };
  onCopy: (text: string) => void;
};

export default function LiveTextOverlay({
  detections,
  imageSize,
  canvasSize,
  onCopy,
}: Props) {
  const scale = Math.max(
    canvasSize.width / imageSize.width,
    canvasSize.height / imageSize.height
  );
  const offsetX = (canvasSize.width - imageSize.width * scale) / 2;
  const offsetY = (canvasSize.height - imageSize.height * scale) / 2;

  if (!detections.length || imageSize.width <= 0 || imageSize.height <= 0) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      {detections.map((det) => {
        const { x1, y1, x2, y2 } = det.bbox;
        const left = x1 * scale + offsetX;
        const top = y1 * scale + offsetY;
        const width = (x2 - x1) * scale;
        const height = (y2 - y1) * scale;
        return (
          <Pressable
            key={`${det.bbox.x1},${det.bbox.y1},${det.text}`}
            onPress={() => onCopy(det.text)}
            style={({ pressed }) => [
              styles.box,
              { left, top, width, height },
              pressed && styles.boxPressed,
            ]}
          >
            <Text style={styles.boxText} numberOfLines={1}>
              {det.text}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: ACCENT,
    borderRadius: 5,
    backgroundColor: 'rgba(255,214,10,0.22)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  boxPressed: {
    backgroundColor: 'rgba(255,214,10,0.45)',
  },
  boxText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 3,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
