/**
 * Where `scripts/download-libs.js` looks for the `react-native-executorch`
 * block.
 *
 * The block decides which native artifacts get downloaded, and it is read at
 * install time from `INIT_CWD` — the directory the install was invoked in. In a
 * workspace that is the repository root, so a block in `apps/mobile/package.json`
 * used to be ignored silently: the install succeeded, every backend came down,
 * and the app was simply larger than asked for. Worse, an app declaring
 * `"libs": []` to dodge an OpenCV conflict got OpenCV anyway.
 *
 * So the lookup also walks up from the installed package, which lands on the app
 * whenever it has its own `node_modules` (pnpm, nohoist). These suites pin both
 * paths, and the precedence between them.
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const SCRIPT = '../../scripts/download-libs.js';

/** npm's own fallback for `INIT_CWD`, spelled the way npm spells it. */
const LOCAL_PREFIX = 'npm_config_local_prefix';

/**
 * Loads the script with `INIT_CWD` pointing at `initCwd`.
 *
 * The variable stays set until `afterEach` restores it: the lookup reads it
 * when it is called, not when the module is loaded.
 */
function loadWith(initCwd: string | undefined) {
  if (initCwd === undefined) delete process.env.INIT_CWD;
  else process.env.INIT_CWD = initCwd;
  jest.resetModules();
  return require(SCRIPT);
}

function writeManifest(dir: string, block?: unknown) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify(
      block === undefined ? { name: 'app' } : { 'name': 'app', 'react-native-executorch': block },
      null,
      2
    )
  );
}

describe('native libs user config', () => {
  let root: string;
  let outerInitCwd: string | undefined;
  let outerLocalPrefix: string | undefined;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'rne-config-'));
    outerInitCwd = process.env.INIT_CWD;
    outerLocalPrefix = process.env[LOCAL_PREFIX];
    // npm_config_local_prefix is the fallback for INIT_CWD; a stray one from the
    // outer yarn process would leak into every case.
    delete process.env[LOCAL_PREFIX];
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    if (outerInitCwd === undefined) delete process.env.INIT_CWD;
    else process.env.INIT_CWD = outerInitCwd;
    if (outerLocalPrefix === undefined) delete process.env[LOCAL_PREFIX];
    else process.env[LOCAL_PREFIX] = outerLocalPrefix;
  });

  it('reads the block from the directory the install ran in', () => {
    writeManifest(root, { backends: ['xnnpack'], libs: [] });
    const { findUserConfig } = loadWith(root);

    const { config, manifest } = findUserConfig();

    expect(config).toEqual({ backends: ['xnnpack'], libs: [] });
    expect(manifest).toBe(join(root, 'package.json'));
  });

  it('prefers the install directory over anything above the package', () => {
    writeManifest(root, { backends: ['coreml'] });
    const { findUserConfig } = loadWith(root);

    expect(findUserConfig().config).toEqual({ backends: ['coreml'] });
  });

  it('reports no block when the manifest has none', () => {
    writeManifest(root);
    const { findUserConfig } = loadWith(root);

    expect(findUserConfig().config).toBeUndefined();
  });

  it('falls back to enabling everything when there is no block', () => {
    writeManifest(root);
    const { readUserConfig, ALL_BACKENDS, ALL_LIBS } = loadWith(root);

    const resolved = readUserConfig();

    expect(new Set(resolved.backends)).toEqual(new Set(ALL_BACKENDS));
    expect(new Set(resolved.libs)).toEqual(new Set(ALL_LIBS));
  });

  it('survives an unreadable manifest', () => {
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, 'package.json'), '{ not json');
    const { findUserConfig } = loadWith(root);

    expect(() => findUserConfig()).not.toThrow();
  });

  it('expands features into backends and libs', () => {
    writeManifest(root, { features: ['textToSpeech'] });
    const { readUserConfig } = loadWith(root);

    const resolved = readUserConfig();

    expect(resolved.libs).toContain('phonemis');
    expect(resolved.backends).toContain('xnnpack');
  });

  it('rejects an unknown feature by name', () => {
    writeManifest(root, { features: ['telepathy'] });
    const { readUserConfig } = loadWith(root);

    expect(() => readUserConfig()).toThrow(/telepathy/);
  });
});
