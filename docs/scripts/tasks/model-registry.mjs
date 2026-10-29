import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

export {
  TASKS,
  BACKEND_LABELS,
  BACKEND_PLATFORMS,
  REGISTRY_REPO_PATH,
  readModelRegistry,
  parseRegistry,
  readDocSlug,
  byPrecision,
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, '..', '..');
const REGISTRY_REPO_PATH = 'packages/react-native-executorch/src/models.ts';
const REGISTRY_PATH = join(DOCS_DIR, '..', REGISTRY_REPO_PATH);

// Every registry category, in the order the docs present them. `doc` is the
// task's page under docs/docs and `bench` the heading anchor of its chart on
// the benchmarks page. A category the registry gains without an entry here
// fails the build, so the generated lists cannot silently drop a task.
const TASKS = {
  llm: {
    title: 'LLMs & VLMs',
    doc: '02-extensions/natural-language/02-llm-chat-and-generation.md',
    bench: 'llm-chat--text-generation',
    note: 'Chat sessions stream tokens and support tool calling, a thinking-mode switch, Jinja chat templates, constrained sampling and image/audio inputs on multimodal models.',
  },
  textEmbeddings: {
    title: 'Text Embeddings',
    doc: '02-extensions/natural-language/03-text-embeddings.md',
    bench: 'text-embeddings',
  },
  colbertEmbeddings: {
    title: 'ColBERT Retrieval',
    doc: '02-extensions/natural-language/06-colbert-retrieval.md',
    bench: 'colbert-embeddings',
  },
  privacyFilter: {
    title: 'Privacy Filter (PII detection)',
    doc: '02-extensions/natural-language/04-privacy-filter.md',
    bench: 'privacy-filter',
  },
  tokenizer: { skip: true },
  speechToText: {
    title: 'Speech to Text',
    doc: '02-extensions/speech/03-speech-to-text.md',
    bench: 'speech-to-text',
  },
  textToSpeech: {
    title: 'Text to Speech',
    doc: '02-extensions/speech/02-text-to-speech.md',
    bench: 'text-to-speech',
  },
  voiceActivityDetection: {
    title: 'Voice Activity Detection',
    doc: '02-extensions/speech/04-voice-activity-detection.md',
    bench: 'voice-activity-detection',
  },
  classification: {
    title: 'Image Classification',
    doc: '02-extensions/computer-vision/02-image-classification.md',
    bench: 'image-classification',
  },
  objectDetection: {
    title: 'Object Detection',
    doc: '02-extensions/computer-vision/03-object-detection.md',
    bench: 'object-detection',
  },
  instanceSegmentation: {
    title: 'Instance Segmentation',
    doc: '02-extensions/computer-vision/07-instance-segmentation.md',
    bench: 'instance-segmentation',
  },
  semanticSegmentation: {
    title: 'Semantic Segmentation',
    doc: '02-extensions/computer-vision/06-semantic-segmentation.md',
    bench: 'semantic-segmentation',
  },
  keypointDetection: {
    title: 'Pose & Keypoints',
    doc: '02-extensions/computer-vision/04-pose-and-keypoints.md',
    bench: 'pose--keypoints',
  },
  depthEstimation: {
    title: 'Depth Estimation',
    doc: '02-extensions/computer-vision/12-depth-estimation.md',
    bench: 'depth-estimation',
  },
  ocr: {
    title: 'OCR',
    doc: '02-extensions/computer-vision/05-optical-character-recognition.md',
    bench: 'ocr',
  },
  imageEmbeddings: {
    title: 'Image Embeddings',
    doc: '02-extensions/computer-vision/09-image-embeddings.md',
    bench: 'image-embeddings',
  },
  inpainting: {
    title: 'Image Inpainting',
    doc: '02-extensions/computer-vision/11-image-inpainting.md',
    bench: 'image-inpainting',
  },
  textToImage: {
    title: 'Text to Image',
    doc: '02-extensions/computer-vision/10-text-to-image.md',
    bench: 'text-to-image',
  },
  styleTransfer: {
    title: 'Style Transfer',
    doc: '02-extensions/computer-vision/08-style-transfer.md',
    bench: 'style-transfer',
  },
};

