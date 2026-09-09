/**
 * The supported `react-native-worklets` range, and the documentation of it.
 *
 * This range is not a formality. Worklets 0.10.0 is the first release to
 * serialize an `ArrayBufferView` natively ([reanimated
 * #9475](https://github.com/software-mansion/react-native-reanimated/pull/9475));
 * before it, a view was rebuilt on the target runtime over its whole backing
 * buffer, so a window into a larger one — a slice of a recording, a pooled
 * camera frame — reached the model silently widened. Measured on a simulator,
 * `new Uint8Array(buffer, 64, 16)` arrives with `length` 1024 on worklets 0.8.3
 * and 16 on 0.10.4.
 *
 * Worklets 0.10 in turn requires React Native 0.83+, so the peer range is also
 * what decides which React Native versions this library supports. That is
 * exactly the pair that drifted before: the requirements page claimed React
 * Native 0.81+ while the peer ruled it out, and nothing noticed.
 *
 * So the range is checked against three things at once: the version actually
 * installed here, the React Native floor it implies, and the number written in
 * the docs.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

import { satisfies, minVersion, subset } from 'semver';

const PACKAGE_ROOT = join(__dirname, '..', '..');
const DOCS = join(PACKAGE_ROOT, '..', '..', 'docs', 'docs');

const manifest = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'));
const range: string = manifest.peerDependencies['react-native-worklets'];

/** The worklets copy this repo installs, i.e. what the suites run against. */
const installed = JSON.parse(
  readFileSync(
    require.resolve('react-native-worklets/package.json', {
      paths: [PACKAGE_ROOT],
    }),
    'utf8'
  )
);

describe('react-native-worklets peer range', () => {
  it('starts at 0.10.0, where native ArrayBufferView serialization landed', () => {
    expect(satisfies('0.9.3', range)).toBe(false);
    expect(satisfies('0.10.0', range)).toBe(true);
  });

  it('covers the releases published since', () => {
    // A range that stops below the current release leaves anyone installing
    // `react-native-worklets` with an unmet peer warning for no reason.
    for (const version of ['0.10.4', '0.11.4', '0.12.2']) {
      expect(satisfies(version, range)).toBe(true);
    }
  });

  it('is bounded, so an unreleased major cannot be assumed to work', () => {
    expect(subset(range, '>=0.10.0 <0.13.0')).toBe(true);
  });

  it('is satisfied by the version installed in this repo', () => {
    expect(satisfies(installed.version, range)).toBe(true);
  });

  it('matches the React Native floor the docs promise', () => {
    // Worklets declares which React Native versions it accepts; ours cannot be
    // lower than what the oldest worklets we allow will run on.
    const oldest = minVersion(range)!.version;
    const workletsRnRange: string = installed.peerDependencies['react-native'];
    const rnFloor = minVersion(workletsRnRange)!.version;

    const gettingStarted = readFileSync(
      join(DOCS, '01-fundamentals', '01-getting-started.md'),
      'utf8'
    );

    expect(oldest).toBe('0.10.0');
    // e.g. "React Native 0.83+"
    expect(gettingStarted).toContain(`React Native ${rnFloor.split('.').slice(0, 2).join('.')}+`);
  });

  it('is written into the requirements the same way', () => {
    const gettingStarted = readFileSync(
      join(DOCS, '01-fundamentals', '01-getting-started.md'),
      'utf8'
    );
    expect(gettingStarted).toContain(range);
  });
});
