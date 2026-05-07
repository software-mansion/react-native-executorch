/**
 * On-demand native library downloader
 *
 * Runs at postinstall time. Downloads prebuilt native artifacts from GitHub Releases
 * and extracts them into third-party/ so the existing CMakeLists.txt / podspec
 * can find them at build time without any other changes.
 *
 * Artifact layout on GitHub Releases (per version tag, e.g. v0.9.0):
 *
 *   core-android-arm64-v8a.tar.gz    -- executorch, pthreadpool, cpuinfo for arm64
 *   core-android-x86_64.tar.gz       -- executorch for x86_64
 *   core-ios.tar.gz                  -- ExecutorchLib.xcframework (without xnnpack/coreml)
 *   opencv-android-arm64-v8a.tar.gz  -- OpenCV for arm64
 *   opencv-android-x86_64.tar.gz     -- OpenCV for x86_64
 *   opencv-ios.tar.gz                -- OpenCV xcframework
 *   phonemizer-android-arm64-v8a.tar.gz
 *   phonemizer-android-x86_64.tar.gz
 *   phonemizer-ios.tar.gz
 *   vulkan-android-arm64-v8a.tar.gz  -- libvulkan_executorch_backend.so (Android only)
 *   vulkan-android-x86_64.tar.gz
 *   xnnpack-ios.tar.gz               -- XnnpackBackend.xcframework (iOS only; baked into libexecutorch.so on Android)
 *   coreml-ios.tar.gz                -- CoreMLBackend.xcframework (iOS only)
 *
 * Each tarball extracts into third-party/android/libs/ or third-party/ios/
 * preserving the existing directory structure so CMakeLists/podspec need no changes.
 *
 * User configuration (in the app's package.json):
 *   "react-native-executorch": {
 *     "extras": ["opencv", "phonemizer", "xnnpack", "coreml", "vulkan"]   // default: all enabled
 *   }
 *
 * Platform applicability of each extra:
 *   opencv      Android + iOS
 *   phonemizer  Android + iOS
 *   xnnpack     iOS only — toggles XnnpackBackend.xcframework. Always baked into
 *               libexecutorch.so on Android; the flag has no effect there.
 *   coreml     iOS only — toggles CoreMLBackend.xcframework.
 *   vulkan     Android only — toggles libvulkan_executorch_backend.so.
 *
 * Environment variables:
 *   RNET_SKIP_DOWNLOAD=1           -- skip download entirely (for CI with pre-cached libs)
 *   RNET_LIBS_CACHE_DIR=/path      -- use custom cache dir instead of default
 *   RNET_TARGET=android-arm64      -- force specific target (skip auto-detection)
 *   RNET_BASE_URL=http://localhost:8080  -- override base URL (useful for local testing:
 *                                           cd dist-artifacts && python3 -m http.server 8080)
 *   GITHUB_TOKEN=ghp_xxx               -- GitHub token for accessing draft releases
 */

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ---- Config ----------------------------------------------------------------

const PACKAGE_VERSION = require('../package.json').version;
const GITHUB_REPO = 'software-mansion/react-native-executorch';
const BASE_URL =
  process.env.RNET_BASE_URL ||
  `https://github.com/${GITHUB_REPO}/releases/download/v${PACKAGE_VERSION}`;

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const THIRD_PARTY_DIR = path.join(PACKAGE_ROOT, 'third-party');

const DEFAULT_CACHE_DIR = path.join(
  require('os').homedir(),
  '.cache',
  'react-native-executorch',
  PACKAGE_VERSION
);
const CACHE_DIR = process.env.RNET_LIBS_CACHE_DIR || DEFAULT_CACHE_DIR;

// ---- User config -----------------------------------------------------------

