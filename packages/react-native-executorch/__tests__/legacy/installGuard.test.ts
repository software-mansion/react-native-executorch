/**
 * The legacy entry installs the JSI bindings as an import-time side effect,
 * guarded by a check for globals that are already present. Opting out of a
 * native library removes the per-task globals by design, so the guard reads
 * only the two that are registered unconditionally. These tests pin that: a
 * guard listing an opt-out-able global can never go false again, and install()
 * would re-run on every module evaluation.
 */
const mockInstall = jest.fn();

jest.mock('../../legacy/src/native/RnExecutorchModules', () => ({
  ETInstallerNativeModule: { install: () => mockInstall() },
}));

// The entry re-exports the whole legacy surface, so importing it pulls in the
// model registry and, through it, a native event emitter that has no host here.
jest.mock('react-native-device-info', () => ({ isEmulatorSync: () => false }));

// Every global RnExecutorchInstaller::injectJSIBindings registers outside an
// #ifdef. The guard reads only SENTINELS; the rest are here so the all-libs-on
// case is faithful.
const SENTINELS = ['loadExecutorchModule', '__rne_isEmulator'] as const;
const ALWAYS_REGISTERED = [
  ...SENTINELS,
  'loadLLM',
  'loadPrivacyFilter',
  'loadSpeechToText',
  'loadTextEmbeddings',
  'loadTokenizerModule',
  'loadVAD',
] as const;

// Registered only when their native library is compiled in.
const OPENCV_BACKED = [
  'loadOCR',
  'loadVerticalOCR',
  'loadClassification',
  'loadObjectDetection',
  'loadPoseEstimation',
  'loadStyleTransfer',
  'loadSemanticSegmentation',
  'loadInstanceSegmentation',
  'loadImageEmbeddings',
  'loadTextToImage',
] as const;
const PHONEMIS_BACKED = ['loadTextToSpeechKokoro'] as const;

const ALL = [...ALWAYS_REGISTERED, ...OPENCV_BACKED, ...PHONEMIS_BACKED];

function setGlobals(names: readonly string[]) {
  for (const name of ALL) delete (globalThis as any)[name];
  for (const name of names) {
    (globalThis as any)[name] = name === '__rne_isEmulator' ? false : () => {};
  }
}

function loadLegacyEntry() {
  jest.isolateModules(() => {
    require('../../legacy/src/index');
  });
}

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  warn.mockRestore();
  setGlobals([]);
});

describe('the legacy install guard', () => {
  it('installs when the bindings are not there yet', () => {
    setGlobals([]);
    loadLegacyEntry();
    expect(mockInstall).toHaveBeenCalledTimes(1);
  });

  it('does not reinstall once the unconditional globals are set', () => {
    setGlobals(ALL);
    loadLegacyEntry();
    expect(mockInstall).not.toHaveBeenCalled();
  });

  it('does not reinstall when opencv was opted out', () => {
    setGlobals([...ALWAYS_REGISTERED, ...PHONEMIS_BACKED]);
    loadLegacyEntry();
    expect(mockInstall).not.toHaveBeenCalled();
  });

  it('does not reinstall when phonemis was opted out', () => {
    setGlobals([...ALWAYS_REGISTERED, ...OPENCV_BACKED]);
    loadLegacyEntry();
    expect(mockInstall).not.toHaveBeenCalled();
  });

  it('does not reinstall when both libraries were opted out', () => {
    setGlobals(ALWAYS_REGISTERED);
    loadLegacyEntry();
    expect(mockInstall).not.toHaveBeenCalled();
  });

  it('still installs if a sentinel is missing', () => {
    setGlobals([...OPENCV_BACKED, ...PHONEMIS_BACKED, '__rne_isEmulator']);
    loadLegacyEntry();
    expect(mockInstall).toHaveBeenCalledTimes(1);
  });
});
