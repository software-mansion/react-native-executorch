#!/usr/bin/env node
/**
 * Drives a benchmark run and collects its results.
 *
 * Starts an HTTP collector, points the app at it through `EXPO_PUBLIC_BENCH_*`,
 * builds and launches the app, and waits for the run to finish before writing
 * the report to `results/`.
 *
 * The collector exists because getting structured data off a phone is otherwise
 * platform-specific: `adb logcat` covers Android, `xcrun simctl` covers the iOS
 * Simulator, and a physical iPhone has no equivalent short of Console.app. An
 * HTTP POST works the same everywhere — over `adb reverse` on Android, and over
 * the LAN on an iOS device.
 *
 * Usage:
 *   yarn bench --platform android --label et-1.3.1
 *   yarn bench --platform ios --suite full --label et-1.4.1
 *   yarn bench --platform ios --no-launch          # app started by hand
 */

import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULTS = {
  platform: 'android',
  suite: 'quick',
  only: '',
  label: 'local',
  iterations: '20',
  warmup: '3',
  memoryIterations: '5',
  port: '8099',
  host: '',
  out: '',
  cooldown: '0',
  pinClocks: 'auto',
};

function parseArgs(argv) {
  const options = { ...DEFAULTS, launch: true, memory: true, native: true };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--no-launch') options.launch = false;
    else if (arg === '--no-memory') options.memory = false;
    else if (arg === '--no-native') options.native = false;
    else if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      if (!(key in DEFAULTS)) throw new Error(`Unknown option ${arg}`);
      options[key] = argv[++i];
    } else throw new Error(`Unexpected argument ${arg}`);
  }

  if (!['auto', 'on', 'off'].includes(options.pinClocks)) {
    throw new Error(`--pin-clocks must be auto, on or off, got ${options.pinClocks}`);
  }
  if (options.platform !== 'ios' && options.platform !== 'android') {
    throw new Error(`--platform must be ios or android, got ${options.platform}`);
  }
  return options;
}

/** First non-internal IPv4 address, for an iOS device reaching the host over LAN. */
function lanAddress() {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) return address.address;
    }
  }
  return null;
}

function readBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        rejectBody(error);
      }
    });
    request.on('error', rejectBody);
  });
}

function startCollector(port, onCase, onEnd) {
  const server = createServer(async (request, response) => {
    let body = null;
    try {
      body = await readBody(request);
    } catch {
      response.writeHead(400).end();
      return;
    }
    response.writeHead(204).end();

    if (request.url === '/begin') {
      console.log(`\n[bench] run "${body.label}" started — ${body.cases.length} cases`);
    } else if (request.url === '/case') {
      const summary =
        body.status === 'ok'
          ? `${body.pipeline?.median ?? '-'} ms median` +
            (body.memory ? `, peak ${body.memory.peakMb} MB` : '')
          : `FAILED: ${body.error}`;
      console.log(`[bench] ${body.id} — ${summary}`);
      onCase(body);
    } else if (request.url === '/end') {
      onEnd(body);
    }
  });

  return new Promise((resolveServer, rejectServer) => {
    server.on('error', (error) => {
      rejectServer(
        error.code === 'EADDRINUSE'
          ? new Error(
              `port ${port} is in use — another run is still open. Pass --port to change it.`
            )
          : error
      );
    });
    // 0.0.0.0 so an iOS device on the LAN can reach the collector, not just
    // adb-reversed localhost traffic from Android.
    server.listen(port, '0.0.0.0', () => resolveServer(server));
  });
}

function run(command, args, env) {
  return spawn(command, args, { cwd: APP_ROOT, env, stdio: 'inherit', shell: false });
}

