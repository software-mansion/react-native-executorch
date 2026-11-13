import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const minor = (version) => version.split('.').slice(0, 2).join('.');
const compareVersions = (left, right) => {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
};

export function readCompatibility() {
  return JSON.parse(readFileSync(new URL('./compatibility.json', import.meta.url), 'utf8'));
}

export function createProfiles(config = readCompatibility()) {
  const pinned = /^\d+\.\d+\.\d+$/;
  const ids = new Set();
  const requireVersion = (version, label) => {
    if (!pinned.test(version)) throw new Error(`Pin ${label} to an exact version`);
  };
  const requireId = (id) => {
    if (typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id) || ids.has(id)) {
      throw new Error(`Invalid or duplicate profile id: ${id}`);
    }
    ids.add(id);
  };
  requireVersion(config.cli, 'the scaffolding CLI');
  for (const key of ['bare', 'worklets', 'expo']) {
    if (!Array.isArray(config[key]) || !config[key].length)
      throw new Error(`No ${key} compatibility entries`);
  }
  const rnMinors = new Set();
  for (const rn of config.bare) {
    requireVersion(rn.reactNative, `${rn.id}.reactNative`);
    requireVersion(rn.blobUtil, `${rn.id}.blobUtil`);
    if (rnMinors.has(minor(rn.reactNative)))
      throw new Error(`Duplicate RN minor: ${rn.reactNative}`);
    rnMinors.add(minor(rn.reactNative));
    requireId(rn.id);
  }
  const workletsMinors = new Set();
  for (const worklets of config.worklets) {
    requireVersion(worklets.version, 'Worklets');
    if (workletsMinors.has(minor(worklets.version)))
      throw new Error(`Duplicate Worklets minor: ${worklets.version}`);
    workletsMinors.add(minor(worklets.version));
    if (!Array.isArray(worklets.reactNative) || !worklets.reactNative.length)
      throw new Error(`No RN support for Worklets ${worklets.version}`);
    const declared = new Set();
    for (const rn of worklets.reactNative) {
      if (!rnMinors.has(rn) || declared.has(rn))
        throw new Error(`Invalid RN declaration ${rn} for Worklets ${worklets.version}`);
      declared.add(rn);
    }
  }
  const bare = [...config.bare]
    .sort((a, b) => compareVersions(a.reactNative, b.reactNative))
    .flatMap((rn) => {
      const compatible = config.worklets
        .filter((worklets) => worklets.reactNative.includes(minor(rn.reactNative)))
        .sort((a, b) => compareVersions(a.version, b.version));
      if (!compatible.length) throw new Error(`No compatible Worklets for ${rn.id}`);
      return compatible.map((worklets) => {
        const id = `${rn.id}-worklets-${minor(worklets.version).replaceAll('.', '-')}`;
        requireId(id);
        return { ...rn, id, worklets: worklets.version, family: 'bare', cli: config.cli };
      });
    });
  const expo = config.expo.map((profile) => {
    requireId(profile.id);
    for (const key of [
      'reactNative',
      'worklets',
      'blobUtil',
      'expo',
      'react',
      'buildProperties',
      'babelPreset',
      'babelCore',
    ]) {
      requireVersion(profile[key], `${profile.id}.${key}`);
    }
    if (
      !config.worklets.some(
        (worklets) =>
          worklets.version === profile.worklets &&
          worklets.reactNative.includes(minor(profile.reactNative))
      )
    ) {
      throw new Error(`Unsupported Expo RN/Worklets pair: ${profile.id}`);
    }
    return { ...profile, family: 'expo', cli: config.cli };
  });
  const latestExpo = [...expo].sort((a, b) => compareVersions(a.expo, b.expo)).at(-1);
  requireVersion(latestExpo.expoAsset, `${latestExpo.id}.expoAsset`);
  const smoke = { ...latestExpo, id: `${latestExpo.id}-smoke`, smoke: true };
  requireId(smoke.id);
  for (const [name, version] of Object.entries(config.integrations ?? {})) {
    requireVersion(version, `integrations.${name}`);
  }
  for (const name of [
    '@sentry/react-native',
    '@react-native-firebase/app',
    'react-native-vision-camera',
    'react-native-audio-api',
  ]) {
    requireVersion(config.integrations?.[name], `integrations.${name}`);
  }
  const integration = {
    ...latestExpo,
    id: `${latestExpo.id}-integration`,
    integrations: config.integrations,
  };
  requireId(integration.id);
  return { bare, expo, smoke, integration };
}

export function findProfile(id) {
  const { bare, expo, smoke, integration } = createProfiles();
  const profile = [...bare, ...expo, smoke, integration].find((profile) => profile.id === id);
  if (!profile) throw new Error(`Unknown consumer profile: ${id}`);
  return profile;
}

export function createMatrix(scope = 'expo', config = readCompatibility()) {
  if (!['expo', 'full'].includes(scope)) throw new Error(`Unknown matrix scope: ${scope}`);
  const { bare, expo, smoke, integration } = createProfiles(config);
  const profiles =
    scope === 'full' ? [...bare, ...expo, smoke, integration] : [...expo, smoke, integration];
  const latestExpo = [...expo].sort((a, b) => compareVersions(a.expo, b.expo)).at(-1);
  return {
    scope,
    matrix: {
      include: [
        ...profiles.flatMap((profile) =>
          ['android', 'ios'].map((platform) => ({
            profile: profile.id,
            platform,
            id: `${profile.id}-${platform}`,
            runner: platform === 'ios' ? 'macos-26' : 'ubuntu-24.04',
            smoke: Boolean(profile.smoke),
            aab: profile.id === latestExpo.id && platform === 'android',
          }))
        ),
        {
          profile: latestExpo.id,
          platform: 'android',
          id: `${latestExpo.id}-android-windows`,
          runner: 'windows-2025',
          smoke: false,
          aab: false,
        },
      ],
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = createMatrix(process.argv[2] ?? 'expo');
  console.log(JSON.stringify(result, null, 2));
  if (process.env.GITHUB_OUTPUT) {
    for (const [key, value] of Object.entries(result)) {
      appendFileSync(
        process.env.GITHUB_OUTPUT,
        `${key}=${typeof value === 'string' ? value : JSON.stringify(value)}\n`
      );
    }
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    const counts = { android: 0, ios: 0 };
    for (const cell of result.matrix.include) counts[cell.platform]++;
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### Consumer build matrix (${result.scope})\n\n${result.matrix.include.length} Release app builds: ${counts.android} Android and ${counts.ios} iOS. One additional job packs the shared library.\n`
    );
  }
}
