// src/index.ts checks for `global.loadXxx` JSI bindings and, if any are missing,
// calls into the native ETInstaller to install them. In Jest there are no JSI
// bindings, so we stub them out here to keep the import path side-effect-free.

// Each `loadXxx` resolves to a minimal native-module stub that includes the
// methods modules consistently call: `unload` (for BaseModule.delete) and
// `generateFromFrame` (for VisionModule's worklet getter). Modules that need
// more can replace the stub in their own test.
const stub = (() =>
  Promise.resolve({
    unload: () => {},
    generateFromFrame: () => {},
  })) as unknown as () => Promise<unknown>;
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
