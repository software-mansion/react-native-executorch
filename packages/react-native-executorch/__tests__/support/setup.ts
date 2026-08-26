/**
 * Jest setup: installs the fake native runtime and resets every piece of
 * shared state between tests.
 *
 * This runs before each test file is evaluated, which matters because
 * `src/native/bridge.ts` throws at import time when `__rnexecutorch_jsi__` is
 * missing — so the global has to exist before the first `import` of any `src/`
 * module is resolved.
 */
import { cleanup } from '@testing-library/react-native';

import { fakeJsi, installFakeJsi } from './fakeJsi';
import { fakeFetch, fakeFs, fakeNet } from './blobUtilMock';
import { disposeTracked } from './lifetime';

installFakeJsi();

let leakCheckEnabled = true;

/**
 * Opts the current test out of the automatic native-leak assertion. Use it
 * when a test deliberately abandons a pipeline without disposing it.
 */
export function allowNativeLeaks(): void {
  leakCheckEnabled = false;
}

beforeEach(() => {
  leakCheckEnabled = true;
  fakeJsi.reset();
  fakeFs.reset();
  fakeNet.reset();
  globalThis.fetch = fakeFetch as unknown as typeof globalThis.fetch;
});

// Native memory is not garbage collected, so anything a test allocates through
// the fake and does not dispose is a leak in the code under test. Checking it
// globally means every pipeline suite gets disposal coverage for free.
afterEach(async () => {
  // Unmount any rendered hook before the leak check: a component still mounted
  // is still holding its pipeline, which would read as a leak. React Native
  // Testing Library's own auto-cleanup runs after this hook, too late to help.
  await cleanup();
  disposeTracked();
  if (!leakCheckEnabled) return;

  const tensors = fakeJsi.liveTensorDescriptions();
  const models = fakeJsi.liveModels();
  const tokenizers = fakeJsi.liveTokenizers();
  const runners = fakeJsi.liveRunners();
  const phonemizers = fakeJsi.livePhonemizers();
  if (
    tensors.length === 0 &&
    models.length === 0 &&
    tokenizers.length === 0 &&
    runners.length === 0 &&
    phonemizers.length === 0
  ) {
    return;
  }

  throw new Error(
    [
      'Native resources were left undisposed by this test:',
      tensors.length > 0 ? `  tensors: ${tensors.join(', ')}` : '',
      models.length > 0 ? `  models: ${models.join(', ')}` : '',
      tokenizers.length > 0 ? `  tokenizers: ${tokenizers.join(', ')}` : '',
      runners.length > 0 ? `  LLM runners: ${runners.join(', ')}` : '',
      phonemizers.length > 0 ? `  phonemizers: ${phonemizers.join(', ')}` : '',
      'Dispose the pipeline, or call allowNativeLeaks() if the leak is the point of the test.',
    ]
      .filter(Boolean)
      .join('\n')
  );
});
