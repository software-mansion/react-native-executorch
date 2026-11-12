import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text } from 'react-native';
import { Asset } from 'expo-asset';
import { loadModel, math, setTelemetryEnabled, tensor, wrapAsync } from 'react-native-executorch';
import config from './smoke-config.json';

function check(condition, message) {
  'worklet';
  if (!condition) throw new Error(message);
}

async function runSmoke() {
  setTelemetryEnabled(false);
  const checks = [];
  const input = tensor('float32', [3], new Float32Array([1, 2, 3]));
  const output = tensor('float32', [3]);
  try {
    math.softmax(input, output);
    const result = output.getData(new Float32Array(3));
    const expected = [0.09003057, 0.24472847, 0.66524096];
    check(
      result.every((value, i) => Math.abs(value - expected[i]) < 1e-5),
      'Native softmax returned incorrect values'
    );
    checks.push('tensor');
  } finally {
    output.dispose();
    input.dispose();
  }

  const backing = new Float32Array([99, 1, 2, 3, 99]);
  const view = new Float32Array(backing.buffer, 4, 3);
  const values = await wrapAsync((data) => {
    'worklet';
    check(
      data.length === 3 && data[0] === 1 && data[2] === 3,
      'Worklet serialization changed the typed-array view'
    );
    const t = tensor('float32', [3], data);
    try {
      return Array.from(t.getData(new Float32Array(3)));
    } finally {
      t.dispose();
    }
  })(view);
  check(values.join(',') === '1,2,3', 'Worklet native tensor round trip failed');
  checks.push('worklet');

  const asset = Asset.fromModule(require('./smoke-model.pte'));
  await asset.downloadAsync();
  check(asset.localUri?.startsWith('file://'), 'Bundled model did not resolve to a local file');
  const modelPath = decodeURIComponent(asset.localUri.slice('file://'.length));
  const inference = await wrapAsync((path) => {
    'worklet';
    let model, src, dst;
    try {
      model = loadModel(path);
      check(
        model.backends.forward.includes('XnnpackBackend'),
        'Fixture did not load the XNNPACK backend'
      );
      src = tensor('float32', [1, 3, 256, 256], new Float32Array(3 * 256 * 256));
      // A no-op inference must not pass because of a zero-initialized buffer.
      dst = tensor('float32', [1, 1, 256, 256], new Float32Array(256 * 256).fill(NaN));
      model.execute('forward', [src], [dst]);
      const result = dst.getData(new Float32Array(256 * 256));
      check(
        result.every((v) => Number.isFinite(v) && v >= 0 && v <= 1),
        'Inference did not write finite probabilities to every output'
      );
      return { elements: result.length, backend: model.backends.forward };
    } finally {
      dst?.dispose();
      src?.dispose();
      model?.dispose();
    }
  })(modelPath);
  checks.push('model');
  return { status: 'pass', checks, inference };
}

export default function App() {
  const [status, setStatus] = useState('Running native smoke tests');
  useEffect(() => {
    runSmoke()
      .catch((error) => ({ status: 'fail', error: String(error?.stack ?? error) }))
      .then(async (result) => {
        setStatus(JSON.stringify(result));
        await fetch(`http://127.0.0.1:${config.port}/result/${config.token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result),
        });
      })
      .catch((error) => setStatus(`Reporting failed: ${String(error)}`));
  }, []);
  return (
    <SafeAreaView>
      <Text testID="smoke-result">{status}</Text>
    </SafeAreaView>
  );
}
