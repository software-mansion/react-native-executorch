import { rnexecutorchJsi } from './native/bridge';
import { loadModel, type ModelMethodMeta } from './core/model';
import RNFS from 'react-native-fs';

export function getRegisteredBackends(): string[] {
  return rnexecutorchJsi.getExecuTorchRegisteredBackends();
}

export async function inspectModel(source: string): Promise<{
  source: string;
  methods: { name: string; meta: ModelMethodMeta }[];
}> {
  let localPath = source;
  let downloaded = false;

  if (source.startsWith('http')) {
    localPath = `${RNFS.TemporaryDirectoryPath}/inspect_model_${Date.now()}.pte`;
    await RNFS.downloadFile({ fromUrl: source, toFile: localPath }).promise;
    downloaded = true;
  }

  try {
    const model = loadModel(localPath);
    const methodNames = model.getMethodNames();

    const methods: { name: string; meta: ModelMethodMeta }[] = [];
    for (const method of methodNames) {
      const meta = model.getMethodMeta(method);
      methods.push({ name: method, meta });
    }

    model.dispose();
    return { source, methods };
  } catch (e) {
    throw e;
  } finally {
    if (downloaded) {
      await RNFS.unlink(localPath).catch(() => {});
    }
  }
}
