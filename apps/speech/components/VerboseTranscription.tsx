import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
  TranscriptionSegment,
  TranscriptionResult,
  Word,
} from 'react-native-executorch';

export const VerboseTranscription = ({
  data,
}: {
  data: TranscriptionResult;
}) => {
  if (!data) return null;
  console.log(data);
  return (
    <View style={styles.container}>
      {/* Global Metadata */}
      <View style={styles.metaContainer}>
        <Text style={styles.label}>Full Text:</Text>
        <Text style={styles.text}>{data.text}</Text>

        <View style={styles.row}>
          <Text style={styles.metaItem}>
            Language: {data.language || 'N/A'}
          </Text>
          <Text style={styles.metaItem}>
            Duration: {data.duration?.toFixed(2)}s
          </Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>
        Segments ({data.segments?.length || 0})
      </Text>

      {/* Segments List */}
      {data.segments?.map((seg: TranscriptionSegment, index: number) => (
        <View key={index} style={styles.segmentCard}>
          <View style={styles.segmentHeader}>
            <Text style={styles.timeBadge}>
              {seg.start.toFixed(2)}s - {seg.end.toFixed(2)}s
            </Text>
            <Text style={styles.segmentId}>ID: {index}</Text>
          </View>

          <Text style={styles.segmentText}>"{seg.text}"</Text>

          {seg.words && seg.words.length > 0 && (
            <View style={styles.wordsContainer}>
              <Text style={styles.statLabel}>Word Timestamps:</Text>
              <View style={styles.wordsGrid}>
                {seg.words.map((w: Word, wIdx: number) => (
                  <View key={wIdx} style={styles.wordChip}>
                    <Text style={styles.wordText}>{w.word.trim()}</Text>
                    <Text style={styles.wordTime}>{w.start.toFixed(2)}s</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Verbose Statistics */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Avg LogProb</Text>
              <Text style={styles.statValue}>
                {seg.avg_logprob?.toFixed(4)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>No Speech</Text>
              <Text style={styles.statValue}>
                {seg.no_speech_prob?.toFixed(4)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Temp</Text>
              <Text style={styles.statValue}>
                {seg.temperature?.toFixed(2)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Compr.</Text>
              <Text style={styles.statValue}>
                {seg.compression_ratio?.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Tokens (Optional: Remove if too noisy) */}
          <View style={styles.tokensContainer}>
            <Text style={styles.tokenLabel}>Tokens: </Text>
            <Text style={styles.tokenList}>[{seg.tokens?.join(', ')}]</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  metaContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
  },
  label: {
    fontWeight: 'bold',
    color: '#0f186e',
    marginBottom: 4,
  },
  text: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaItem: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e1e4e8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f186e',
    marginBottom: 8,
    marginTop: 8,
  },
  segmentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e4e8',
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#0f186e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  segmentId: {
    fontSize: 12,
    color: '#888',
  },
  segmentText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
  },
  statValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#444',
  },
  tokensContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666',
  },
  tokenList: {
    fontSize: 10,
    color: '#888',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  wordsContainer: {
    marginVertical: 8,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  wordChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e1e4e8',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  wordText: {
    fontSize: 12,
    color: '#333',
  },
  wordTime: {
    fontSize: 9,
    color: '#888',
    marginTop: 1,
  },
});