/**
 * Pins the CPU to a fixed, sustainable clock for the duration of a run.
 *
 * Android exposes `PowerManager`'s FIXED_PERFORMANCE mode over `cmd power`,
 * which vendors implement as a frequency cap rather than a hint. On a Galaxy
 * S26 Ultra it takes every cluster from 3.19/3.40 GHz down to ~1.98 GHz, so a
 * long suite cannot boost early and sag later as the device heats. That trades
 * absolute speed for the thing a benchmark actually needs: the same clock in
 * every run.
 *
 * Not every device implements the HAL, so `verifyClockPin` reads the frequency
 * back rather than trusting the call. There is no iOS equivalent: nothing in
 * the public API pins or caps the clock, so runs there rely on the thermal
 * gate alone.
 */
function setClockPin(enabled) {
  return new Promise((done) => {
    const child = spawn(
      'adb',
      ['shell', 'cmd', 'power', 'set-fixed-performance-mode-enabled', String(enabled)],
      {
        stdio: 'ignore',
      }
    );
    child.on('exit', () => done());
    child.on('error', () => done());
  });
}

/** Reads back the per-cluster max frequency, so a no-op HAL is visible. */
function readMaxFrequencies() {
  return new Promise((done) => {
    const child = spawn(
      'adb',
      ['shell', 'cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_max_freq'],
      { stdio: ['ignore', 'pipe', 'ignore'] }
    );
    let out = '';
    child.stdout.on('data', (chunk) => (out += chunk));
    child.on('exit', () =>
      done(
        out
          .split(/\s+/)
          .filter(Boolean)
          .map(Number)
          .filter((n) => Number.isFinite(n))
      )
    );
    child.on('error', () => done([]));
  });
}

function adbReverse(port, quiet = false) {
  const result = spawn('adb', ['reverse', `tcp:${port}`, `tcp:${port}`], {
    stdio: quiet ? 'ignore' : 'inherit',
  });
  return new Promise((resolveReverse) => result.on('exit', resolveReverse));
}

/**
 * Keeps re-establishing the reverse tunnel for the life of the run.
 *
 * Observed on a wireless `adb` connection: the tunnel disappears partway through
 * a long suite, and every result the app posts after that is dropped while the
 * run itself carries on looking healthy. Re-adding an existing tunnel is a no-op,
 * so this just runs on a timer.
 */
function keepReverseAlive(port) {
  const timer = setInterval(() => void adbReverse(port, true), 30_000);
  timer.unref();
  return timer;
}

function reportPath(options, report) {
  if (options.out) return resolve(options.out);
  const device = String(report.device?.model ?? 'unknown').replace(/[^\w.-]+/g, '-');
  return join(APP_ROOT, 'results', `${options.label}-${report.platform}-${device}.json`);
}

/** Path of the incremental file, alongside wherever the final report will land. */
const partialPath = (options) =>
  options.out
    ? `${resolve(options.out)}.partial`
    : join(APP_ROOT, 'results', `${options.label}.partial.json`);

