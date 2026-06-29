import { rnexecutorchJsi } from './native/bridge';
import { loadModel, type ModelMethodMeta } from './core/model';
import RNFS from 'react-native-fs';

/**
 * Retrieves the names of all ExecuTorch backends compiled and registered in the
 * native binary.
 * @category Utils
 * @returns An array of registered backend name strings (e.g. 'XnnpackBackend',
 * 'CoreMLBackend').
 */
export function getRegisteredBackends(): string[] {
  return rnexecutorchJsi.getExecuTorchRegisteredBackends();
}

/**
 * Inspects an ExecuTorch model file to fetch its metadata and signature info
 * for all methods.
 *
 * If a remote HTTP URL is provided, the utility downloads the model to a
 * temporary local file, reads its configuration and method signatures
 * (inputs/outputs shapes, types, and tags), and deletes the temporary file
 * before returning.
 * @category Utils
 * @experimental Subject to change once the temporary react-native-fs dependency is replaced. See [Issue #1253](https://github.com/software-mansion/react-native-executorch/issues/1253).
 * @param source The remote HTTP URL or local path to the `.pte` model file.
 * @returns A promise resolving to an object containing the model source and
 * method signature metadata.
 */
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

  let model: ReturnType<typeof loadModel> | undefined;

  try {
    model = loadModel(localPath);
    const methodNames = model.getMethodNames();

    const methods: { name: string; meta: ModelMethodMeta }[] = [];
    for (const method of methodNames) {
      const meta = model.getMethodMeta(method);
      methods.push({ name: method, meta });
    }

    return { source, methods };
  } finally {
    if (model) {
      model.dispose();
    }
    if (downloaded) {
      await RNFS.unlink(localPath).catch(() => {});
    }
  }
}
