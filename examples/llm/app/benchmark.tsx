import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useDefaultHeader } from '../hooks/useDefaultHeader';
import { useLLMStore } from '../store/llmStore';
import { useModelStore } from '../store/modelStore';
import { Model } from '../database/modelRepository';
import {
  BenchmarkResult,
  getAllBenchmarks,
} from '../database/benchmarkRepository';
import ColorPalette from '../colors';
import BenchmarkItem from '../components/benchmark/BenchmarkItem';
import BenchmarkResultCard from '../components/benchmark/BenchmarkResultCard';
import ModelSelectorModal from '../components/chat-screen/ModelSelector';

const BenchmarkScreen = () => {
  useDefaultHeader();
  const { runBenchmark, loadModel, db, model: activeModel } = useLLMStore();
  const { downloadedModels: models } = useModelStore();

  const [selectedModel, setSelectedModel] = useState<Model | null>(activeModel);
  const [benchmarkResult, setBenchmarkResult] =
    useState<BenchmarkResult | null>(null);
  const [benchmarkList, setBenchmarkList] = useState<BenchmarkResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);

  const loadBenchmarks = useCallback(async () => {
    if (!db) return;
    const history = await getAllBenchmarks(db);
    setBenchmarkList(history);
  }, [db]);

  useEffect(() => {
    loadBenchmarks();
  }, [loadBenchmarks]);

  const handleRun = async () => {
    if (!selectedModel) return;
    setLoading(true);

    const result = await runBenchmark();
    setBenchmarkResult(result);
    await loadBenchmarks();

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.infoText}>Please select a model to benchmark:</Text>

        <TouchableOpacity
          onPress={() => setModelModalVisible(true)}
          style={styles.modelSelectorButton}
        >
          <Text style={styles.modelSelectorButtonText}>
            {selectedModel ? `Model: ${selectedModel.id}` : 'Select a model'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRun}
          style={styles.runButton}
          disabled={loading || !selectedModel}
        >
          <Text style={styles.runButtonText}>
            {loading ? 'Running...' : 'Run Benchmark'}
          </Text>
        </TouchableOpacity>

        {loading && (
          <ActivityIndicator
            color={ColorPalette.primary}
            style={{ marginTop: 12 }}
          />
        )}

        {benchmarkResult && <BenchmarkResultCard result={benchmarkResult} />}
      </View>

      <Text style={styles.historyHeading}>📊 Benchmark History</Text>

      <FlatList
        data={benchmarkList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <BenchmarkItem entry={item} />}
        ListEmptyComponent={
          <Text style={styles.noDataText}>No benchmarks saved yet.</Text>
        }
      />

      <ModelSelectorModal
        visible={modelModalVisible}
        models={models}
        onClose={() => setModelModalVisible(false)}
        onSelect={async (model) => {
          setModelModalVisible(false);
          await loadModel(model);
          setSelectedModel(model);
        }}
      />
    </View>
  );
};

export default BenchmarkScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  headerBox: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: ColorPalette.seaBlueDark,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    color: ColorPalette.blueDark,
  },
  modelSelectorButton: {
    backgroundColor: ColorPalette.primary,
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  modelSelectorButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  runButton: {
    backgroundColor: ColorPalette.primary,
    padding: 12,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  runButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  historyHeading: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    color: ColorPalette.primary,
  },
  noDataText: {
    color: ColorPalette.blueDark,
    textAlign: 'center',
    marginTop: 16,
  },
});
