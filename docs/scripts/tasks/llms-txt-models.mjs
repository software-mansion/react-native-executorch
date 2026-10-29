import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import {
  BACKEND_LABELS,
  BACKEND_PLATFORMS,
  readModelRegistry,
  readDocSlug,
  byPrecision,
} from './model-registry.mjs';
import { readAddedIn } from './model-history.mjs';

export { addModelsToLLMsTxt };

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = createRequire(import.meta.url)(join(__dirname, '..', '..', 'docusaurus.config.js'));
const DOCS_URL = `${config.url}${config.baseUrl}docs`;

// The plugin writes llms.txt from the docs pages alone, so assistants reading
// it learn neither which release is current nor which models ship. This adds
// both, ahead of the page index: a summary at the top of the header quote and
// a list of every registry model.
function addModelsToLLMsTxt(buildDir) {
  console.log('Adding the model registry to llms.txt...');
  const filePath = join(buildDir, 'llms.txt');
  if (!existsSync(filePath)) {
    console.warn('File llms.txt not found');
    return;
  }

  const tasks = readModelRegistry();
  const lines = readFileSync(filePath, 'utf8').split('\n');
  if (lines.includes('## Supported Models')) {
    console.info('llms.txt already lists the models');
    return;
  }

  const quote = lines.findIndex((line) => line.startsWith('>'));
  const firstSection = lines.findIndex((line) => line.startsWith('## '));
  if (quote === -1 || firstSection === -1) {
    throw new Error('llms.txt has no header quote or no sections to insert the models before');
  }

  const addedIn = readAddedIn(tasks.flatMap((task) => task.models.map((model) => model.path)));
  lines.splice(firstSection, 0, ...renderModels(tasks, addedIn), '');
  lines.splice(quote, 0, ...renderSummary(tasks, addedIn), '>');

  writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Added the model registry to llms.txt');
}

function renderSummary(tasks, addedIn) {
  const lastVersion = config.presets[0][1].docs.lastVersion;
  const models = tasks.flatMap((task) => task.models);
  const backends = [...new Set(models.flatMap((m) => m.backends))];
  const backendText = Object.keys(BACKEND_LABELS)
    .filter((b) => backends.includes(b))
    .map((b) => `${BACKEND_LABELS[b]} (${BACKEND_PLATFORMS[b]})`)
    .join(', ');
  const precisions = [...new Set(models.flatMap((m) => m.precisions))].sort(byPrecision);
  const today = new Date().toISOString().slice(0, 10);

  const latestMinor = `v${lastVersion.replace(/\.x$/, '.')}`;
  const added = addedIn
    ? models.filter((m) => addedIn.get(m.path)?.startsWith(latestMinor)).map((m) => `\`${m.path}\``)
    : [];

  return [
    `> Latest stable release: v${lastVersion} (npm \`react-native-executorch\`); this file was generated ${today}.`,
    `> ${models.length} pre-exported models across ${tasks.length} tasks, listed under "Supported Models" below.`,
    `> Backends: ${backendText}. Precisions: ${precisions.join(', ')}.`,
    ...(added.length > 0 ? [`> New in v${lastVersion}: ${added.join(', ')}.`] : []),
  ];
}

function renderModels(tasks, addedIn) {
  const lines = [
    '## Supported Models',
    '',
    `Generated from the library's \`models\` registry. Full table: [Supported Models](${DOCS_URL}${readDocSlug('01-fundamentals/04-supported-models.md')}). Any other ExecuTorch \`.pte\` can be loaded too.`,
    '',
  ];
  for (const task of tasks) {
    lines.push(
      `### ${task.title} ([guide](${DOCS_URL}${readDocSlug(task.doc)}), [benchmarks](${DOCS_URL}/benchmarks#${task.bench}))`,
      ''
    );
    if (task.note) lines.push(task.note, '');
    for (const model of task.models) {
      const parts = [model.description];
      if (model.modalities.length > 0) parts.push(`Inputs: text, ${model.modalities.join(', ')}.`);
      if (model.variants.length > 0) parts.push(`Variants: ${model.variants.join(', ')}.`);
      parts.push(`Backends: ${model.backends.map((b) => BACKEND_LABELS[b]).join(', ')}.`);
      if (addedIn) parts.push(`Added in ${addedIn.get(model.path) ?? 'the next release'}.`);
      lines.push(`- \`${model.path}\`: ${parts.join(' ')}`);
    }
    lines.push('');
  }
  return lines.slice(0, -1);
}
