/**
 * Which targets `scripts/download-libs.js` fetches.
 *
 * Expo's fingerprint runtime version hashes the whole package root, for Android
 * as well as iOS. iOS artifacts used to come down only on macOS, so a Mac and a
 * Linux EAS builder computed different Android runtime versions and the build
 * failed with a mismatch (#1509). The set must not depend on the host.
 */
const { detectTargets } = require('../../scripts/download-libs.js');

const ENV_KEYS = ['RNET_TARGET', 'RNET_NO_X86_64'] as const;
const savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
const savedPlatform = Object.getOwnPropertyDescriptor(process, 'platform')!;

function setPlatform(platform: NodeJS.Platform) {
  Object.defineProperty(process, 'platform', { ...savedPlatform, value: platform });
}

beforeEach(() => {
  ENV_KEYS.forEach((k) => delete process.env[k]);
});

afterEach(() => {
  Object.defineProperty(process, 'platform', savedPlatform);
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe('detectTargets', () => {
  it.each<NodeJS.Platform>(['darwin', 'linux', 'win32'])('fetches every target on %s', (host) => {
    setPlatform(host);

    expect(detectTargets()).toEqual(['ios', 'android-arm64-v8a', 'android-x86_64']);
  });

  it('drops only the emulator ABI with RNET_NO_X86_64', () => {
    setPlatform('linux');
    process.env.RNET_NO_X86_64 = '1';

    expect(detectTargets()).toEqual(['ios', 'android-arm64-v8a']);
  });

  it('honors RNET_TARGET', () => {
    setPlatform('darwin');
    process.env.RNET_TARGET = 'android-arm64-v8a';

    expect(detectTargets()).toEqual(['android-arm64-v8a']);
  });
});
