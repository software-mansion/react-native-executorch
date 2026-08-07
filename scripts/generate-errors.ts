#!/usr/bin/env ts-node

import { errorDefinitions } from './errors.config';
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.join(__dirname, '..');
const PACKAGE_ROOT = path.join(REPO_ROOT, 'packages/react-native-executorch');

const BANNER = [
  'Auto-generated from scripts/errors.config.ts',
  "DO NOT EDIT MANUALLY - run 'yarn codegen:errors' to regenerate",
];

/**
 * Pulls the JSDoc comment attached to each error name out of the config so the
 * generated enums carry the same documentation as the source of truth.
 * @returns Error name to its doc comment body.
 */
function extractComments(): Map<string, string> {
  const configPath = path.join(__dirname, 'errors.config.ts');
  const content = fs.readFileSync(configPath, 'utf-8');
  const comments = new Map<string, string>();

  const commentPattern = /\/\*\*\s*([\s\S]*?)\s*\*\/\s*(\w+):/g;
  let match;

  while ((match = commentPattern.exec(content)) !== null) {
    const lines = match[1]
      .split('\n')
      .map((line) => line.replace(/^\s*\*\s?/, '').trimEnd())
      .filter((line) => line.length > 0);
    comments.set(match[2], lines.join('\n'));
  }

  return comments;
}

function renderDocComment(comment: string | undefined, indent: string): string {
  if (!comment) return '';
  const body = comment
    .split('\n')
    .map((line) => `${indent} * ${line}`.trimEnd())
    .join('\n');
  return `${indent}/**\n${body}\n${indent} */\n`;
}

function generateCppEnum() {
  const comments = extractComments();
  const entries = Object.entries(errorDefinitions)
    .map(([name, code]) => `${renderDocComment(comments.get(name), '    ')}    ${name} = ${code},`)
    .join('\n');

  const cpp = `#pragma once

${BANNER.map((line) => `// ${line}`).join('\n')}

#include <cstdint>

namespace rnexecutorch::core::error {

/**
 * Machine-readable error codes surfaced to JavaScript as \`RnExecutorchError.code\`.
 *
 * Kept deliberately small: a code exists so a caller can branch on it. Errors
 * coming out of the ExecuTorch runtime keep their own numbering and travel in
 * the separate \`etCode\` field.
 */
enum class ErrorCode : int32_t {
${entries}
};

} // namespace rnexecutorch::core::error
`;

  const outputPath = path.join(PACKAGE_ROOT, 'cpp/core/error_codes.h');
  fs.writeFileSync(outputPath, cpp);
  console.log(`Generated C++ enum: ${path.relative(REPO_ROOT, outputPath)}`);
}

function generateTypeScriptEnum() {
  const comments = extractComments();
  const entries = Object.entries(errorDefinitions)
    .map(([name, code]) => `${renderDocComment(comments.get(name), '  ')}  ${name} = ${code},`)
    .join('\n');

  const ts = `${BANNER.map((line) => `// ${line}`).join('\n')}

/**
 * Machine-readable classification of a {@link RnExecutorchError}.
 *
 * Branch on this rather than on the error message: messages are written for
 * humans and change freely between releases, codes do not.
 * @category Errors
 */
export enum RnExecutorchErrorCode {
${entries}
}
`;

  const outputPath = path.join(PACKAGE_ROOT, 'src/errors/codes.ts');
  fs.writeFileSync(outputPath, ts);
  console.log(`Generated TypeScript enum: ${path.relative(REPO_ROOT, outputPath)}`);
}

function main() {
  console.log('Generating error code enums...\n');
  generateCppEnum();
  generateTypeScriptEnum();
  console.log('\nDone.');
}

main();
