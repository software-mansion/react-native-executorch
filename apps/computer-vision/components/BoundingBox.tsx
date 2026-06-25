import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface BoundingBoxProps {
  left: number;
  top: number;
  width: number;
  height: number;
  label?: string;
  borderColor?: string;
  backgroundColor?: string;
  labelTextColor?: string;
}

export function BoundingBox({
  left,
  top,
  width,
  height,
  label,
  borderColor = '#00ff00',
  backgroundColor = 'rgba(0, 255, 0, 0.15)',
  labelTextColor = '#000',
}: BoundingBoxProps) {
  return (
    <View
      style={[
        styles.detectionBox,
        {
          left,
          top,
          width,
          height,
          borderColor,
          backgroundColor,
        },
      ]}
      pointerEvents="none"
    >
      {label ? (
        <View style={[styles.boxLabelBadge, { backgroundColor: borderColor }]}>
          <Text style={[styles.boxLabelText, { color: labelTextColor }]}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  detectionBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
  },
  boxLabelBadge: {
    position: 'absolute',
    top: -20,
    left: -2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  boxLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
