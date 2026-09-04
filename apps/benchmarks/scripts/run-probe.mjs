#!/usr/bin/env node
/**
 * Serves a set of `.pte` arms to the device and collects the tensors they produce.
 *
 * This is the counterpart to `src/probe.ts`, and it exists for defects that only
 * appear on real hardware. The motivating case is
 * software-mansion/react-native-executorch#1406: Core ML fp16 draws shifted
 * geometry on an iPhone's ANE, and a Mac cannot reproduce it at all because its
 * own ANE compiler rejects the model and Core ML falls back to CPU/GPU silently.
 * The wrong numbers exist only on the phone, so they have to be fetched from it.
 *
 * The host owns the input. It writes one raw tensor per input slot and serves
 * the bytes; the device feeds them to `execute` untouched. Nothing on either
 * side resizes or normalises anything, so an output difference is a difference
 * in computation rather than in preprocessing.
 *
 * Usage:
 *   yarn probe --dir ~/es-rfdetr/exports/rfdetr-seg-arms --platform ios
 *   yarn probe --dir <dir> --platform ios --no-launch   # app started by hand
 *
 * `--dir` is a directory holding `manifest.json`, the `.pte` arms and the input
 * buffers, as written by the exporter's `rfdetr_seg_build_arms.py`.
 */

import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULTS = {
  dir: '',
  platform: 'ios',
  port: '8098',
  host: '',
  out: '',
  method: 'forward',
  launch: true,
};

function parseArgs(argv) {
  const options = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--no-launch') options.launch = false;
    else if (arg.startsWith('--')) {
      const key = arg
        .slice(2)
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      if (!(key in DEFAULTS)) throw new Error(`Unknown option ${arg}`);
      options[key] = argv[++i];
    } else throw new Error(`Unexpected argument ${arg}`);
  }
  if (!options.dir) throw new Error('--dir is required');
  return options;
}

/**
 * The address the device should call back on.
 *
 * A phone on the LAN cannot reach `localhost`, and unlike Android there is no
 * reverse tunnel on iOS, so this has to be a real interface address.
 * @returns The first non-internal IPv4 address.
 */
function lanAddress() {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) return address.address;
    }
  }
  throw new Error('no external IPv4 interface; pass --host');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const dir = resolve(options.dir.replace(/^~/, process.env.HOME));
  const manifestPath = join(dir, 'manifest.json');
  if (!existsSync(manifestPath)) throw new Error(`no manifest.json in ${dir}`);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  const outDir = resolve(
    (options.out || join(dir, 'device-results')).replace(/^~/, process.env.HOME)
  );
  mkdirSync(outDir, { recursive: true });

  const host = options.host || lanAddress();
  const port = Number(options.port);
  const base = `http://${host}:${port}`;

  const targets = manifest.arms.map((arm) => ({
    id: arm.id,
    modelUrl: `${base}/file/${arm.file}`,
    inputUrls: manifest.inputs.map((input) => `${base}/file/${input.file}`),
    method: options.method,
  }));

  console.log(`[probe] serving ${dir} on ${base}`);
  for (const target of targets) console.log(`[probe]   arm ${target.id} -> ${target.modelUrl}`);

  const pending = new Set(targets.map((target) => target.id));

  const server = createServer(async (request, response) => {
    const url = request.url ?? '';

    if (url === '/probe-plan') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(targets));
      console.log('[probe] device fetched the plan');
      return;
    }

    if (url.startsWith('/file/')) {
      const name = decodeURIComponent(url.slice('/file/'.length));
      // Serve only what the manifest names. The device is told exactly which
      // files to ask for, so anything else is a bug rather than a request to
      // honour, and this keeps a directory of exports from becoming a file
      // server for the whole LAN.
      const allowed = new Set([
        ...manifest.arms.map((arm) => arm.file),
        ...manifest.inputs.map((input) => input.file),
      ]);
      if (!allowed.has(name)) {
        response.writeHead(404).end();
        console.log(`[probe] refused ${name}`);
        return;
      }
      const body = readFileSync(join(dir, name));
      response.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(body.length),
      });
      response.end(body);
      console.log(`[probe] served ${name} (${(body.length / 1e6).toFixed(1)} MB)`);
      return;
    }

    if (url === '/probe-result' && request.method === 'POST') {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end('{"ok":true}');

      pending.delete(result.id);
      if (result.status !== 'ok') {
        console.log(`[probe] ${result.id} FAILED: ${result.error}`);
      } else {
        const written = [];
        for (const [index, tensorOut] of result.outputs.entries()) {
          const bytes = Buffer.from(tensorOut.base64, 'base64');
          const file = `${result.id}__${index}__${tensorOut.shape.join('x')}.${tensorOut.dtype}.bin`;
          writeFileSync(join(outDir, file), bytes);
          written.push(`${tensorOut.shape.join('x')} ${tensorOut.dtype}`);
        }
        writeFileSync(
          join(outDir, `${result.id}.meta.json`),
          JSON.stringify(
            {
              id: result.id,
              backends: result.backends,
              inputShapes: result.inputShapes,
              outputs: result.outputs.map((o, i) => ({
                index: i,
                shape: o.shape,
                dtype: o.dtype,
              })),
            },
            null,
            2
          )
        );
        console.log(`[probe] ${result.id} ok: ${written.join(', ')}`);
        console.log(`[probe]   backends ${JSON.stringify(result.backends)}`);
      }

      if (pending.size === 0) {
        console.log(`[probe] all arms reported; results in ${outDir}`);
        setTimeout(() => process.exit(0), 500);
      } else {
        console.log(`[probe] waiting on ${[...pending].join(', ')}`);
      }
      return;
    }

    response.writeHead(404).end();
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[probe] collector on ${base}`);
    if (!options.launch) {
      console.log('[probe] start the app by hand; it will fetch /probe-plan');
      return;
    }
    const env = {
      ...process.env,
      EXPO_PUBLIC_BENCH_MODE: 'probe',
      EXPO_PUBLIC_BENCH_SINK: base,
      EXPO_PUBLIC_BENCH_AUTOSTART: 'true',
      REACT_NATIVE_PACKAGER_HOSTNAME: host,
    };
    const args = ['expo', 'run:' + options.platform, '--device'];
    console.log(`[probe] yarn ${args.join(' ')}`);
    const child = spawn('yarn', args, { cwd: APP_ROOT, env, stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code !== 0) console.log(`[probe] build exited ${code}`);
    });
  });
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
