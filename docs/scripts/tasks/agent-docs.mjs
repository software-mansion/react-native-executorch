import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const docsDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const config = createRequire(import.meta.url)(join(docsDir, 'docusaurus.config.js'));

// Use the routes Docusaurus actually built. The default release has no version segment, while
// Next and older snapshots do. The development registry is not the released model inventory.
export function generateAgentDocs(buildDir) {
  const globalData = JSON.parse(readFileSync(join(docsDir, '.docusaurus/globalData.json'), 'utf8'));
  const versions = globalData['docusaurus-plugin-content-docs']?.default?.versions;
  if (!versions?.length) throw new Error('No built documentation versions found');
  const stable = versions.find((version) => version.isLast);
  const next = versions.find((version) => version.name === 'current');
  if (!stable || stable.name === 'current' || !next) {
    throw new Error('Expected released default documentation and Next');
  }

  const outputPath = (route) => {
    if (
      !route.startsWith(config.baseUrl) ||
      route.startsWith(`${config.baseUrl}${config.baseUrl.slice(1)}`)
    ) {
      throw new Error(`Invalid documentation base path: ${route}`);
    }
    return join(buildDir, route.slice(config.baseUrl.length));
  };
  const markdownRoute = (route) => `${route.replace(/\/$/, '')}.md`;
  const entry = (route, title) => `- [${title}](${config.url}${route})`;
  const status = (version) =>
    version.name === 'current'
      ? 'Unreleased development documentation. Verify API availability in the installed package.'
      : version.isLast
        ? 'Default released documentation.'
        : 'Historical release-line documentation.';

  // Missing Markdown, including an API symbol or stable snapshot page, fails the normal docs build.
  // Add provenance to generated files only; source snapshots remain unchanged.
  let pages = 0;
  for (const version of versions) {
    for (const doc of version.docs) {
      // Generated category navigation has no source guide and is excluded by the Markdown plugin.
      if (/^\/?category\//.test(doc.id)) continue;
      const route = markdownRoute(doc.path);
      const file = outputPath(route);
      const content = readFileSync(file, 'utf8');
      if (!content.trim()) throw new Error(`Empty agent documentation: ${route}`);
      const note = `> Documentation version: ${version.label}. ${status(version)}\n`;
      const body = content.replace(/^> Documentation version:[^\n]*\n\n/, '');
      writeFileSync(file, `${note}\n${body}`);
      pages++;
    }
  }

  const docLink = (version, id, title) => {
    const doc = version.docs.find((candidate) => candidate.id === id);
    if (!doc) throw new Error(`${version.label} is missing required agent guide: ${id}`);
    return entry(markdownRoute(doc.path), title);
  };
  const root =
    [
      '# React Native ExecuTorch',
      '',
      '> Run AI on-device in React Native: choose ready-to-use tasks and pre-exported models, or bring',
      '> your own compatible ExecuTorch .pte and build a custom mobile pipeline in TypeScript.',
      '',
      `Default documentation: ${stable.label}. Inspect the app's installed package version first.`,
      'Documentation is snapshotted by release line, not by every npm patch. Next describes development',
      'code. Keep the version segment when fetching Markdown, and follow one version at a time.',
      '',
      `## Released documentation (${stable.label})`,
      '',
      docLink(stable, stable.mainDocId, 'Installation and requirements'),
      docLink(stable, 'fundamentals/supported-models', 'Pre-exported models and task hooks'),
      docLink(
        stable,
        'core-and-advanced/exporting-custom-models',
        'Custom models: export, inspect and integrate'
      ),
      docLink(
        stable,
        'core-and-advanced/models-and-tensors',
        'Custom pipelines: model and tensor primitives'
      ),
      docLink(stable, 'core-and-advanced/schema-validation', 'Model contracts and dynamic shapes'),
      docLink(stable, 'api-reference/index', 'API reference and symbol links'),
      '',
      '## Development documentation (Next)',
      '',
      'Use these pages for development/nightly APIs after checking the installed version.',
      '',
      docLink(next, 'fundamentals/ai-tools', 'AI tools and consumer skill'),
      docLink(next, next.mainDocId, 'Next installation and requirements'),
      docLink(next, 'fundamentals/supported-models', 'Next model catalog'),
      docLink(next, 'core-and-advanced/exporting-custom-models', 'Next custom model workflow'),
      docLink(next, 'api-reference/index', 'Next API reference'),
      '',
      '## Historical documentation',
      '',
      ...versions
        .filter((version) => version !== stable && version !== next)
        .map((version) => docLink(version, version.mainDocId, version.label)),
    ].join('\n') + '\n';

  // Keep one small root index. Validate links locally; no dependence on external service uptime.
  for (const match of root.matchAll(/\]\((https?:\/\/[^)]+)\)/g)) {
    const target = new URL(match[1]);
    if (!readFileSync(outputPath(decodeURIComponent(target.pathname)), 'utf8').trim()) {
      throw new Error(`Empty agent index target: ${target}`);
    }
  }
  writeFileSync(join(buildDir, 'llms.txt'), root);
  console.log(`Validated ${pages} versioned Markdown pages and generated the root agent index.`);
}
