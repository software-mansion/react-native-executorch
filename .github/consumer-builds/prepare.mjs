import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findProfile } from './matrix.mjs';
import { isInside, packageManagerCommand } from './host.mjs';
import { prepareSmokeFixture } from './smoke-fixture.mjs';

const fixtures = dirname(fileURLToPath(import.meta.url));
const repository = resolve(fixtures, '../..');
const appFixtures = join(repository, 'apps/consumer-fixtures');
const [profileId, platform, archiveArgument, directoryArgument] = process.argv.slice(2);
if (
  !['android', 'ios'].includes(platform) ||
  !profileId ||
  !archiveArgument ||
  !directoryArgument
) {
  throw new Error(
    'Usage: node .github/consumer-builds/prepare.mjs <profile-id> android|ios <library.tgz> <new-directory-outside-repo>'
  );
}
const profile = findProfile(profileId);
const abi = profile.smoke && platform === 'android' ? 'x86_64' : 'arm64-v8a';
const bundleIdentifier = profile.smoke
  ? 'com.swmansion.executorch.consumersmoke'
  : 'com.swmansion.executorch.consumerbuild';
const archive = realpathSync(archiveArgument);
const requestedDirectory = resolve(directoryArgument);
if (!statSync(archive).isFile() || !archive.endsWith('.tgz')) {
  throw new Error('The library must be a packed .tgz file, not a workspace or symlinked directory');
}
// npm must not discover the repository's workspaces or hoisted dependencies.
mkdirSync(dirname(requestedDirectory), { recursive: true });
const directory = join(realpathSync(dirname(requestedDirectory)), basename(requestedDirectory));
if (isInside(repository, directory)) {
  throw new Error('Create the consumer outside the repository to avoid workspace resolution');
}
if (existsSync(directory)) throw new Error(`Refusing to overwrite ${directory}`);
if (process.env.RNET_SKIP_DOWNLOAD)
  throw new Error('Unset RNET_SKIP_DOWNLOAD: this test exercises the real postinstall');

function run(command, args, cwd) {
  console.log(`Running ${command} ${args.join(' ')} in ${cwd}`);
  const selected = packageManagerCommand(command, args);
  const result = spawnSync(selected.command, selected.args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status ?? result.signal})`);
}

function replaceInFile(path, pattern, replacement) {
  const original = readFileSync(path, 'utf8');
  if (!pattern.test(original))
    throw new Error(`Template changed: cannot find ${pattern} in ${path}`);
  writeFileSync(path, original.replace(pattern, replacement));
}

let manifest;
if (profile.family === 'bare') {
  run(
    'npx',
    [
      '--yes',
      `@react-native-community/cli@${profile.cli}`,
      'init',
      'ConsumerBuild',
      '--version',
      profile.reactNative,
      '--skip-install',
      '--skip-git-init',
      '--install-pods',
      'false',
      '--directory',
      directory,
    ],
    dirname(directory)
  );
  manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  Object.assign(manifest.dependencies, {
    'react-native-worklets': profile.worklets,
    // blob-util 1.0 requires RN >=0.84. Exercise the supported RN floor here.
    'react-native-blob-util': profile.blobUtil,
  });
  writeFileSync(
    join(directory, 'babel.config.js'),
    `module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-worklets/plugin'],
};
`
  );
  writeFileSync(
    join(directory, 'index.js'),
    `import {AppRegistry} from 'react-native';
