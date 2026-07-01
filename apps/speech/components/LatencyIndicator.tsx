import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface LatencyIndicatorProps {
  latency: number | null;
}

export function LatencyIndicator({ latency }: LatencyIndicatorProps) {
  if (latency === null) return null;

  return (
    <View style={styles.perfBox}>
      <Text style={styles.perfLabel}>Total Pipeline Latency:</Text>
      <Text style={styles.perfValue}>{latency} ms</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  perfBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    borderColor: '#c2d7fa',
    borderWidth: 1,
  },
  perfLabel: { fontSize: 14, fontWeight: '600', color: '#1a73e8' },
  perfValue: { fontSize: 14, fontWeight: '700', color: '#1a73e8' },
});
