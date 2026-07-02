import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../theme';

export interface ModelStatusProps {
  isReady: boolean;
  downloadProgress?: number | null;
  error?: string | null;
  modelTypeLabel?: string;
}

export function ModelStatus({
  isReady,
  downloadProgress,
  error,
  modelTypeLabel = 'model',
}: ModelStatusProps) {
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.statusBox}>
        <ActivityIndicator color="#a0522d" size="small" style={styles.statusIndicator} />
        <Text style={styles.statusText}>
          Downloading {modelTypeLabel}...{' '}
          {downloadProgress ? `${Math.round(downloadProgress)}%` : '0%'}
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe8d6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.small,
    marginBottom: 16,
    width: '100%',
  },
  statusIndicator: {
    marginRight: 8,
  },
  statusText: { fontSize: 13, color: '#a0522d', fontWeight: '500' },
  errorContainer: {
    backgroundColor: theme.colors.errorBackground,
    padding: 12,
    borderRadius: theme.radius.small,
    marginVertical: 8,
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.errorText,
    fontSize: 14,
    textAlign: 'center',
  },
});
