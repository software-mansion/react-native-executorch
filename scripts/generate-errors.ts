#!/usr/bin/env ts-node

import { errorDefinitions } from './errors.config';
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.join(__dirname, '..');

function generateCppEnum() {
  const entries = Object.entries(errorDefinitions)
    .map(([name, code]) => `  ${name} = ${code},`)
    .join('\n');

  const cpp = `#pragma once

// Auto-generated from scripts/errors.config.ts
// DO NOT EDIT MANUALLY - Run 'yarn codegen:errors' to regenerate

#include <cstdint>

namespace rnexecutorch {

enum class RnExecutorchInternalError : int32_t {
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
  const entries = Object.entries(errorDefinitions)
    .map(([name, code]) => `  ${name} = ${code},`)
    .join('\n');

  const ts = `// Auto-generated from scripts/errors.config.ts
// DO NOT EDIT MANUALLY - Run 'yarn codegen:errors' to regenerate

export enum ETErrorCode {
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
