import { execFileSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { REGISTRY_REPO_PATH, parseRegistry } from './model-registry.mjs';

export { readAddedIn };

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_DIR = join(__dirname, '..', '..', '..');

// Before v0.10.0 models were flat constants spread over src/constants (and
// src/modelUrls.ts in v0.1). A constant whose name equals the registry entry's
// key matches by itself; these are the ones renamed by the v0.10 registry. Only
// the same model counts: EasyOCR is not PaddleOCR, and BK-SDM is not SDXS.
const LEGACY_NAMES = {
  'models.llm.SMOLLM2_135M': ['SMOLLM2_1_135M'],
  'models.llm.SMOLLM2_360M': ['SMOLLM2_1_360M'],
  'models.llm.SMOLLM2_1_7B': ['SMOLLM2_1_1_7B'],
  'models.llm.PHI4_MINI': ['PHI_4_MINI_4B'],
  'models.llm.LFM2_5_1_2B': ['LFM2_5_1_2B_INSTRUCT'],
  'models.llm.LFM2_5_VL_450M': ['LFM2_5_VL_450M_QUANTIZED'],
  'models.llm.LFM2_5_VL_1_6B': ['LFM2_5_VL_1_6B_QUANTIZED'],
  'models.llm.BIELIK_V3_1_5B': ['BIELIK_V3_0_1_5B'],
  'models.llm.GEMMA4_OMNI_E2B': ['GEMMA4_E2B_MM'],
  'models.textEmbeddings.CLIP_VIT_BASE_PATCH32_TEXT': ['CLIP_VIT_BASE_PATCH_32_TEXT_ENCODER'],
  'models.textEmbeddings.DISTILUSE_BASE_MULTILINGUAL_CASED_V2': [
    'DISTILUSE_BASE_MULTILINGUAL_CASED_V2_8DA4W',
  ],
  'models.textEmbeddings.PARAPHRASE_MULTILINGUAL_MINILM_L12_V2': [
    'PARAPHRASE_MULTILINGUAL_MINILM_L12_V2_QUANTIZED',
  ],
  'models.imageEmbeddings.CLIP_VIT_BASE_PATCH32': ['CLIP_VIT_BASE_PATCH32_IMAGE'],
  'models.privacyFilter.OPENAI': ['PRIVACY_FILTER_OPENAI'],
  'models.privacyFilter.NEMOTRON': ['PRIVACY_FILTER_NEMOTRON'],
  'models.speechToText.WHISPER': ['WHISPER_TINY_ENCODER', 'WHISPER_TINY', 'WHISPER_TINY_EN'],
  'models.textToSpeech.KOKORO': ['KOKORO_SMALL', 'KOKORO_MEDIUM'],
  'models.objectDetection.SSDLITE320_MOBILENET_V3_LARGE': ['SSDLITE_320_MOBILENET_V3_LARGE'],
  'models.objectDetection.RFDETR_NANO': ['RF_DETR_NANO'],
  'models.objectDetection.YOLO26': ['YOLO26N', 'YOLO26S', 'YOLO26M', 'YOLO26L', 'YOLO26X'],
  'models.instanceSegmentation.RFDETR_NANO': ['RF_DETR_NANO_SEG'],
  'models.instanceSegmentation.FASTSAM': ['FASTSAM_S', 'FASTSAM_X'],
  'models.instanceSegmentation.YOLO26': [
    'YOLO26N_SEG',
    'YOLO26S_SEG',
    'YOLO26M_SEG',
    'YOLO26L_SEG',
    'YOLO26X_SEG',
  ],
  'models.keypointDetection.YOLO26_POSE': ['YOLO26N_POSE'],
  'models.keypointDetection.RFDETR_KEYPOINT': ['RF_DETR_KEYPOINT_PREVIEW'],
  'models.styleTransfer.CANDY': ['STYLE_TRANSFER_CANDY'],
  'models.styleTransfer.MOSAIC': ['STYLE_TRANSFER_MOSAIC'],
  'models.styleTransfer.RAIN_PRINCESS': ['STYLE_TRANSFER_RAIN_PRINCESS'],
  'models.styleTransfer.UDNIE': ['STYLE_TRANSFER_UDNIE'],
};

const LEGACY_FILE = /(^|\/)src\/(modelUrls\.ts|constants\/.+\.ts)$/;

function git(...args) {
  return execFileSync('git', ['-C', REPO_DIR, ...args], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });
}

/**
 * Finds the first release that shipped each model, from the release tags.
 * Releases are walked in tag-date order, since patch releases of an older
 * line (v0.3.4) went out after newer minors (v0.4.1).
 * @param {string[]} paths The registry entries to date, e.g. `models.llm.QWEN3_4B`.
 * @returns {Map<string, string> | null} The release tag of each entry that has
 * been released, or null outside CI when the checkout has no release tags.
 */
function readAddedIn(paths) {
  let tags;
  try {
    tags = git('for-each-ref', '--sort=creatordate', '--format=%(refname:short)', 'refs/tags/v*')
      .split('\n')
      .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag));
  } catch {
    tags = [];
  }
  if (tags.length === 0) {
    // A shallow CI checkout would otherwise publish the page without the column.
    if (process.env.CI) {
      throw new Error('No release tags to date the models; check out with `fetch-depth: 0`.');
    }
    console.warn('No release tags found, leaving out when each model was added');
    return null;
  }

  const blobs = new Map();
  const show = (id) => {
    if (!blobs.has(id)) blobs.set(id, git('cat-file', 'blob', id));
    return blobs.get(id);
  };

  const addedIn = new Map();
  for (const tag of tags) {
    const pending = paths.filter((path) => !addedIn.has(path));
    if (pending.length === 0) break;

    const files = git('ls-tree', '-r', tag)
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [meta, file] = line.split('\t');
        return { id: meta.split(' ')[2], file };
      });

    const registry = files.find((f) => f.file === REGISTRY_REPO_PATH);
    if (registry) {
      const shipped = new Set(
        [...parseRegistry(show(registry.id)).values()].flat().map((model) => model.path)
      );
      for (const path of pending) if (shipped.has(path)) addedIn.set(path, tag);
      continue;
    }

    const names = new Set();
    for (const f of files) {
      if (!LEGACY_FILE.test(f.file) || f.file.includes('/legacy/')) continue;
      for (const match of show(f.id).matchAll(/^export const ([A-Z0-9_]+)/gm)) {
        names.add(match[1].replace(/_URL$/, ''));
      }
    }
    for (const path of pending) {
      const candidates = [path.split('.').pop(), ...(LEGACY_NAMES[path] ?? [])];
      if (candidates.some((name) => names.has(name))) addedIn.set(path, tag);
    }
  }
  return addedIn;
}
