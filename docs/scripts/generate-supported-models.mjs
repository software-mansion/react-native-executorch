import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BACKEND_LABELS, readModelRegistry } from './tasks/model-registry.mjs';

// Writes the Supported Models page from the `models` registry, so the list
// moves with the library instead of being kept by hand. The page is generated
// on every build and is not committed; `yarn docs:version` freezes a copy of it
// into the versioned docs.

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'docs', '01-fundamentals', '04-supported-models.md');

const FRONT_MATTER = `---
title: Supported Models
slug: /fundamentals/supported-models
description: 'Every pre-exported model in the React Native ExecuTorch registry, by task: LLMs and VLMs, speech, computer vision, embeddings and retrieval, with backends and precisions.'
keywords:
  [
    react native executorch,
    supported models,
    on-device llm,
    whisper,
    yolo,
    depth anything,
    colbert,
    xnnpack,
    core ml,
    mlx,
    vulkan,
  ]
---`;

function cell(text) {
  return text.replaceAll('|', '\\|');
}

function render(tasks) {
  const lines = [
    FRONT_MATTER,
    '',
    '# Supported Models',
    '',
    'Every model below ships pre-exported in the [`models`](./02-downloading-models.md) registry and downloads on first use. Backends: XNNPACK (CPU, iOS and Android), Core ML and MLX (iOS), Vulkan (Android GPU); `DEFAULT` picks the fastest one the device can run. Any other ExecuTorch `.pte` can be loaded too, see [Exporting Custom Models](../03-core-and-advanced/07-exporting-custom-models.md).',
    '',
  ];
  for (const task of tasks) {
    lines.push(`## ${task.title}`, '');
    lines.push(
      `[Guide](../${task.doc}) · [Benchmarks](../04-benchmarks/01-benchmarks.mdx#${task.bench})`,
      ''
    );
    if (task.note) lines.push(task.note, '');
    lines.push('| Model | Description | Backends | Precisions |', '| :-- | :-- | :-- | :-- |');
    for (const model of task.models) {
      let description = model.description;
      if (model.modalities.length > 0)
        description += ` Inputs: text, ${model.modalities.join(', ')}.`;
      if (model.variants.length > 0) description += ` Variants: ${model.variants.join(', ')}.`;
      lines.push(
        `| \`${model.path}\` | ${cell(description)} | ${model.backends.map((b) => BACKEND_LABELS[b]).join(', ')} | ${model.precisions.join(', ')} |`
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

writeFileSync(OUT_PATH, render(readModelRegistry()), 'utf8');
console.log(`Generated ${OUT_PATH}`);
