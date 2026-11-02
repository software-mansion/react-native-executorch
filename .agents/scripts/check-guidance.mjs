import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';

// An optional root lets validation be exercised on isolated fixtures.
const root = resolve(process.argv[2] ?? fileURLToPath(new URL('../../', import.meta.url)));
const skillsDir = resolve(root, '.agents/skills');
const errors = [];
const fail = (file, message) => errors.push(`${relative(root, file)}: ${message}`);

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : [];
  });
}

// Ignore code examples, including indented fences inside Markdown lists.
function prose(content) {
  let fence;
  return content
    .split('\n')
    .filter((line) => {
      const marker = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
      if (!fence && marker) {
        fence = marker[1];
        return false;
      }
      if (fence) {
        if (
          marker &&
          marker[1][0] === fence[0] &&
          marker[1].length >= fence.length &&
          !marker[2].trim()
        ) {
          fence = undefined;
        }
        return false;
      }
      return true;
    })
    .join('\n');
}

const files = markdownFiles(skillsDir);
files.push(resolve(root, 'AGENTS.md'));
const names = new Set();
let skills = 0;

for (const file of files) {
  if (!existsSync(file)) {
    fail(file, 'file is missing');
    continue;
  }
  let content = readFileSync(file, 'utf8');
  if (basename(file) === 'SKILL.md') {
    skills++;
    const header = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!header) {
      fail(file, 'missing YAML frontmatter');
    } else {
      const document = parseDocument(header[1]);
      for (const error of document.errors) fail(file, `invalid YAML: ${error.message}`);
      if (!document.errors.length) {
        const data = document.toJS();
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          fail(file, 'frontmatter must be a mapping');
        } else {
          const { name, description, metadata } = data;
          if (
            typeof name !== 'string' ||
            name.length > 64 ||
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) ||
            name !== relative(skillsDir, dirname(file))
          ) {
            fail(
              file,
              'name must match its skill directory and use lowercase letters/digits/hyphens'
            );
          }
          if (names.has(name)) fail(file, `duplicate skill name: ${name}`);
          names.add(name);
          if (typeof description !== 'string' || !description.trim() || description.length > 1024) {
            fail(file, 'description must be a nonempty string of at most 1024 characters');
          }
          if (
            metadata !== undefined &&
            (!metadata ||
              typeof metadata !== 'object' ||
              Array.isArray(metadata) ||
              Object.values(metadata).some((value) => typeof value !== 'string'))
          ) {
            fail(file, 'metadata must be a mapping of string values');
          }
        }
      }
      content = content.slice(header[0].length);
    }
  }

  // Repository guidance uses inline Markdown links with simple local paths. External URLs and
  // anchors are not fetched. Code spans are left intact so links with code-formatted labels work.
  for (const match of prose(content).matchAll(/\[[^\]\n]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1].replace(/^<|>$/g, '');
    if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(target)) continue;
    const path = target.split(/[?#]/)[0];
    if (!path) continue;
    let decoded;
    try {
      decoded = decodeURIComponent(path);
    } catch {
      fail(file, `invalid URL encoding: ${target}`);
      continue;
    }
    const destination = resolve(dirname(file), decoded);
    const fromRoot = relative(root, destination);
    if (isAbsolute(decoded) || fromRoot === '..' || fromRoot.startsWith(`..${sep}`)) {
      fail(file, `local link must stay within the repository: ${target}`);
    } else if (!existsSync(destination) || !statSync(destination).isFile()) {
      fail(file, `missing local file: ${target}`);
    }
  }
}

if (!skills) fail(skillsDir, 'no skills found');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${skills} contributor skills and local links in ${files.length} Markdown files.`
  );
}