function readUserExtras() {
  // npm/yarn set INIT_CWD to the directory where install was invoked (project root)
  const projectRoot =
    process.env.INIT_CWD || process.env.npm_config_local_prefix;
  if (!projectRoot) {
    console.warn(
      '[react-native-executorch] Could not determine project root, enabling all extras.'
    );
    return ['opencv', 'phonemizer'];
  }

  const userPackageJsonPath = path.join(projectRoot, 'package.json');
  try {
    const userPackageJson = JSON.parse(
      fs.readFileSync(userPackageJsonPath, 'utf8')
    );
    const rneConfig = userPackageJson['react-native-executorch'] || {};
    return (
      rneConfig.extras ?? [
        'opencv',
        'phonemizer',
        'xnnpack',
        'coreml',
        'vulkan',
      ]
    );
  } catch {
    console.warn(
      '[react-native-executorch] Could not read app package.json, enabling all extras.'
    );
    return ['opencv', 'phonemizer', 'xnnpack', 'coreml', 'vulkan'];
  }
}

function writeBuildConfig(extras) {
  const config = {
    enableOpencv: extras.includes('opencv'),
    enablePhonemizer: extras.includes('phonemizer'),
    enableXnnpack: extras.includes('xnnpack'),
    enableCoreml: extras.includes('coreml'),
    enableVulkan: extras.includes('vulkan'),
  };
  fs.writeFileSync(
    path.join(PACKAGE_ROOT, 'rne-build-config.json'),
    JSON.stringify(config, null, 2)
  );
  return config;
}

// Warn the user when an `extras` choice is platform-asymmetric and the toggle
// will be silently ignored on one of the target platforms. Better to surface
// it at install time than to have the user wonder why an opt-out had no effect.
function warnAboutPlatformAsymmetry(extras, targets) {
  const hasAndroid = targets.some((t) => t.startsWith('android'));
  const hasIos = targets.includes('ios');
  if (hasAndroid && !extras.includes('xnnpack')) {
    console.warn(
      '[react-native-executorch] xnnpack is omitted from extras but is baked into libexecutorch.so on Android — no opt-out there. The flag affects iOS only.'
    );
  }
  if (hasAndroid && extras.includes('coreml') && !hasIos) {
    console.warn(
      '[react-native-executorch] coreml is enabled but the build targets only Android; CoreML is iOS-only and the flag has no effect here.'
    );
  }
  if (hasIos && extras.includes('vulkan') && !hasAndroid) {
    console.warn(
      '[react-native-executorch] vulkan is enabled but the build targets only iOS; the Vulkan backend is Android-only and the flag has no effect here.'
    );
  }
}

// ---- Target detection ------------------------------------------------------

function detectTargets() {
  if (process.env.RNET_TARGET) {
    return [process.env.RNET_TARGET];
  }

  const targets = [];
  if (process.platform === 'darwin') {
    targets.push('ios');
  }
  targets.push('android-arm64-v8a');
  if (!process.env.RNET_NO_X86_64) {
    targets.push('android-x86_64');
  }
  return targets;
}

// ---- Artifact metadata -----------------------------------------------------

// Core artifacts are always downloaded; optional ones only if the extra is enabled.
function getArtifacts(targets, extras) {
  const artifacts = [];

  for (const target of targets) {
    const destDir = target.startsWith('android')
      ? path.join(THIRD_PARTY_DIR, 'android', 'libs')
      : path.join(THIRD_PARTY_DIR, 'ios');

    // Core is always needed
    artifacts.push(makeArtifact(`core-${target}`, destDir));

    // iOS OpenCV is provided via CocoaPods (opencv-rne dependency), not a tarball
    if (extras.includes('opencv') && target !== 'ios') {
      artifacts.push(makeArtifact(`opencv-${target}`, destDir));
    }

    if (extras.includes('phonemizer')) {
      artifacts.push(makeArtifact(`phonemizer-${target}`, destDir));
    }

    // XNNPACK is baked into libexecutorch.so on Android (no separate artifact);
    // on iOS it's a force-loaded xcframework.
    if (extras.includes('xnnpack') && target === 'ios') {
      artifacts.push(makeArtifact(`xnnpack-${target}`, destDir));
    }

    // CoreML is iOS only
    if (extras.includes('coreml') && target === 'ios') {
      artifacts.push(makeArtifact(`coreml-${target}`, destDir));
    }

    // Vulkan is Android only
    if (extras.includes('vulkan') && target.startsWith('android')) {
      artifacts.push(makeArtifact(`vulkan-${target}`, destDir));
    }
  }

  return artifacts;
}