const BACKEND_LABELS = {
  xnnpack: 'XNNPACK',
  coreml: 'Core ML',
  mlx: 'MLX',
  vulkan: 'Vulkan',
};

const BACKEND_PLATFORMS = {
  xnnpack: 'CPU, iOS and Android',
  coreml: 'iOS',
  mlx: 'iOS',
  vulkan: 'Android GPU',
};

const PRECISION_ORDER = ['fp32', 'fp16', 'bf16', 'int8', '8da8w', '8da4w', 'int4', 'spinquant'];

/**
 * Reads the `models` registry statically, without running it: the registry
 * imports react-native, so the build walks its syntax tree instead.
 * @returns {{ key: string, title: string, doc: string, bench: string, note?: string,
 *   models: { path: string, description: string, backends: string[], precisions: string[],
 *     variants: string[], modalities: string[] }[] }[]} One entry per task, in docs order.
 */
function readModelRegistry() {
  const categories = parseRegistry(readFileSync(REGISTRY_PATH, 'utf8'));
  for (const key of categories.keys()) {
    if (!(key in TASKS)) {
      throw new Error(
        `Registry category \`models.${key}\` has no entry in TASKS (docs/scripts/tasks/model-registry.mjs).`
      );
    }
  }
  return Object.entries(TASKS)
    .filter(([key, task]) => !task.skip && categories.has(key))
    .map(([key, task]) => ({ key, ...task, models: categories.get(key) }));
}

/**
 * Parses a `models.ts` source, current or from an earlier release.
 * @param {string} source The file's contents.
 * @returns {Map<string, object[]>} The models of each registry category.
 */
function parseRegistry(source) {
  const file = ts.createSourceFile(REGISTRY_PATH, source, ts.ScriptTarget.Latest, true);

  const constants = new Map();
  let registry;
  file.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const decl of node.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
      constants.set(decl.name.text, decl.initializer);
      if (decl.name.text === 'models') registry = decl.initializer;
    }
  });
  if (!registry || !ts.isObjectLiteralExpression(registry)) {
    throw new Error(`No \`export const models = {...}\` found in ${REGISTRY_PATH}`);
  }

  const categories = new Map();
  for (const prop of registry.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = prop.name.getText(file);
    const models = [];
    for (const entry of prop.initializer.properties ?? []) {
      if (!ts.isPropertyAssignment(entry)) continue;
      const name = entry.name.getText(file);
      const leaves = [];
      collectLeaves(entry.initializer, [], leaves, file);
      if (leaves.length === 0) continue;
      const variants = leaves.flatMap((leaf) => leaf.variants);
      models.push({
        path: `models.${key}.${name}`,
        description: firstSentence(jsDocOf(entry, file)),
        backends: unique(variants.map((v) => v.backend)).sort(byBackend),
        precisions: unique(variants.map((v) => v.precision).filter(Boolean)).sort(byPrecision),
        variants: summarizeLeafPaths(leaves.map((leaf) => leaf.path)),
        modalities: unique(variants.flatMap((v) => modalitiesOf(v.config, constants))),
      });
    }
    categories.set(key, models);
  }
  return categories;
}

/**
 * Walks a registry branch down to its `variants({...})` groups.
 * @param {ts.Expression} node A registry branch.
 * @param {string[]} path The keys leading to `node`, below the model entry.
 * @param {{ path: string[], variants: object[] }[]} out The groups found so far.
 * @param {ts.SourceFile} file The registry source.
 */
