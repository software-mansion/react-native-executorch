import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BenchmarkResult } from '../../database/benchmarkRepository';
import ColorPalette from '../../colors';

const BenchmarkItem = ({ entry }: { entry: BenchmarkResult }) => {
  const toFixed = (n: number, d = 2) => Number(n).toFixed(d);
  const msToS = (ms: number) => toFixed(ms / 1000);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Model: {entry.modelId}</Text>
      <Text style={styles.stat}>TTFT: {msToS(entry.timeToFirstToken)} s</Text>
      <Text style={styles.stat}>
        TPS: {toFixed(entry.tokensPerSecond)} | Tokens: {entry.tokensGenerated}
      </Text>
      <Text style={styles.stat}>Time: {msToS(entry.totalTime)} s</Text>
      <Text style={styles.stat}>Peak Mem: {toFixed(entry.peakMemory)} GB</Text>
    </View>
  );
};

export default BenchmarkItem;

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  title: {
    fontWeight: '600',
    marginBottom: 2,
    color: ColorPalette.primary,
  },
  stat: {
    fontSize: 13,
    color: ColorPalette.primary,
  },
});
