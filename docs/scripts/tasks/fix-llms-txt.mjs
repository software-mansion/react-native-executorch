import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export { fixLLMsTxtDuplicatedPaths };

const FILES_TO_FIX = ['llms.txt'];
const DUPLICATED_PATH = '/react-native-executorch/react-native-executorch/';
const FIXED_PATH = '/react-native-executorch/';

function fixLLMsTxtDuplicatedPaths(buildDir) {
  console.log('Running LLMS.txt fix script...');
  console.log(`Looking in: ${buildDir}`);

  FILES_TO_FIX.forEach((fileName) => {
    const filePath = join(buildDir, fileName);

    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf8');

        if (content.includes(DUPLICATED_PATH)) {
          const fixedContent = content.replaceAll(DUPLICATED_PATH, FIXED_PATH);

          writeFileSync(filePath, fixedContent, 'utf8');
          console.log(`Fixed URLs in ${fileName}`);
        } else {
          console.info(`No broken URLs found in ${fileName}`);
        }
      } catch (err) {
        console.error(`Could not process ${fileName}:`, err);
        process.exit(1);
      }
    } else {
      console.warn(`File ${fileName} not found`);
    }
  });
}
