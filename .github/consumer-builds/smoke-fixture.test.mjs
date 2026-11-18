import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { modelUrl, modelChecksum } from './smoke-fixture.mjs';

test('smoke model matches the checksum-pinned native test fixture', () => {
  const script = readFileSync(
    new URL(
      '../../packages/react-native-executorch/scripts/fetch-test-fixtures.sh',
      import.meta.url
    ),
    'utf8'
  );
  const fixture = script.match(
    /fetch_fixture \\\n  "selfie_segmentation_xnnpack_fp32.pte" \\\n  "([^"]+)" \\\n  "([^"]+)" \\\n  "([^"]+)" \\\n  "([^"]+)"/
  );
  assert.ok(fixture, 'Native model fixture declaration changed');
  const [, repository, revision, path, checksum] = fixture;
  assert.equal(modelUrl, `https://huggingface.co/${repository}/resolve/${revision}/${path}`);
  assert.equal(modelChecksum, checksum);
});
