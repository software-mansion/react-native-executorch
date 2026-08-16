/**
 * The harness UI.
 *
 * Deliberately thin. The app's product is the JSON on stdout and at the
 * collector; this screen exists so a human watching a 20-minute run on a desk
 * can see which case is executing and spot a failure without tailing a log.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';

import { config } from './src/config';
import { runSuite } from './src/runner';
import type { CaseResult } from './src/report';
import { selectCases } from './src/suite';

type Phase = { readonly caseId: string; readonly phase: string } | null;

export default function App() {
  // A full suite runs for the better part of an hour. Without this the screen
  // turns off partway, Android freezes the app, and the run stops dead with its
  // remaining cases unreported.
  useKeepAwake();

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [phase, setPhase] = useState<Phase>(null);
  const [results, setResults] = useState<CaseResult[]>([]);
  const [fatal, setFatal] = useState<string | null>(null);
  const started = useRef(false);

  const planned = selectCases(config.suite, config.only);

  const start = useCallback(async () => {
    if (started.current) return;
    started.current = true;
    setRunning(true);
    setFatal(null);
    setResults([]);
    setDone(false);

    try {
      await runSuite({
        onPhase: (caseId, name) => setPhase({ caseId, phase: name }),
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

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>ExecuTorch benchmarks</Text>
        <Text style={styles.meta}>
          {config.label} · {config.only.length > 0 ? 'custom' : config.suite} · {config.iterations}{' '}
          iterations · {planned.length} cases
        </Text>
        <Text style={styles.meta}>sink: {config.sink ?? 'console only'}</Text>

        <TouchableOpacity
          style={[styles.button, running && styles.buttonDisabled]}
          onPress={start}
          disabled={running}
        >
          <Text style={styles.buttonText}>{running ? 'Running…' : 'Run suite'}</Text>
        </TouchableOpacity>

        {phase && (
          <Text style={styles.phase}>
            {phase.caseId} — {phase.phase}
          </Text>
        )}
        {done && <Text style={styles.done}>Run complete.</Text>}
        {fatal && <Text style={styles.error}>{fatal}</Text>}

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {planned.map((benchCase) => {
            const result = results.find((entry) => entry.id === benchCase.id);
            return (
              <View key={benchCase.id} style={styles.row}>
                <Text style={styles.rowId}>{benchCase.id}</Text>
                {!result && <Text style={styles.rowPending}>pending</Text>}
                {result?.status === 'error' && <Text style={styles.error}>{result.error}</Text>}
                {result?.status === 'ok' && (
                  <Text style={styles.rowStats}>
                    pipeline {result.pipeline?.median ?? 0} ms · load {result.taskLoadMs} ms
                    {result.memory ? ` · peak ${result.memory.peakMb} MB` : ''}
                  </Text>
                )}
              </View>
            );
          })}
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
  phase: { marginTop: 12, fontSize: 13, color: '#001a72' },
  done: { marginTop: 12, fontSize: 13, fontWeight: '600', color: '#2b8a3e' },
  error: { marginTop: 4, fontSize: 12, color: '#c92a2a' },
  list: { flex: 1, marginTop: 16 },
  listContent: { paddingBottom: 24 },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  rowId: { fontSize: 13, fontWeight: '600' },
  rowPending: { fontSize: 12, color: '#adb5bd' },
  rowStats: { fontSize: 12, color: '#495057' },
});
