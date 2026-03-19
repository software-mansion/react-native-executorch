import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  inferenceTime: number | null;
  detectionCount?: number | null;
}

export function StatsBar({ inferenceTime, detectionCount }: Props) {
  if (inferenceTime === null) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.stat}>Inference: {inferenceTime} ms</Text>
      {detectionCount != null && (
        <>
          <Text style={styles.separator}>·</Text>
          <Text style={styles.stat}>
            {detectionCount} detection{detectionCount !== 1 ? 's' : ''}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  stat: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  separator: {
    fontSize: 13,
    color: '#94A3B8',
  },
});
