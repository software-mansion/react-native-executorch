module.exports = {
  initExecutorch: jest.fn(),
  useLLM: () => ({
    isReady: false,
    isGenerating: false,
    response: '',
    messageHistory: [],
    downloadProgress: 0,
    error: null,
    sendMessage: jest.fn(),
    interrupt: jest.fn(),
  }),
  LLAMA3_2_1B_SPINQUANT: 'LLAMA3_2_1B_SPINQUANT',
  // After PR #1148 (MODEL_REGISTRY) merged to main, App.tsx imports
  // `models.<domain>.<modelName>()` instead of bare constants. Mock both
  // shapes so the smoke test passes regardless of which API the merged
  // tree happens to use.
  models: new Proxy(
    {},
    { get: () => new Proxy({}, { get: () => () => ({}) }) }
  ),
};
