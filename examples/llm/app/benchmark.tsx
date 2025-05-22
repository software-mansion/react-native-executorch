import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useDefaultHeader } from '../hooks/useDefaultHeader';
import { useLLMStore } from '../store/llmStore';
import { useModelStore } from '../store/modelStore';
import { Model } from '../database/modelRepository';
import {
  BenchmarkResult,
  getAllBenchmarks,
} from '../database/benchmarkRepository';

const BenchmarkScreen: React.FC = () => {
  useDefaultHeader();

  const { runBenchmark, model: activeModel, loadModel, db } = useLLMStore();
  const { downloadedModels: models } = useModelStore();
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [benchmarkResult, setBenchmarkResult] =
    useState<BenchmarkResult | null>(null);
  const [benchmarkList, setBenchmarkList] = useState<BenchmarkResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeModel && !selectedModel) {
      setSelectedModel(activeModel);
    }
  }, [activeModel, selectedModel]);

  const loadBenchmarks = useCallback(async () => {
    if (!db) return;
    const results = await getAllBenchmarks(db);
    setBenchmarkList(results);
  }, [db]);

  useEffect(() => {
    loadBenchmarks();
  }, [db, loadBenchmarks]);

  const handleRun = async () => {
    if (!selectedModel || !db) return;

    setLoading(true);

    await loadModel(selectedModel);

    const result = await runBenchmark();

    setBenchmarkResult(result);

    await loadBenchmarks();

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Benchmark</Text>

      <Text style={styles.label}>Select Model:</Text>
      <View>
        <FlatList
          data={models}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={async () => {
                await loadModel(item);
                setSelectedModel(item);
              }}
              style={[
                styles.modelButton,
                item.id === selectedModel?.id && styles.modelButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.modelButtonText,
                  item.id === selectedModel?.id && styles.modelButtonTextActive,
                ]}
              >
                {item.id}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <TouchableOpacity onPress={handleRun} style={styles.button}>
        <Text style={styles.buttonText}>
          {loading ? 'Running...' : 'Run Benchmark'}
        </Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator
          size="small"
          color="#000"
          style={{ marginTop: 16 }}
        />
      )}

      {benchmarkResult && <BenchmarkResultCard result={benchmarkResult} />}

      <View style={{ marginTop: 24 }}>
        <FlatList
          data={benchmarkList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <BenchmarkItem entry={item} />}
          ListHeaderComponent={
            <>
              <Text style={styles.heading}>Benchmark History</Text>
              {benchmarkList.length === 0 && (
                <Text style={{ color: '#666' }}>No benchmarks saved yet.</Text>
              )}
            </>
          }
          contentContainerStyle={{ paddingBottom: 140 }}
        />
      </View>
    </View>
  );
};

export default BenchmarkScreen;

const BenchmarkResultCard = ({ result }: { result: BenchmarkResult }) => {
  const toFixed = (n: number, d = 2) => Number(n).toFixed(d);
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Results</Text>
      <Text style={styles.row}>
        Total Time:{' '}
        <Text style={styles.value}>{toFixed(result.totalTime / 1000)} s</Text>
      </Text>
      <Text style={styles.row}>
        Time to First Token:{' '}
        <Text style={styles.value}>
          {toFixed(result.timeToFirstToken / 1000)} s
        </Text>
      </Text>
      <Text style={styles.row}>
        Tokens Generated:{' '}
        <Text style={styles.value}>{result.tokensGenerated}</Text>
      </Text>
      <Text style={styles.row}>
        Tokens per Second:{' '}
        <Text style={styles.value}>{toFixed(result.tokensPerSecond)} /s</Text>
      </Text>
      <Text style={styles.row}>
        Peak Memory:{' '}
        <Text style={styles.value}>{toFixed(result.peakMemory)} GB</Text>
      </Text>
    </View>
  );
};

const BenchmarkItem = ({ entry }: { entry: BenchmarkResult }) => {
  const toFixed = (n: number, d = 2) => Number(n).toFixed(d);
  const msToS = (ms: number) => toFixed(ms / 1000);
  return (
    <View style={styles.benchmarkItem}>
      <Text style={styles.itemModel}>Model: {entry.modelId}</Text>
      <Text style={styles.itemStat}>
        TTFT: {toFixed(entry.timeToFirstToken / 1000)} s
      </Text>
      <Text style={styles.itemStat}>
        TPS: {toFixed(entry.tokensPerSecond)} | Tokens: {entry.tokensGenerated}
      </Text>
      <Text style={styles.itemStat}>
        Total Time: {msToS(entry.totalTime)} s
      </Text>
      <Text style={styles.itemStat}>
        Peak Mem: {toFixed(entry.peakMemory)} GB
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 120,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: '600',
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  modelButton: {
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  modelButtonActive: {
    backgroundColor: '#3366FF',
    borderColor: '#3366FF',
  },
  modelButtonText: {
    color: '#333',
  },
  modelButtonTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#3366FF',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  card: {
    marginTop: 24,
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    fontSize: 14,
    marginBottom: 6,
  },
  value: {
    fontWeight: 'bold',
    color: '#222',
  },
  benchmarkItem: {
    backgroundColor: '#F3F3F3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  itemModel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  itemStat: {
    fontSize: 13,
    color: '#444',
  },
});
