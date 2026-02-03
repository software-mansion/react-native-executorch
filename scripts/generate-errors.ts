#!/usr/bin/env ts-node

import { errorDefinitions } from './errors.config';
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.join(__dirname, '..');

function extractComments(): Map<string, string> {
  const configPath = path.join(__dirname, 'errors.config.ts');
  const content = fs.readFileSync(configPath, 'utf-8');
  const comments = new Map<string, string>();

  // Match JSDoc comments followed by error name
  const commentPattern = /\/\*\*?\s*([\s\S]*?)\s*\*\/\s*(\w+):/g;
  let match;

  while ((match = commentPattern.exec(content)) !== null) {
    const commentText = match[1]
      .split('\n')
      .map((line) => line.replace(/^\s*\*\s?/, '').trim())
      .filter((line) => line.length > 0)
      .join('\n   * ');
    const errorName = match[2];
    comments.set(errorName, commentText);
  }

  return comments;
}

function generateCppEnum() {
  const comments = extractComments();

  // Filter out ExecuTorch mapped errors (0x00-0x32) for C++
  const execuTorchErrorCodes = new Set([
    'Ok',
    'Internal',
    'InvalidState',
    'EndOfMethod',
    'NotSupported',
    'NotImplemented',
    'InvalidArgument',
    'InvalidType',
    'OperatorMissing',
    'NotFound',
    'MemoryAllocationFailed',
    'AccessFailed',
    'InvalidProgram',
    'InvalidExternalData',
    'OutOfResources',
    'DelegateInvalidCompatibility',
    'DelegateMemoryAllocationFailed',
    'DelegateInvalidHandle',
  ]);

  const entries = Object.entries(errorDefinitions)
    .filter(([name]) => !execuTorchErrorCodes.has(name))
    .map(([name, code]) => {
      const comment = comments.get(name);
      if (comment) {
        return `  /**\n   * ${comment}\n   */\n  ${name} = ${code},`;
      }
      return `  ${name} = ${code},`;
    })
    .join('\n');

  const cpp = `#pragma once

// Auto-generated from scripts/errors.config.ts
// DO NOT EDIT MANUALLY - Run 'yarn codegen:errors' to regenerate

#include <cstdint>

namespace rnexecutorch {

enum class RnExecutorchErrorCode : int32_t {
${entries}
};

} // namespace rnexecutorch
`;

  const outputPath = path.join(
    REPO_ROOT,
    'packages/react-native-executorch/common/rnexecutorch/ErrorCodes.h'
  );
  fs.writeFileSync(outputPath, cpp);
  console.log(`Generated C++ enum: ${outputPath}`);
}

function generateTypeScriptEnum() {
  const comments = extractComments();
  const entries = Object.entries(errorDefinitions)
    .map(([name, code]) => {
      const comment = comments.get(name);
      if (comment) {
        return `  /**\n   * ${comment}\n   */\n  ${name} = ${code},`;
      }
      return `  ${name} = ${code},`;
    })
    .join('\n');

  const ts = `// Auto-generated from scripts/errors.config.ts
// DO NOT EDIT MANUALLY - Run 'yarn codegen:errors' to regenerate

export enum RnExecutorchErrorCode {
${entries}
}
`;

  const outputPath = path.join(
    REPO_ROOT,
    'packages/react-native-executorch/src/errors/ErrorCodes.ts'
  );
  fs.writeFileSync(outputPath, ts);
  console.log(`Generated TypeScript enum: ${outputPath}`);
}

function main() {
  console.log('Generating error code enums...\n');
  generateCppEnum();
  generateTypeScriptEnum();
  console.log('\n✨ Done!');
}

main();
