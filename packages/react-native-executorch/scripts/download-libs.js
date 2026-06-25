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
 *   xnnpack-android-arm64-v8a.tar.gz -- libxnnpack_executorch_backend.so (Android)
 *   xnnpack-android-x86_64.tar.gz
 *   xnnpack-ios.tar.gz               -- XnnpackBackend.xcframework (iOS)
 *   vulkan-android-arm64-v8a.tar.gz  -- libvulkan_executorch_backend.so (Android only)
 *   vulkan-android-x86_64.tar.gz
 *   coreml-ios.tar.gz                -- CoreMLBackend.xcframework (iOS only)
 *   mlx-ios.tar.gz                   -- MLXBackend.xcframework + mlx.metallib (iOS only)
 *
 * Each tarball extracts into third-party/android/libs/ or third-party/ios/
 * preserving the existing directory structure so CMakeLists/podspec need no changes.
 *
 * User configuration (in the app's package.json) — three optional arrays, all merged into a single set:
 *   "react-native-executorch": {
 *     "backends": ["xnnpack", "coreml", "mlx", "vulkan"],
 *     "libs":     ["opencv", "phonemis"],
 *     "features": ["llm", "textToSpeech", "objectDetection"]
 *   }
 *
 *   `features` is sugar — each one expands to a set of backends + libs via FEATURE_MAP below.
 *   If no `react-native-executorch` block is present, every backend and lib defaults to ON.
 *
 * Recognized values:
 *   backends:  xnnpack, coreml (iOS), mlx (iOS), vulkan (Android)
 *   libs:      opencv, phonemis
 *   features:  llm, multimodalLLM, speechToText, textToSpeech, vad, privacyFilter,
 *              textEmbeddings, imageEmbeddings,
 *              classification, objectDetection, semanticSegmentation, instanceSegmentation,
 *              ocr, verticalOCR, poseEstimation, styleTransfer, textToImage, segmentAnything,
 *              tokenizer
 *
 * Platform applicability:
 *   opencv      Android + iOS — downloaded artifact
 *   phonemis    Android + iOS — built from in-tree source at third-party/common/phonemis (git submodule);
 *                               this toggle only gates compilation (RNE_ENABLE_PHONEMIS), no download.
 *   xnnpack     Android (libxnnpack_executorch_backend.so) + iOS (XnnpackBackend.xcframework)
 *   coreml      iOS only — toggles CoreMLBackend.xcframework.
 *   mlx         iOS only — toggles MLXBackend.xcframework + mlx.metallib resource.
 *   vulkan      Android only — toggles libvulkan_executorch_backend.so.
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

const ALL_BACKENDS = ['xnnpack', 'coreml', 'mlx', 'vulkan'];
const ALL_LIBS = ['opencv', 'phonemis'];

// features -> { backends, libs }
// Backend lists are the union of what at least one model in that family ships
// today (per src/models.ts). When a new variant lands for a model that adds
// e.g. coreml or vulkan support, bump the family here.
const FEATURE_MAP = {
  // Text-only LLMs ship xnnpack + mlx (Gemma 4 ships an MLX iOS export).
  llm: { backends: ['xnnpack', 'mlx'], libs: [] },
  // Multimodal LLMs add vulkan (Gemma-3-multimodal ships a Vulkan export) and
  // mlx (Gemma 4 ships an MLX iOS export); the vision encoder needs opencv.
  multimodalLLM: { backends: ['xnnpack', 'mlx', 'vulkan'], libs: ['opencv'] },
  // Privacy filter classifiers — xnnpack only.
  privacyFilter: { backends: ['xnnpack'], libs: [] },
  // Whisper ships xnnpack + coreml.
  speechToText: { backends: ['xnnpack', 'coreml'], libs: [] },
  // Kokoro ships xnnpack only.
  textToSpeech: { backends: ['xnnpack'], libs: ['phonemis'] },
  // FSMN VAD — xnnpack only.
  vad: { backends: ['xnnpack'], libs: [] },
  textEmbeddings: { backends: ['xnnpack'], libs: [] },
  imageEmbeddings: { backends: ['xnnpack'], libs: ['opencv'] },
  // EfficientNet ships xnnpack + coreml.
  classification: { backends: ['xnnpack', 'coreml'], libs: ['opencv'] },
  // YOLO is xnnpack-only, ssdlite/rf_detr add coreml → union.
  objectDetection: { backends: ['xnnpack', 'coreml'], libs: ['opencv'] },
  // YOLO-pose only.
  poseEstimation: { backends: ['xnnpack'], libs: ['opencv'] },
  // DeepLab/FCN/LR-ASPP/selfie — xnnpack only.
  semanticSegmentation: { backends: ['xnnpack'], libs: ['opencv'] },
  // YOLO-seg xnnpack-only, rf_detr-seg/fastsam add coreml → union.
  instanceSegmentation: { backends: ['xnnpack', 'coreml'], libs: ['opencv'] },
  // CRAFT + CRNN — xnnpack only.
  ocr: { backends: ['xnnpack'], libs: ['opencv'] },
  verticalOCR: { backends: ['xnnpack'], libs: ['opencv'] },
  // All style-transfer presets ship xnnpack + coreml.
  styleTransfer: { backends: ['xnnpack', 'coreml'], libs: ['opencv'] },
  // BK-SDM — xnnpack only.
  textToImage: { backends: ['xnnpack'], libs: ['opencv'] },
  // FastSAM ships xnnpack + coreml.
  segmentAnything: { backends: ['xnnpack', 'coreml'], libs: ['opencv'] },
  // Tokenizer is pure-CPU string ops resolved from libexecutorch; needs no
  // backend or extra lib. Listed so a tokenizer-only app can opt into core only.
  tokenizer: { backends: [], libs: [] },
};

function readUserConfig() {
  const allOn = () => ({ backends: [...ALL_BACKENDS], libs: [...ALL_LIBS] });

  // npm/yarn set INIT_CWD to the directory where install was invoked (project root)
  const projectRoot = process.env.INIT_CWD || process.env.npm_config_local_prefix;
  if (!projectRoot) {
    console.warn(
      '[react-native-executorch] Could not determine project root, enabling all backends + libs.'
    );
    return allOn();
  }

  let rneConfig;
  try {
    const userPackageJson = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
    );
    rneConfig = userPackageJson['react-native-executorch'];
  } catch {
    console.warn(
      '[react-native-executorch] Could not read app package.json, enabling all backends + libs.'
    );
    return allOn();
  }

  if (rneConfig === undefined) return allOn();

  if (rneConfig.extras !== undefined) {
    throw new Error(
      '[react-native-executorch] The legacy `extras` field is no longer supported. ' +
        'Use `backends`, `libs`, and/or `features` instead.'
    );
  }

  const backends = new Set(rneConfig.backends ?? []);
  const libs = new Set(rneConfig.libs ?? []);

  for (const feature of rneConfig.features ?? []) {
    const expansion = FEATURE_MAP[feature];
    if (!expansion) {
      const known = Object.keys(FEATURE_MAP).join(', ');
      throw new Error(
        `[react-native-executorch] Unknown feature "${feature}". Known features: ${known}.`
      );
    }
    expansion.backends.forEach((b) => backends.add(b));
    expansion.libs.forEach((l) => libs.add(l));
  }

  for (const b of backends) {
    if (!ALL_BACKENDS.includes(b)) {
      throw new Error(
        `[react-native-executorch] Unknown backend "${b}". Known: ${ALL_BACKENDS.join(', ')}.`
      );
    }
  }
  for (const l of libs) {
    if (!ALL_LIBS.includes(l)) {
      throw new Error(
        `[react-native-executorch] Unknown lib "${l}". Known: ${ALL_LIBS.join(', ')}.`
      );
    }
  }

  return { backends: [...backends], libs: [...libs] };
}

