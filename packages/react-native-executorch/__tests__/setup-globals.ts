// src/index.ts checks for `global.loadXxx` JSI bindings and, if any are missing,
// calls into the native ETInstaller to install them. In Jest there are no JSI
// bindings, so we stub them out here to keep the import path side-effect-free.

const stub = (() => Promise.resolve({})) as unknown as () => Promise<unknown>;
const g = globalThis as unknown as Record<string, unknown>;

const JSI_GLOBALS = [
  'loadStyleTransfer',
  'loadSemanticSegmentation',
  'loadInstanceSegmentation',
  'loadTextToImage',
  'loadExecutorchModule',
  'loadClassification',
  'loadObjectDetection',
  'loadPoseEstimation',
  'loadTokenizerModule',
  'loadTextEmbeddings',
  'loadImageEmbeddings',
  'loadVAD',
  'loadLLM',
  'loadPrivacyFilter',
  'loadSpeechToText',
  'loadTextToSpeechKokoro',
  'loadOCR',
  'loadVerticalOCR',
];

for (const name of JSI_GLOBALS) {
  g[name] = stub;
}
g.__rne_isEmulator = false;
