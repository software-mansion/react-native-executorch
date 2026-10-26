import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript';

// Load the real driver without booting React Native. The doubles deliberately
// expose only the current runner stats, so obsolete stats fields fail the test.
function fixture() {
  const state = { resets: 0, clears: 0, disposed: 0, pos: 0, tokens: 64, promptTokens: 12 };
  const preprocessor = {
    process(history, lastKMessages) {
      assert.equal(history.length, 1);
      assert.equal(lastKMessages, 1);
      assert.equal(history[0].role, 'user');
      assert.equal(history[0].content, 'List three uses for a paperclip.');
      return 'formatted independent prompt';
    },
    clear() {
      state.clears++;
    },
    dispose() {
      state.disposed++;
    },
  };
  const runner = {
    reset() {
      state.resets++;
      state.pos = 0;
    },
    generate(prompt, options, onToken) {
      assert.equal(state.pos, 0, 'each generation must start with an empty KV cache');
      assert.equal(prompt, 'formatted independent prompt');
      assert.equal(options.maxNewTokens, 64);
      assert.equal(options.temperature, 0);
      assert.equal(options.ignoreEos, true);
      state.pos += state.tokens;
      onToken('first');
      return {
        numTokens: state.tokens,
        durationMs: 100,
        tokensPerSecond: 640,
        prefill: { numTokens: state.promptTokens, durationMs: 3, tokensPerSecond: 4000 },
      };
    },
    dispose() {
      state.disposed++;
    },
  };
  const library = {
    createResourceScope() {
      const owned = [];
      return {
        track(value) {
          owned.push(value);
          return value;
        },
        dispose() {
          owned
            .splice(0)
            .reverse()
            .forEach((value) => value.dispose());
        },
      };
    },
    defaultWorkletRuntime: {},
    wrapAsync:
      (fn) =>
      async (...args) =>
        fn(...args),
    llm: {
      parseTokenizerConfig: () => ({ chatTemplate: 'test' }),
      createChatPreprocessor: () => preprocessor,
      createLLMRunner: async () => runner,
    },
  };
  const inputs = {
    syntheticWaveform: () => [],
    LLM_PROMPT: 'List three uses for a paperclip.',
    LLM_MAX_NEW_TOKENS: 64,
  };
  const exports = {};
  const code = transpileModule(
    readFileSync(new URL('../src/drivers.ts', import.meta.url), 'utf8'),
    {
      compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
    }
  ).outputText;
  runInNewContext(code, {
    exports,
    performance,
    require: (name) =>
      name === 'react-native-executorch'
        ? library
        : name === 'react-native-blob-util'
          ? { default: { fs: { readFile: async () => '{}' } } }
          : inputs,
  });
  return { state, driver: exports.driverFor({ task: 'llm', model: 'test' }) };
}

test('LLM iterations retain a fixed prompt, reset KV state, and report current stats', async () => {
  const { state, driver } = fixture();
  const instance = await driver.create({ tokenizerConfigPath: 'test' });
  try {
    const run = driver.runAsync(instance);
    for (let i = 0; i < 30; i++) assert.equal(await run(), 64);
    assert.equal(state.resets, 30);
    assert.equal(state.clears, 30);
    const detail = driver.detail(instance);
    assert.equal(detail.promptTokens, 12);
    assert.equal(detail.prefillMs, 3);
    assert.ok(Number.isFinite(detail.timeToFirstTokenMs));
    assert.ok(detail.timeToFirstTokenMs >= 0);
  } finally {
    instance.dispose();
  }
  assert.equal(state.disposed, 2);
});

test('LLM iterations reject a changed token count or growing prompt', async () => {
  const { state, driver } = fixture();
  const instance = await driver.create({ tokenizerConfigPath: 'test' });
  try {
    const run = driver.runAsync(instance);
    await run();
    state.tokens = 63;
    await assert.rejects(run(), /workload changed/);
    state.tokens = 64;
    state.promptTokens = 13;
    await assert.rejects(run(), /workload changed/);
    assert.equal(state.clears, 3, 'prompt resources must be cleared after rejected iterations');
  } finally {
    instance.dispose();
  }
});
