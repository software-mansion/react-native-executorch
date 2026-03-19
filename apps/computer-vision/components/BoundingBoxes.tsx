import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Detection } from 'react-native-executorch';
import { labelColor, labelColorBg } from './utils/colors';

interface Props {
  detections: Detection[];
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  mirrorLabels?: boolean;
}

export default function BoundingBoxes({
  detections,
  scaleX,
  scaleY,
  offsetX,
  offsetY,
  mirrorLabels = false,
}: Props) {
  return (
    <>
      {detections.map((det, i) => {
        const left = det.bbox.x1 * scaleX + offsetX;
        const top = det.bbox.y1 * scaleY + offsetY;
        const width = (det.bbox.x2 - det.bbox.x1) * scaleX;
        const height = (det.bbox.y2 - det.bbox.y1) * scaleY;
        const labelTop = top < 26 ? top + height + 2 : top - 26;

        return (
          <React.Fragment key={i}>
            <View
              style={[
                styles.bbox,
                {
                  left,
                  top,
                  width,
                  height,
                  borderColor: labelColor(det.label),
                },
              ]}
            />
            <View
              style={[
                styles.label,
                {
                  left,
                  top: labelTop,
                  backgroundColor: labelColorBg(det.label),
                },
                mirrorLabels && { transform: [{ scaleX: -1 }] },
              ]}
            >
              <Text style={styles.labelText} numberOfLines={1}>
                {det.label} ({(det.score * 100).toFixed(1)}%)
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  bbox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
  },
  label: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
});