import App from './App';
AppRegistry.registerComponent('ConsumerBuild', () => App);
`
  );
  // Replace the template's App.tsx so Metro bundles this fixture.
  copyFileSync(join(appFixtures, 'App.jsx'), join(directory, 'App.tsx'));
  replaceInFile(
    join(directory, 'ios/Podfile'),
    /^platform :ios, min_ios_version_supported$/m,
    "platform :ios, [Gem::Version.new(min_ios_version_supported), Gem::Version.new('17.0')].max.to_s"
  );
  if (platform === 'android') {
    replaceInFile(
      join(directory, 'android/build.gradle'),
      /minSdkVersion = \d+/,
      'minSdkVersion = 26'
    );
    replaceInFile(
      join(directory, 'android/gradle.properties'),
      /^reactNativeArchitectures=.*$/m,
      'reactNativeArchitectures=arm64-v8a'
    );
    replaceInFile(
      join(directory, 'android/app/build.gradle'),
      /def enableProguardInReleaseBuilds = false/,
      'def enableProguardInReleaseBuilds = true'
    );
  }
} else {
  mkdirSync(directory);
  manifest = {
    name: 'consumer-build',
    version: '1.0.0',
    private: true,
    main: 'index.js',
    dependencies: {
      'expo': profile.expo,
      'react': profile.react,
      'react-native': profile.reactNative,
      'expo-build-properties': profile.buildProperties,
      'react-native-worklets': profile.worklets,
      'react-native-blob-util': profile.blobUtil,
      ...(profile.smoke ? { 'expo-asset': profile.expoAsset } : {}),
    },
    devDependencies: { '@babel/core': profile.babelCore, 'babel-preset-expo': profile.babelPreset },
  };
  writeFileSync(
    join(directory, 'app.json'),
    JSON.stringify(
      {
        expo: {
          name: 'ConsumerBuild',
          slug: 'consumer-build',
          version: '1.0.0',
          ios: {
            bundleIdentifier,
            ...(profile.smoke
              ? { infoPlist: { NSAppTransportSecurity: { NSAllowsArbitraryLoads: true } } }
              : {}),
          },
          android: { package: bundleIdentifier },
          plugins: [
            [
              'expo-build-properties',
              {
                ios: { deploymentTarget: '17.0' },
                android: {
                  minSdkVersion: 26,
                  buildArchs: [abi],
                  enableMinifyInReleaseBuilds: true,
                  ...(profile.smoke ? { usesCleartextTraffic: true } : {}),
                },
              },
            ],
          ],
        },
      },
      null,
      2
    ) + '\n'
  );
  writeFileSync(
    join(directory, 'index.js'),
    `import {registerRootComponent} from 'expo';
import App from './App';
registerRootComponent(App);
`
  );
  copyFileSync(join(appFixtures, 'App.jsx'), join(directory, 'App.jsx'));
  if (profile.smoke) await prepareSmokeFixture(directory);
}
copyFileSync(archive, join(directory, 'react-native-executorch.tgz'));
manifest.dependencies['react-native-executorch'] = 'file:./react-native-executorch.tgz';
writeFileSync(join(directory, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');

// Restrict downloads to this cell's platform, but keep all its optional native
// libraries enabled. No cache of extracted node_modules is shared between apps.
writeFileSync(
  join(directory, 'consumer-profile.json'),
  JSON.stringify({ ...profile, platform }, null, 2) + '\n'
);
// Emulator installs need the default downloads: the ABI-independent
// executorch.jar is distributed in the arm64 core archive.
if (platform === 'android' && profile.smoke) delete process.env.RNET_TARGET;
else process.env.RNET_TARGET = platform === 'android' ? `android-${abi}` : 'ios';
run('npm', ['install', '--foreground-scripts', '--no-audit', '--no-fund'], directory);
const installed = join(directory, 'node_modules/react-native-executorch');
if (lstatSync(installed).isSymbolicLink() || !isInside(directory, realpathSync(installed)))
  throw new Error('Consumer installed a linked workspace instead of the tarball');
for (const file of [
  'lib/module/index.js',
  'lib/typescript/src/index.d.ts',
  'rne-build-config.json',
]) {
  if (!existsSync(join(installed, file))) throw new Error(`Installed package is missing ${file}`);
}
if (profile.family === 'expo') {
  run(
    'npx',
    ['--no-install', 'expo', 'prebuild', '--platform', platform, '--no-install'],
    directory
  );
}
