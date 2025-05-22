import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BenchmarkResult } from '../../database/benchmarkRepository';
import ColorPalette from '../../colors';

const toFixed = (n: number, d = 2) => Number(n).toFixed(d);

const BenchmarkResultCard = ({ result }: { result: BenchmarkResult }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>🧪 Latest Result</Text>
    <Text style={styles.row}>
      Total Time:{' '}
      <Text style={styles.value}>{toFixed(result.totalTime / 1000)} s</Text>
    </Text>
    <Text style={styles.row}>
      TTFT:{' '}
      <Text style={styles.value}>
        {toFixed(result.timeToFirstToken / 1000)} s
      </Text>
    </Text>
    <Text style={styles.row}>
      Tokens: <Text style={styles.value}>{result.tokensGenerated}</Text>
    </Text>
    <Text style={styles.row}>
      TPS: <Text style={styles.value}>{toFixed(result.tokensPerSecond)}</Text>
    </Text>
    <Text style={styles.row}>
      Peak Mem:{' '}
      <Text style={styles.value}>{toFixed(result.peakMemory)} GB</Text>
    </Text>
  </View>
);

export default BenchmarkResultCard;

const styles = StyleSheet.create({
  card: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: ColorPalette.seaBlueLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ColorPalette.seaBlueDark,
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 12,
    color: ColorPalette.primary,
  },
  row: {
    fontSize: 14,
    color: ColorPalette.blueDark,
    marginBottom: 6,
  },
  value: {
    fontWeight: 'bold',
    color: ColorPalette.primary,
  },
});
