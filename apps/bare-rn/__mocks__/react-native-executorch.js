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
};