function writeBuildConfig({ backends, libs }) {
  const config = {
    enableOpencv: libs.includes('opencv'),
    enablePhonemis: libs.includes('phonemis'),
    enableXnnpack: backends.includes('xnnpack'),
    enableCoreml: backends.includes('coreml'),
    enableMlx: backends.includes('mlx'),
    enableVulkan: backends.includes('vulkan'),
  };
  fs.writeFileSync(
    path.join(PACKAGE_ROOT, 'rne-build-config.json'),
    JSON.stringify(config, null, 2)
  );
  return config;
}

// Warn when a backend is opted in but the build targets only the platform where
// it has no effect (coreml/mlx=iOS-only, vulkan=Android-only). Surfacing it at
// install time is friendlier than the user wondering why an opt-out had no effect.
function warnAboutPlatformAsymmetry({ backends }, targets) {
  const hasAndroid = targets.some((t) => t.startsWith('android'));
  const hasIos = targets.includes('ios');
  if (hasAndroid && !hasIos && backends.includes('coreml')) {
    console.warn(
      '[react-native-executorch] coreml is enabled but the build targets only Android; CoreML is iOS-only and the flag has no effect here.'
    );
  }
  if (hasAndroid && !hasIos && backends.includes('mlx')) {
    console.warn(
      '[react-native-executorch] mlx is enabled but the build targets only Android; the MLX backend is iOS-only and the flag has no effect here.'
    );
  }
  if (hasIos && !hasAndroid && backends.includes('vulkan')) {
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

// Core artifacts are always downloaded; optional ones only if the backend / lib is enabled.
function getArtifacts(targets, { backends, libs }) {
  const artifacts = [];

  for (const target of targets) {
    const destDir = target.startsWith('android')
      ? path.join(THIRD_PARTY_DIR, 'android', 'libs')
      : path.join(THIRD_PARTY_DIR, 'ios');

    // Core is always needed
    artifacts.push(makeArtifact(`core-${target}`, destDir));

    // iOS OpenCV is provided via CocoaPods (opencv-rne dependency), not a tarball
    if (libs.includes('opencv') && target !== 'ios') {
      artifacts.push(makeArtifact(`opencv-${target}`, destDir));
    }

    // phonemis is built from in-tree source (third-party/common/phonemis submodule);
    // no artifact download required.

    if (backends.includes('xnnpack')) {
      artifacts.push(makeArtifact(`xnnpack-${target}`, destDir));
    }

    // CoreML is iOS only
    if (backends.includes('coreml') && target === 'ios') {
      artifacts.push(makeArtifact(`coreml-${target}`, destDir));
    }

    // MLX is iOS only
    if (backends.includes('mlx') && target === 'ios') {
      artifacts.push(makeArtifact(`mlx-${target}`, destDir));
    }

    // Vulkan is Android only
    if (backends.includes('vulkan') && target.startsWith('android')) {
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
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
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
  const result = execSync(`sha256sum "${filePath}" || shasum -a 256 "${filePath}"`);
  return result.toString().split(' ')[0].trim();
}

function isCacheValid(artifact) {
  if (!fs.existsSync(artifact.cacheFile)) return false;
  if (!fs.existsSync(artifact.cacheChecksumFile)) return false;
  const expectedChecksum = fs.readFileSync(artifact.cacheChecksumFile, 'utf8').trim();
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
    console.log('[react-native-executorch] Skipping native lib download (RNET_SKIP_DOWNLOAD set)');
    // Still write build config so the native build knows what's enabled
    const config = readUserConfig();
    writeBuildConfig(config);
    return;
  }

  const config = readUserConfig();
  const buildConfig = writeBuildConfig(config);
  console.log(
    `[react-native-executorch] Backends: [${config.backends.join(', ') || '—'}]; Libs: [${config.libs.join(', ') || '—'}]`
  );
  console.log(
    `[react-native-executorch] Build flags: opencv=${buildConfig.enableOpencv}, phonemis=${buildConfig.enablePhonemis}, xnnpack=${buildConfig.enableXnnpack}, coreml=${buildConfig.enableCoreml}, mlx=${buildConfig.enableMlx}, vulkan=${buildConfig.enableVulkan}`
  );

  const targets = detectTargets();
  warnAboutPlatformAsymmetry(config, targets);
  const artifacts = getArtifacts(targets, config);

  ensureDir(CACHE_DIR);

  for (const artifact of artifacts) {
    console.log(`[react-native-executorch] Preparing ${artifact.name}...`);

    if (isCacheValid(artifact)) {
      console.log(`  ✓ Cache hit, skipping download`);
    } else {
      console.log(`  ↓ Downloading ${artifact.url}`);
      await download(artifact.checksumUrl, artifact.cacheChecksumFile);
      await download(artifact.url, artifact.cacheFile);

      const expectedChecksum = fs.readFileSync(artifact.cacheChecksumFile, 'utf8').trim();
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
  console.error('[react-native-executorch] Failed to download native libs:', err.message);
  console.error('  You can set RNET_SKIP_DOWNLOAD=1 to skip and provide libs manually.');
  process.exit(1);
});
