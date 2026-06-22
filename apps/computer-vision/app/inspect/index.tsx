import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { inspectModel, type TensorMeta } from 'react-native-executorch';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ColorPalette } from '../../theme';

type InspectionResult = Awaited<ReturnType<typeof inspectModel>>;

function InspectContent() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInspect = async (targetUrl: string) => {
    if (!targetUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await inspectModel(targetUrl.trim());
      setResult(res);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const renderTensorList = (tensors: TensorMeta[] | undefined, title: string) => {
    if (!tensors || tensors.length === 0) return null;
    return (
      <View style={styles.tensorsSection}>
        <Text style={styles.tensorsSectionTitle}>{title}</Text>
        {tensors.map((tensor, idx) => (
          <View key={idx} style={styles.tensorCard}>
            <View style={styles.tensorHeader}>
              <Text style={styles.tensorName}>
                {tensor.name || `${title.slice(0, -1)} #${idx}`}
              </Text>
              <Text style={styles.tensorDtype}>{tensor.dtype}</Text>
            </View>
            <View style={styles.tensorDetails}>
              <Text style={styles.tensorDetailText}>
                Shape: <Text style={styles.tensorDetailValue}>[{tensor.shape.join(', ')}]</Text>
              </Text>
              <Text style={styles.tensorDetailText}>
                Bytes: <Text style={styles.tensorDetailValue}>{tensor.nbytes}</Text>
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Model URL Inspector</Text>
        <Text style={styles.cardDescription}>
          Paste a URL to an ExecuTorch (.pte) model below to download and inspect its metadata and
          methods.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="https://example.com/model.pte"
          placeholderTextColor="#999"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          multiline
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => handleInspect(url)}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Inspect Model</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {result && (
        <View style={styles.resultsCard}>
          <Text style={styles.resultsHeader}>Inspection Results</Text>
          <Text style={styles.sourceLabel}>Source URL:</Text>
          <Text style={styles.sourceValue}>{result.source}</Text>

          <Text style={styles.methodsTitle}>Methods ({result.methods.length})</Text>

          {result.methods.map((method, mIdx) => (
            <View key={mIdx} style={styles.methodContainer}>
              <View style={styles.methodHeader}>
                <Text style={styles.methodName}>{method.name}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Method</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{method.meta.numInputs}</Text>
                  <Text style={styles.statLabel}>Inputs</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{method.meta.numOutputs}</Text>
                  <Text style={styles.statLabel}>Outputs</Text>
                </View>
              </View>

              {method.meta.usesBackend && Object.keys(method.meta.usesBackend).length > 0 && (
                <View style={styles.metaSection}>
                  <Text style={styles.metaSectionTitle}>Backends Used:</Text>
                  <View style={styles.tagRow}>
                    {Object.entries(method.meta.usesBackend).map(([backend, used]) => (
                      <View
                        key={backend}
                        style={[styles.tag, used ? styles.tagActive : styles.tagInactive]}
                      >
                        <Text style={used ? styles.tagActiveText : styles.tagInactiveText}>
                          {backend}: {used ? 'Yes' : 'No'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {renderTensorList(method.meta.inputTensorMeta, 'Input Tensors')}
              {renderTensorList(method.meta.outputTensorMeta, 'Output Tensors')}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export default function InspectScreen() {
  return (
    <ScreenWrapper>
      <InspectContent />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ColorPalette.strongPrimary,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f1f3f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#212529',
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  button: {
    backgroundColor: ColorPalette.primary,
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ColorPalette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  errorContainer: {
    backgroundColor: '#ffe3e3',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#d63031',
    fontSize: 14,
    textAlign: 'center',
  },
  resultsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultsHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingBottom: 10,
  },
  sourceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#868e96',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sourceValue: {
    fontSize: 12,
    color: '#495057',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 20,
  },
  methodsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 12,
  },
  methodContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '700',
    color: ColorPalette.primary,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#e8ecf8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ColorPalette.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
  statLabel: {
    fontSize: 11,
    color: '#868e96',
    fontWeight: '500',
    marginTop: 2,
  },
  metaSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  metaSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  tagActive: {
    backgroundColor: '#ebfbee',
    borderColor: '#b2f2bb',
  },
  tagInactive: {
    backgroundColor: '#f1f3f5',
    borderColor: '#e9ecef',
  },
  tagActiveText: {
    fontSize: 11,
    color: '#2b8a3e',
    fontWeight: '600',
  },
  tagInactiveText: {
    fontSize: 11,
    color: '#868e96',
  },
  tensorsSection: {
    marginTop: 14,
  },
  tensorsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#495057',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tensorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tensorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    marginRight: 8,
  },
  tensorDtype: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fd7e14',
    backgroundColor: '#fff9db',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tensorDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tensorDetailText: {
    fontSize: 11,
    color: '#868e96',
  },
  tensorDetailValue: {
    color: '#495057',
    fontWeight: '600',
  },
});
