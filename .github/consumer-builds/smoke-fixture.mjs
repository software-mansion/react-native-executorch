import { createHash, randomUUID } from 'node:crypto';
import { copyFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Same revision and checksum as scripts/fetch-test-fixtures.sh. Never commit
// model binaries or resolve a mutable Hugging Face branch in the smoke build.
export const modelUrl =
  'https://huggingface.co/software-mansion/MediaPipe-Selfie-Segmentation-ExecuTorch/resolve/13a9494d8230279b47973b91c94b1aa902d307a6/xnnpack/selfie_segmentation_xnnpack_fp32.pte';
export const modelChecksum = '176aba6a0719b56391586a3d19396315305c7adb5c16aafda350fecc596cebf9';

export async function prepareSmokeFixture(directory) {
  const response = await fetch(modelUrl, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`Model fixture download failed: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (createHash('sha256').update(bytes).digest('hex') !== modelChecksum) {
    throw new Error('Model fixture checksum mismatch');
  }
  writeFileSync(join(directory, 'smoke-model.pte'), bytes);
  writeFileSync(
    join(directory, 'smoke-config.json'),
    JSON.stringify(
      {
        token: randomUUID(),
        port: 18765,
        bundleIdentifier: 'com.swmansion.executorch.consumersmoke',
      },
      null,
      2
    ) + '\n'
  );
  copyFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../../apps/consumer-fixtures/App.smoke.jsx'),
    join(directory, 'App.jsx')
  );
  writeFileSync(
    join(directory, 'metro.config.js'),
    `const {getDefaultConfig} = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('pte');
module.exports = config;
`
  );
}