function makeArtifact(name, destDir) {
  return {
    name,
    url: `${BASE_URL}/${name}.tar.gz`,
    checksumUrl: `${BASE_URL}/${name}.tar.gz.sha256`,
    destDir,
    cacheFile: path.join(CACHE_DIR, `${name}.tar.gz`),
    cacheChecksumFile: path.join(CACHE_DIR, `${name}.tar.gz.sha256`),
  };
}

// ---- Helpers ---------------------------------------------------------------

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (url) => {
      const client = url.startsWith('http://') ? http : https;
      const headers = {};
      if (process.env.GITHUB_TOKEN && !url.startsWith('http://')) {
        headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
      }
      client.get(url, { headers }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      });
    };
    get(url);
    file.on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

function sha256(filePath) {
  const result = execSync(
    `sha256sum "${filePath}" || shasum -a 256 "${filePath}"`
  );
  return result.toString().split(' ')[0].trim();
}

function isCacheValid(artifact) {
  if (!fs.existsSync(artifact.cacheFile)) return false;
  if (!fs.existsSync(artifact.cacheChecksumFile)) return false;
  const expectedChecksum = fs
    .readFileSync(artifact.cacheChecksumFile, 'utf8')
    .trim();
  const actualChecksum = sha256(artifact.cacheFile);
  return expectedChecksum === actualChecksum;
}

function extract(tarball, destDir) {
  ensureDir(destDir);
  execSync(`tar -xzf "${tarball}" -C "${destDir}"`);
}

// ---- Main ------------------------------------------------------------------

async function main() {
  if (process.env.RNET_SKIP_DOWNLOAD) {
    console.log(
      '[react-native-executorch] Skipping native lib download (RNET_SKIP_DOWNLOAD set)'
    );
    // Still write build config so the native build knows what features are enabled
    const extras = readUserExtras();
    writeBuildConfig(extras);
    return;
  }

  const extras = readUserExtras();
  const buildConfig = writeBuildConfig(extras);
  console.log(
    `[react-native-executorch] Features: opencv=${buildConfig.enableOpencv}, phonemizer=${buildConfig.enablePhonemizer}, xnnpack=${buildConfig.enableXnnpack}, coreml=${buildConfig.enableCoreml}, vulkan=${buildConfig.enableVulkan}`
  );

  const targets = detectTargets();
  warnAboutPlatformAsymmetry(extras, targets);
  const artifacts = getArtifacts(targets, extras);

  ensureDir(CACHE_DIR);

  for (const artifact of artifacts) {
    console.log(`[react-native-executorch] Preparing ${artifact.name}...`);

    if (isCacheValid(artifact)) {
      console.log(`  ✓ Cache hit, skipping download`);
    } else {
      console.log(`  ↓ Downloading ${artifact.url}`);
      await download(artifact.checksumUrl, artifact.cacheChecksumFile);
      await download(artifact.url, artifact.cacheFile);

      const expectedChecksum = fs
        .readFileSync(artifact.cacheChecksumFile, 'utf8')
        .trim();
      const actualChecksum = sha256(artifact.cacheFile);
      if (expectedChecksum !== actualChecksum) {
        throw new Error(
          `Checksum mismatch for ${artifact.name}: expected ${expectedChecksum}, got ${actualChecksum}`
        );
      }
      console.log(`  ✓ Downloaded and verified`);
    }

    console.log(`  ↓ Extracting to ${artifact.destDir}`);
    extract(artifact.cacheFile, artifact.destDir);
    console.log(`  ✓ Done`);
  }

  console.log('[react-native-executorch] Native libs ready.');
}

main().catch((err) => {
  console.error(
    '[react-native-executorch] Failed to download native libs:',
    err.message
  );
  console.error(
    '  You can set RNET_SKIP_DOWNLOAD=1 to skip and provide libs manually.'
  );
  process.exit(1);
});
