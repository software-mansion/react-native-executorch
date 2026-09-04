/**
 * The harness UI.
 *
 * Deliberately thin. The app's product is the JSON on stdout and at the
 * collector; this screen exists so a human watching a multi-hour run on a desk
 * can see how far through it is, which model is executing, and whether the
 * device is currently parked at the thermal gate rather than hung.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';

import { config } from './src/config';
import { runSuite } from './src/runner';
import type { CaseResult, Progress } from './src/report';
import { selectCases } from './src/suite';

interface Phase {
  readonly caseId: string;
  readonly phase: string;
  readonly progress: Progress;
}

/**
 * `12 / 163 models · run 2 / 3` — the line a human across the desk reads.
 * @param props The current phase, and how many measurements have landed.
 * @returns The progress block, or nothing when the run is idle.
 */
function ProgressHeader({ phase, done }: { phase: Phase | null; done: number }) {
  if (!phase) return null;
  const { caseIndex, caseCount, repeat, repeats } = phase.progress;
  return (
    <View style={styles.progress}>
      <Text style={styles.progressCount}>
        {caseIndex} / {caseCount} models · run {repeat} / {repeats}
      </Text>
      <Text style={styles.progressBar}>
        {'█'.repeat(Math.round((caseIndex / Math.max(caseCount, 1)) * 24)).padEnd(24, '░')}
      </Text>
      <Text style={styles.progressCase}>{phase.caseId}</Text>
      <Text style={styles.progressPhase}>
        {phase.phase === 'cooling' ? `waiting for ${config.maxTempC}C` : phase.phase} · {done}{' '}
        measurements taken
      </Text>
    </View>
  );
}

export default function App() {
  // A whole-estate run takes hours. Without this the screen turns off partway,
  // Android freezes the app, and the run stops dead with its cases unreported.
  useKeepAwake();

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [results, setResults] = useState<CaseResult[]>([]);
  const [fatal, setFatal] = useState<string | null>(null);
  const started = useRef(false);

  const selection = useMemo(
    () =>
      selectCases({
        suite: config.suite,
        only: config.only,
        maxBytes: config.maxBytes,
        tasks: config.tasks,
        backends: config.backends,
      }),
    []
  );

  const start = useCallback(async () => {
    if (started.current) return;
    started.current = true;
    setRunning(true);
    setFatal(null);
    setResults([]);
    setDone(false);

    try {
      await runSuite({
        onPhase: (caseId, name, progress) => setPhase({ caseId, phase: name, progress }),
        onCase: (result) => setResults((previous) => [...previous, result]),
      });
      setDone(true);
    } catch (error) {
      setFatal(String(error));
    } finally {
      setPhase(null);
      setRunning(false);
      started.current = false;
    }
  }, []);

  useEffect(() => {
    if (config.autostart) start();
  }, [start]);

  // Newest first: on a run of several hundred measurements the interesting row
  // is the one that just landed, and scrolling to the bottom of a live list to
  // find it is a losing game.
  const recent = results.slice(-40).reverse();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>ExecuTorch benchmarks</Text>
        <Text style={styles.meta}>
          {config.label} · {config.only.length > 0 ? 'custom' : config.suite} ·{' '}
          {selection.cases.length} models × {config.repeats} runs · {config.iterations} iterations
        </Text>
        <Text style={styles.meta}>
          sink: {config.sink ?? 'console only'}
          {selection.skipped.length > 0 ? ` · ${selection.skipped.length} skipped` : ''}
        </Text>

        <TouchableOpacity
          style={[styles.button, running && styles.buttonDisabled]}
          onPress={start}
          disabled={running}
        >
          <Text style={styles.buttonText}>{running ? 'Running…' : 'Run suite'}</Text>
        </TouchableOpacity>

        <ProgressHeader phase={phase} done={results.length} />
        {done && <Text style={styles.done}>Run complete.</Text>}
        {fatal && <Text style={styles.error}>{fatal}</Text>}

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {recent.map((result) => (
            <View key={`${result.id}#${result.progress.repeat}`} style={styles.row}>
              <Text style={styles.rowId}>
                {result.id} <Text style={styles.rowRun}>run {result.progress.repeat}</Text>
              </Text>
              {result.status === 'error' && <Text style={styles.error}>{result.error}</Text>}
              {result.status === 'skipped' && <Text style={styles.rowPending}>{result.error}</Text>}
              {result.status === 'ok' && (
                <Text style={styles.rowStats}>
                  pipeline {result.pipeline?.median ?? 0} ms · load {Math.round(result.taskLoadMs)}{' '}
                  ms
                  {result.memory ? ` · peak ${result.memory.peakMb} MB` : ''}
                  {result.gate?.temperatureC != null ? ` · ${result.gate.temperatureC}C` : ''}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: '700', marginTop: 12 },
  meta: { fontSize: 12, color: '#666', marginTop: 4 },
  button: {
    marginTop: 16,
    backgroundColor: '#001a72',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#9aa0b4' },
  buttonText: { color: '#fff', fontWeight: '600' },
  progress: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f1f3f9',
  },
  progressCount: { fontSize: 17, fontWeight: '700', color: '#001a72' },
  progressBar: { fontSize: 12, color: '#001a72', marginTop: 4, letterSpacing: -1 },
  progressCase: { fontSize: 13, marginTop: 6, color: '#333' },
  progressPhase: { fontSize: 12, marginTop: 2, color: '#666' },
  done: { marginTop: 12, fontSize: 13, fontWeight: '600', color: '#2b8a3e' },
  error: { marginTop: 4, fontSize: 12, color: '#c92a2a' },
  list: { flex: 1, marginTop: 16 },
  listContent: { paddingBottom: 24 },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  rowId: { fontSize: 13, fontWeight: '600' },
  rowRun: { fontSize: 11, fontWeight: '400', color: '#868e96' },
  rowPending: { fontSize: 12, color: '#adb5bd' },
  rowStats: { fontSize: 12, color: '#495057' },
});
