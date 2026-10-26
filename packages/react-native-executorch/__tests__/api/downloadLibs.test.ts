/**
 * The install-time hashing and extraction in `scripts/download-libs.js`.
 *
 * Both steps used to shell out through a shell string, and both broke on
 * Windows in ways that made the package impossible to install there (#1493):
 * `sha256sum` prefixes its whole output line with a backslash when the filename
 * contains one, so every hash of a `C:\...` path came back as `\<hex>` and no
 * artifact validated; and `tar -f C:\...` is the `host:file` form to GNU tar,
 * which then tried to resolve a host named `C`. GNU tar also unquotes `-C`, so
 * the `\r` and `\t` of `\react-native-executorch\third-party` turned into
 * control characters. These suites pin the
 * shell-free replacements against paths that reproduce both.
 */
import { createHash, randomBytes } from 'crypto';
import { execFileSync } from 'child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  rmSync,
  existsSync,
} from 'fs';
import { createServer, type Server, type ServerResponse } from 'http';
import type { AddressInfo } from 'net';
import { tmpdir } from 'os';
import { join } from 'path';

const { sha256, extract, download } = require('../../scripts/download-libs.js');

let workDir: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'rnet-download-libs-'));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe('sha256', () => {
  it('hashes a file', () => {
    // Larger than the 1 MiB read buffer, so the chunked loop is exercised.
    const contents = randomBytes(3 * 1024 * 1024 + 17);
    const file = join(workDir, 'artifact.tar.gz');
    writeFileSync(file, contents);

    expect(sha256(file)).toBe(createHash('sha256').update(contents).digest('hex'));
  });

  it('hashes a file whose name contains a backslash', () => {
    const contents = randomBytes(64);
    // Stands in for the Windows path that broke `sha256sum`; a backslash is an
    // ordinary filename character here, so this runs on every platform.
    const file = join(workDir, 'C\\Users\\artifact.tar.gz');
    writeFileSync(file, contents);

    expect(sha256(file)).toBe(createHash('sha256').update(contents).digest('hex'));
  });

  it('hashes an empty file', () => {
    const file = join(workDir, 'empty.tar.gz');
    writeFileSync(file, '');

    expect(sha256(file)).toBe(createHash('sha256').update('').digest('hex'));
  });
});

describe('extract', () => {
  /** Builds a gzipped tarball holding `executorch/libexecutorch.so`. */
  function makeTarball(name: string) {
    const stageDir = join(workDir, 'stage');
    mkdirSync(join(stageDir, 'executorch'), { recursive: true });
    writeFileSync(join(stageDir, 'executorch', 'libexecutorch.so'), 'payload');
    const tarball = join(workDir, name);
    execFileSync('tar', ['-czf', tarball, '-C', stageDir, 'executorch']);
    return tarball;
  }

  it('unpacks the archive into a destination that does not exist yet', () => {
    const tarball = makeTarball('core-android-arm64-v8a.tar.gz');
    const destDir = join(workDir, 'third-party', 'android', 'libs');

    extract(tarball, destDir);

    expect(readFileSync(join(destDir, 'executorch', 'libexecutorch.so'), 'utf8')).toBe('payload');
  });

  it('unpacks an archive whose path contains a backslash', () => {
    const tarball = makeTarball('C\\cache\\core-android-arm64-v8a.tar.gz');
    const destDir = join(workDir, 'dest');

    extract(tarball, destDir);

    expect(existsSync(join(destDir, 'executorch', 'libexecutorch.so'))).toBe(true);
  });

  it('unpacks into a destination whose path contains backslash escapes', () => {
    const tarball = makeTarball('core-android-arm64-v8a.tar.gz');
    // `\r` and `\t` are what GNU tar's default unquoting turns into control
    // characters, as in `node_modules\react-native-executorch\third-party`.
    const destDir = join(workDir, 'node_modules\\react-native-executorch\\third-party');

    extract(tarball, destDir);

    expect(existsSync(join(destDir, 'executorch', 'libexecutorch.so'))).toBe(true);
  });

  it('reports which archive failed rather than a bare exit code', () => {
    const tarball = join(workDir, 'truncated.tar.gz');
    writeFileSync(tarball, randomBytes(128));

    expect(() => extract(tarball, join(workDir, 'dest'))).toThrow(/truncated\.tar\.gz/);
  });
});

describe('download', () => {
  let server: Server;
  let baseUrl: string;
  let handler: (res: ServerResponse) => void;

  beforeEach(async () => {
    server = createServer((_req, res) => handler(res));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  const filesIn = (dir: string) => readdirSync(dir).sort();

  it('never exposes a partial file at the destination', async () => {
    // Another copy of the package already cached a complete file here and may
    // be reading it while this one refreshes it (#1510).
    const dest = join(workDir, 'core.tar.gz.sha256');
    writeFileSync(dest, 'cached');
    let finish!: () => void;
    handler = (res) => {
      res.writeHead(200);
      res.write('first-');
      finish = () => res.end('second');
    };

    const downloading = download(`${baseUrl}/core.tar.gz.sha256`, dest);
    // Wait until the first chunk has reached the disk somewhere in workDir.
    while (!filesIn(workDir).some((f) => readFileSync(join(workDir, f), 'utf8') === 'first-')) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    expect(readFileSync(dest, 'utf8')).toBe('cached');
    finish();
    await downloading;
    expect(readFileSync(dest, 'utf8')).toBe('first-second');
    expect(filesIn(workDir)).toEqual(['core.tar.gz.sha256']);
  });

  it('leaves the destination untouched when the request fails', async () => {
    const dest = join(workDir, 'core.tar.gz');
    writeFileSync(dest, 'cached');
    handler = (res) => {
      res.writeHead(404);
      res.end();
    };

    await expect(download(`${baseUrl}/core.tar.gz`, dest)).rejects.toThrow(/HTTP 404/);
    expect(readFileSync(dest, 'utf8')).toBe('cached');
    expect(filesIn(workDir)).toEqual(['core.tar.gz']);
  });

  it('lets concurrent downloads of the same file both complete', async () => {
    const dest = join(workDir, 'core.tar.gz');
    const body = randomBytes(256 * 1024);
    handler = (res) => {
      res.writeHead(200);
      res.end(body);
    };

    await Promise.all([
      download(`${baseUrl}/core.tar.gz`, dest),
      download(`${baseUrl}/core.tar.gz`, dest),
    ]);

    expect(readFileSync(dest).equals(body)).toBe(true);
    expect(filesIn(workDir)).toEqual(['core.tar.gz']);
  });
});