function collectLeaves(node, path, out, file) {
  if (ts.isCallExpression(node) && node.expression.getText(file) === 'variants') {
    const [map] = node.arguments;
    const variants = [];
    for (const prop of map.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      // Deprecated variants are on their way out, so they do not count
      // towards what a model supports.
      const init = prop.initializer;
      if (ts.isCallExpression(init) && init.expression.getText(file) === 'deprecated') continue;
      const config = init.getText(file);
      const [backend, ...rest] = prop.name.getText(file).toLowerCase().split('_');
      // OCR keys name only the backend; the precision is in the constant's name.
      const precision = rest.length > 0 ? rest.join('_') : config.toLowerCase().split('_').pop();
      variants.push({ backend, precision, config });
    }
    if (variants.length > 0) out.push({ path, variants });
    return;
  }
  const map =
    ts.isCallExpression(node) && node.expression.getText(file) === 'family'
      ? node.arguments[0]
      : node;
  if (!ts.isObjectLiteralExpression(map)) return;
  for (const prop of map.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    collectLeaves(prop.initializer, [...path, prop.name.getText(file)], out, file);
  }
}

/**
 * Collapses sub-group paths into one readable list, e.g. NANO, SMALL (each
 * SIZE_384, SIZE_640) rather than every combination.
 * @param {string[][]} paths The sub-group path of each `variants` group.
 * @returns {string[]} The sub-group names to show; empty for a single group.
 */
function summarizeLeafPaths(paths) {
  if (paths.length <= 1) return [];
  const heads = unique(paths.map((p) => p[0]));
  const tails = heads.map((head) =>
    paths
      .filter((p) => p[0] === head)
      .map((p) => p.slice(1).join('.'))
      .join(', ')
  );
  if (paths.every((p) => p.length === 2) && unique(tails).length === 1) {
    return [`${heads.join(', ')} (each ${tails[0]})`];
  }
  return paths.map((p) => p.join('.'));
}

function modalitiesOf(configName, constants) {
  const config = constants.get(configName);
  if (!config || !ts.isObjectLiteralExpression(config)) return [];
  const prop = config.properties.find(
    (p) => ts.isPropertyAssignment(p) && p.name.getText() === 'modalities'
  );
  if (!prop || !ts.isArrayLiteralExpression(prop.initializer)) return [];
  return prop.initializer.elements.filter(ts.isStringLiteral).map((e) => e.text);
}

function jsDocOf(node, file) {
  const ranges = ts.getLeadingCommentRanges(file.getFullText(), node.getFullStart()) ?? [];
  const doc = ranges
    .map((r) => file.getFullText().slice(r.pos, r.end))
    .filter((c) => c.startsWith('/**'))
    .pop();
  if (!doc) return '';
  return doc
    .replace(/^\/\*\*|\*\/$/g, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .filter((line) => !line.startsWith('@'))
    .join(' ')
    .replace(/\{@link\s+([^}\s]+)[^}]*\}/g, '`$1`')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstSentence(text) {
  const match = text.match(/^.*?[.!?](?=\s+[A-Z(`]|$)/);
  return (match ? match[0] : text).trim();
}

function unique(values) {
  return [...new Set(values)];
}

function byPrecision(a, b) {
  const rank = (p) =>
    PRECISION_ORDER.includes(p) ? PRECISION_ORDER.indexOf(p) : PRECISION_ORDER.length;
  return rank(a) - rank(b);
}

function byBackend(a, b) {
  const order = Object.keys(BACKEND_LABELS);
  return order.indexOf(a) - order.indexOf(b);
}

/**
 * @param {string} docPath A page under docs/docs.
 * @returns {string} The page's `slug` front matter.
 */
function readDocSlug(docPath) {
  const content = readFileSync(join(DOCS_DIR, 'docs', docPath), 'utf8');
  const slug = content.match(/^slug:\s*(\S+)\s*$/m);
  if (!slug) throw new Error(`docs/${docPath} has no slug`);
  return slug[1];
}
