import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateAgentDocs } from './tasks/agent-docs.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BUILD_DIR = join(__dirname, '..', 'build');

async function postbuild() {
  try {
    generateAgentDocs(BUILD_DIR);
    console.log('All post-build tasks completed successfully.\n');
  } catch (error) {
    console.error('\nPost-build script failed:', error);
    process.exit(1);
  }
}

postbuild();