function writeJson(destination, value) {
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, `${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const port = Number(options.port);

  // Android reaches the host through the adb reverse tunnel on localhost. An iOS
  // device needs a routable address; the Simulator shares the host's loopback.
  const host =
    options.host || (options.platform === 'android' ? 'localhost' : (lanAddress() ?? 'localhost'));
  const sink = `http://${host}:${port}`;

  let settle;
  const finished = new Promise((resolveFinished) => {
    settle = resolveFinished;
  });

  // Cases are written to disk as they arrive, not just at the end. A suite over
  // the larger models runs for the better part of an hour, and a crash or an
  // out-of-memory kill on the last case used to throw away every case before it.
  const collected = [];
  const partial = partialPath(options);
  const onCase = (result) => {
    collected.push(result);
    writeJson(partial, { partial: true, label: options.label, cases: collected });
  };

  const server = await startCollector(port, onCase, settle);
  console.log(`[bench] collector listening on ${sink}`);

  // Back-to-back suites are not comparable: a second run started fifteen seconds
  // after the first finished came out 9% to 51% slower on every raw-execute
  // metric (median 22%), purely from the device having no chance to cool.
  // Pin the clock BEFORE the cooldown so the device settles at the frequency it
  // will actually run at, rather than cooling at 3.4 GHz and being capped after.
  let clocksPinned = false;
  if (options.platform === 'android' && options.pinClocks !== 'off') {
    const before = await readMaxFrequencies();
    await setClockPin(true);
    await new Promise((settled) => setTimeout(settled, 1500));
    const after = await readMaxFrequencies();
    const capped =
      before.length > 0 && after.length === before.length && after.some((f, i) => f < before[i]);
    if (capped) {
      clocksPinned = true;
      const mhz = [...new Set(after)].map((f) => Math.round(f / 1000)).join('/');
      console.log(`[bench] CPU clocks pinned to ${mhz} MHz for this run`);
    } else {
      await setClockPin(false);
      const message =
        'this device does not implement fixed-performance mode; clocks are not pinned';
      if (options.pinClocks === 'on') throw new Error(message);
      console.log(`[bench] ${message}`);
    }
  }

  // Always hand the phone back at its normal clocks, including on Ctrl-C or a
  // crash. Leaving a device capped at 2 GHz would silently poison every later
  // measurement taken on it, benchmark or not.
  const unpin = () => {
    if (!clocksPinned) return;
    clocksPinned = false;
    spawnSync('adb', ['shell', 'cmd', 'power', 'set-fixed-performance-mode-enabled', 'false'], {
      stdio: 'ignore',
    });
  };
  process.on('exit', unpin);
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(signal, () => {
      unpin();
      process.exit(130);
    });
  }

  const cooldown = Number(options.cooldown);
  if (cooldown > 0) {
    console.log(`[bench] cooling down for ${cooldown}s before starting`);
    await new Promise((wake) => setTimeout(wake, cooldown * 1000));
  }
  console.log(`[bench] partial results: ${partial}`);

  if (options.platform === 'android') {
    await adbReverse(port);
    keepReverseAlive(port);
  }

  const env = {
    ...process.env,
    EXPO_PUBLIC_BENCH_SUITE: options.suite,
    EXPO_PUBLIC_BENCH_ONLY: options.only,
    EXPO_PUBLIC_BENCH_LABEL: options.label,
    EXPO_PUBLIC_BENCH_ITERATIONS: options.iterations,
    EXPO_PUBLIC_BENCH_WARMUP: options.warmup,
    EXPO_PUBLIC_BENCH_MEMORY_ITERATIONS: options.memoryIterations,
    EXPO_PUBLIC_BENCH_MEMORY: options.memory ? '1' : '0',
    EXPO_PUBLIC_BENCH_NATIVE: options.native ? '1' : '0',
    EXPO_PUBLIC_BENCH_SINK: sink,
    EXPO_PUBLIC_BENCH_AUTOSTART: '1',
  };

  let child = null;
  if (options.launch) {
    console.log(`[bench] launching the app on ${options.platform}`);
    child = run('yarn', [options.platform], env);

    // A failed build must not leave the collector waiting forever: it holds the
    // port, so the next attempt cannot even start its own. `expo run:*` stays
    // alive serving Metro after a successful launch, so only a non-zero exit is
    // treated as fatal.
    child.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`\n[bench] the app exited with code ${code} before reporting a run`);
        server.close();
        process.exit(2);
      }
    });
  } else {
    console.log('[bench] waiting for a run. Start the app with:');
    for (const [key, value] of Object.entries(env)) {
      if (key.startsWith('EXPO_PUBLIC_BENCH_')) console.log(`         ${key}=${value}`);
    }
  }

  const report = await finished;
  report.clocksPinned = clocksPinned;
  const destination = reportPath(options, report);
  writeJson(destination, report);
  rmSync(partial, { force: true });

  const failures = report.cases.filter((entry) => entry.status !== 'ok');
  console.log(`\n[bench] wrote ${destination}`);
  console.log(`[bench] ${report.cases.length - failures.length} ok, ${failures.length} failed`);

  child?.kill('SIGTERM');
  server.close();
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(`[bench] ${error.message}`);
  process.exit(2);
});
