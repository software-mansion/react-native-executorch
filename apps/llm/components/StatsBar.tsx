import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LLMStats } from '../hooks/useLLMStats';

interface Props {
  stats: LLMStats | null;
}

export function StatsBar({ stats }: Props) {
  if (!stats) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.stat}>TTFT: {stats.ttft} ms</Text>
      <Text style={styles.separator}>·</Text>
      <Text style={styles.stat}>{stats.tokensPerSec} tok/s</Text>
      <Text style={styles.separator}>·</Text>
      <Text style={styles.stat}>~{stats.totalTokens} tokens</Text>
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
