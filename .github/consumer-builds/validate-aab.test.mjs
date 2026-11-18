import assert from 'node:assert/strict';
import { test } from 'node:test';
import { androidLibraries, verifyAndroidEntries } from './android-entries.mjs';
import { verifyBundleEntries } from './validate-aab.mjs';

const entries = [
  'BundleConfig.pb',
  'base/manifest/AndroidManifest.xml',
  'base/dex/classes.dex',
  'base/assets/index.android.bundle',
  ...androidLibraries.map((library) => `base/lib/arm64-v8a/lib${library}.so`),
];

test('bundle packaging rejects missing JS, dex or native libraries, including libraries in the wrong ABI', () => {
  verifyBundleEntries(entries.join('\r\n'));
  for (const missing of entries) {
    assert.throws(
      () => verifyBundleEntries(entries.filter((file) => file !== missing).join('\n')),
      /AAB is missing/
    );
  }
  assert.throws(
    () => verifyBundleEntries(entries.join('\n').replaceAll('/arm64-v8a/', '/x86_64/')),
    /AAB is missing/
  );
});

for (const abi of ['arm64-v8a', 'x86_64']) {
  test(`APK validation checks JS, dex and all libraries for ${abi}`, () => {
    const apk = entries
      .filter((entry) => entry !== 'BundleConfig.pb')
      .map((entry) =>
        entry
          .replace(/^base\//, '')
          .replace(/^manifest\//, '')
          .replace(/^dex\//, '')
          .replace('arm64-v8a', abi)
      );
    verifyAndroidEntries(apk.join('\r\n'), 'apk', abi);
    for (const missing of apk) {
      assert.throws(
        () => verifyAndroidEntries(apk.filter((entry) => entry !== missing).join('\n'), 'apk', abi),
        /APK is missing/
      );
    }
    assert.throws(
      () => verifyAndroidEntries(apk.join('\n'), 'apk', abi === 'x86_64' ? 'arm64-v8a' : 'x86_64'),
      /APK is missing/
    );
  });
}
