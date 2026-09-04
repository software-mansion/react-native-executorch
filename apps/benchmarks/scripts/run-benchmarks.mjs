#!/usr/bin/env node
/**
 * Drives a benchmark run and collects its results.
 *
 * Starts an HTTP collector, points the app at it through `EXPO_PUBLIC_BENCH_*`,
 * builds and launches the app, and writes every measurement to disk as it
 * arrives.
 *
 * The collector exists because getting structured data off a phone is otherwise
 * platform-specific: `adb logcat` covers Android, `xcrun simctl` covers the iOS
 * Simulator, and a physical iPhone has no equivalent short of Console.app. An
 * HTTP POST works the same everywhere — over `adb reverse` on Android, and over
 * the LAN on an iOS device.
 *
 * It also owns the thermal gate. The device asks to be held before each
 * measurement; the host answers when `dumpsys battery` reports the ceiling has
 * been reached. That lives here because Android exposes battery temperature to
 * `adb` and not to an ordinary app.
 *
 * Usage:
 *   yarn bench --platform android --label et-1.4.1
 *   yarn bench --platform android --suite full --repeats 3 --max-temp-c 35
 *   yarn bench --platform android --resume         # continue an interrupted run
 *   yarn bench --platform ios --no-launch          # app started by hand
 */

import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULTS = {
  platform: 'android',
  suite: 'quick',
  only: '',
  tasks: '',
  backends: '',
  label: 'local',
  iterations: '20',
  warmup: '3',
  memoryIterations: '5',
  repeats: '3',
  maxTempC: '35',
  gateTimeoutS: '1800',
  maxBytes: '6000000000',
  port: '8099',
  host: '',
  out: '',
  cooldown: 'auto',
  cooldownMax: '900',
  pinClocks: 'off',
};

function parseArgs(argv) {
  const options = {
    ...DEFAULTS,
    launch: true,
    memory: true,
    native: true,
    resume: false,
    keepModels: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--no-launch') options.launch = false;
    else if (arg === '--no-memory') options.memory = false;
    else if (arg === '--no-native') options.native = false;
    else if (arg === '--resume') options.resume = true;
    else if (arg === '--keep-models') options.keepModels = true;
    else if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      if (!(key in DEFAULTS)) throw new Error(`Unknown option ${arg}`);
      options[key] = argv[++i];
    } else throw new Error(`Unexpected argument ${arg}`);
  }

  if (options.cooldown !== 'auto' && !Number.isFinite(Number(options.cooldown))) {
    throw new Error(`--cooldown must be a number of seconds or "auto", got ${options.cooldown}`);
  }
  if (!['auto', 'on', 'off'].includes(options.pinClocks)) {
    throw new Error(`--pin-clocks must be auto, on or off, got ${options.pinClocks}`);
  }
  if (options.platform !== 'ios' && options.platform !== 'android') {
    throw new Error(`--platform must be ios or android, got ${options.platform}`);
  }
  if (!['quick', 'full', 'everything'].includes(options.suite)) {
    throw new Error(`--suite must be quick, full or everything, got ${options.suite}`);
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
      const raw = Buffer.concat(chunks).toString('utf8');
      if (raw === '') {
        resolveBody(null);
        return;
      }
      try {
        resolveBody(JSON.parse(raw));
      } catch (error) {
        rejectBody(error);
      }
    });
    request.on('error', rejectBody);
  });
}

const sleep = (ms) => new Promise((wake) => setTimeout(wake, ms));

/** Reads one line of `adb shell`, trimmed. Empty string if adb cannot answer. */
function adbCapture(command) {
  return new Promise((done) => {
    const child = spawn('adb', ['shell', command], { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    child.stdout.on('data', (chunk) => (out += chunk));
    child.on('exit', () => done(out.trim()));
    child.on('error', () => done(''));
  });
}

/** Thermal status (0 = none) and battery temperature in Celsius; nulls if unknown. */
async function readDeviceHeat() {
  const [thermal, battery] = await Promise.all([
    adbCapture('dumpsys thermalservice | grep "Thermal Status"'),
    adbCapture('dumpsys battery'),
  ]);
  const status = /Thermal Status:\s*(-?\d+)/.exec(thermal);
  const temp = /temperature:\s*(-?\d+)/.exec(battery);
  const charging = /(AC|USB|Wireless|Dock) powered: true/.test(battery);
  return {
    status: status ? Number(status[1]) : null,
    temperatureC: temp ? Number(temp[1]) / 10 : null,
    charging,
  };
}

/**
 * Holds until the device is at or below `maxTempC`, or the timeout expires.
 *
 * An absolute ceiling rather than the plateau rule an earlier version used.
 * A plateau answers "has it stopped cooling", which is the right question when
 * comparing two runs on one device but the wrong one when comparing four
 * devices: a phone that plateaus at 41C and one that plateaus at 30C both pass
 * a plateau test and are not measuring the same thing. A fixed number is the
 * only gate that means the same thing on every device.
 *
 * The ceiling is not always reachable — a warm room, a charging phone, a device
 * whose idle temperature sits above it — so the wait is bounded and a timeout is
 * recorded on the measurement rather than failing the run.
 * @param maxTempC Ceiling in Celsius.
 * @param timeoutS Seconds to wait before letting a warm measurement proceed.
 * @param onWait Called with each poll, for the progress line.
 * @returns What the gate observed, in the shape `src/gate.ts` expects.
 */
async function holdUntilCool(maxTempC, timeoutS, onWait) {
  const POLL_MS = 15_000;
  const started = Date.now();
  const deadline = started + timeoutS * 1000;

  const first = await readDeviceHeat();
  if (first.temperatureC === null) {
    // Nothing to poll. The device falls back to its own coarse thermal state.
    return { kind: 'none', waitedS: 0, temperatureC: null, thermalStatus: first.status, timedOut: false };
  }

  for (;;) {
    const heat = await readDeviceHeat();
    const elapsedS = Math.round((Date.now() - started) / 1000);
    const coolEnough = heat.temperatureC !== null && heat.temperatureC <= maxTempC;
    const notThrottling = heat.status === 0 || heat.status === null;

    if (coolEnough && notThrottling) {
      return {
        kind: 'host',
        waitedS: elapsedS,
        temperatureC: heat.temperatureC,
        thermalStatus: heat.status,
        timedOut: false,
      };
    }
    if (Date.now() >= deadline) {
      return {
        kind: 'host',
        waitedS: elapsedS,
        temperatureC: heat.temperatureC,
        thermalStatus: heat.status,
        timedOut: true,
      };
    }

    onWait?.(heat, elapsedS);
    await sleep(POLL_MS);
  }
}

function run(command, args, env) {
  return spawn(command, args, { cwd: APP_ROOT, env, stdio: 'inherit', shell: false });
}

/**
 * Pins the CPU to a fixed, sustainable clock for the duration of a run.
 *
 * **Off by default, and it should stay off for a benchmark.** Android exposes
 * `PowerManager`'s FIXED_PERFORMANCE mode over `cmd power`, which vendors
 * implement as a frequency cap rather than a hint: on a Galaxy S26 Ultra it
 * takes every cluster from 3.19/3.40 GHz down to about 1.98 GHz. That is the
 * right trade when the question is "did this build regress", because the same
 * clock in both runs is worth more than a fast one. It is the wrong trade when
 * the question is "how fast is this model on this phone", because the answer
 * then describes a frequency the device would never choose on its own, and
 * understates every number by roughly the ratio of the clocks.
 *
 * So: `--pin-clocks on` for an A/B against another build, and the default for
 * publishing device numbers. With it off, the thermal gate is the only control
 * over run-to-run drift, which is why the gate is per-repeat rather than
 * per-run.
 *
 * Not every device implements the HAL, so the frequency is read back rather
 * than trusting the call. There is no iOS equivalent: nothing in the public API
 * pins or caps the clock.
 */
function setClockPin(enabled) {
  return new Promise((done) => {
    const child = spawn(
      'adb',
      ['shell', 'cmd', 'power', 'set-fixed-performance-mode-enabled', String(enabled)],
      { stdio: 'ignore' }
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

/** Slugified device name, or a placeholder until the app has announced one. */
const deviceSlug = (device) => String(device?.model ?? 'unknown').replace(/[^\w.-]+/g, '-');

function outputPaths(options, device) {
  if (options.out) {
    const base = resolve(options.out).replace(/\.jsonl?$/, '');
    return { jsonl: `${base}.jsonl`, json: `${base}.json` };
  }
  const stem = `${options.label}-${options.platform}-${deviceSlug(device)}`;
  return {
    jsonl: join(APP_ROOT, 'results', `${stem}.jsonl`),
    json: join(APP_ROOT, 'results', `${stem}.json`),
  };
}

/**
 * Reads the measurement keys an existing JSONL already holds.
 * @param path The JSONL file.
 * @returns Keys of the form `<caseId>#<repeat>`.
 */
function readCompleted(path) {
  if (!existsSync(path)) return [];
  const done = [];
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      // Only an `ok` measurement counts as done: re-running a case that errored
      // is usually the point of resuming.
      if (entry.status === 'ok' && entry.id && entry.progress?.repeat) {
        done.push(`${entry.id}#${entry.progress.repeat}`);
      }
    } catch {
      // A half-written final line after a kill. Everything before it stands.
    }
  }
  return done;
}

const pad = (value, width) => String(value).padStart(width);

/** One progress line per measurement: where the run is, and what it measured. */
function progressLine(result) {
  const { caseIndex, caseCount, repeat, repeats } = result.progress ?? {};
  const position =
    caseCount === undefined
      ? ''
      : `(${pad(caseIndex, String(caseCount).length)}/${caseCount} models · run ${repeat}/${repeats}) `;

  if (result.status === 'error') return `${position}${result.id} — FAILED: ${result.error}`;
  if (result.status === 'skipped') return `${position}${result.id} — skipped: ${result.error}`;

  const parts = [];
  if (result.pipeline?.median !== undefined) parts.push(`${result.pipeline.median} ms`);
  if (result.memory?.peakMb !== undefined) parts.push(`peak ${result.memory.peakMb} MB`);
  if (result.taskLoadMs) parts.push(`load ${Math.round(result.taskLoadMs)} ms`);
  if (result.gate?.temperatureC != null) parts.push(`${result.gate.temperatureC}C`);
  return `${position}${result.id} — ${parts.join(', ')}`;
}

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

  // Output paths are only final once the app has announced its device, so a
  // provisional pair is used until `/begin` arrives. With --resume the caller
  // has usually passed --out, or the device is the one already in results/.
  let paths = outputPaths(options, null);
  let completed = options.resume ? readCompleted(paths.jsonl) : [];
  let measurements = 0;
  let plannedMeasurements = null;

  const server = createServer(async (request, response) => {
    let body = null;
    try {
      body = await readBody(request);
    } catch {
      response.writeHead(400).end();
      return;
    }

    if (request.url === '/completed') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ done: completed }));
      return;
    }

    if (request.url === '/gate') {
      // Long-poll: the device stays parked here while the host watches the
      // temperature, so it is not generating heat polling for its own cooldown.
      if (options.platform !== 'android') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ kind: 'none' }));
        return;
      }
      const label = `${body?.caseId ?? '?'} run ${body?.repeat ?? '?'}/${body?.repeats ?? '?'}`;
      const gate = await holdUntilCool(
        Number(body?.maxTempC ?? options.maxTempC),
        Number(body?.timeoutS ?? options.gateTimeoutS),
        (heat, elapsedS) => {
          const charging = heat.charging ? ', charging' : '';
          console.log(
            `[bench] cooling for ${label}: ${heat.temperatureC ?? '?'}C > ` +
              `${body?.maxTempC ?? options.maxTempC}C, ${elapsedS}s elapsed${charging}`
          );
        }
      );
      if (gate.timedOut) {
        console.warn(
          `[bench] WARNING: ${label} starting at ${gate.temperatureC}C after ` +
            `${gate.waitedS}s; it never reached ${body?.maxTempC ?? options.maxTempC}C`
        );
      }
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(gate));
      return;
    }

    response.writeHead(204).end();

    if (request.url === '/begin') {
      paths = outputPaths(options, body.device);
      if (options.resume) completed = readCompleted(paths.jsonl);
      mkdirSync(dirname(paths.jsonl), { recursive: true });
      plannedMeasurements = body.cases.length * body.repeats;
      console.log(
        `\n[bench] run "${body.label}" on ${deviceSlug(body.device)} — ` +
          `${body.cases.length} models x ${body.repeats} runs = ${plannedMeasurements} measurements`
      );
      if (body.skipped?.length) {
        console.log(`[bench] ${body.skipped.length} variants skipped:`);
        for (const entry of body.skipped) console.log(`         ${entry.id} — ${entry.reason}`);
      }
      if (completed.length > 0) {
        console.log(`[bench] resuming: ${completed.length} measurements already on disk`);
      }
      console.log(`[bench] appending to ${paths.jsonl}\n`);
    } else if (request.url === '/case') {
      // Appended before anything else touches it: a kill between the POST and
      // the write is the one gap this file exists to close.
      appendFileSync(paths.jsonl, `${JSON.stringify(body)}\n`);
      measurements += 1;
      const total = plannedMeasurements ? `/${plannedMeasurements}` : '';
      console.log(`[bench] [${measurements}${total}] ${progressLine(body)}`);
    } else if (request.url === '/end') {
      settle(body);
    }
  });

  await new Promise((ready, fail) => {
    server.on('error', (error) => {
      fail(
        error.code === 'EADDRINUSE'
          ? new Error(
              `port ${port} is in use — another run is still open. Pass --port to change it.`
            )
          : error
      );
    });
    // 0.0.0.0 so an iOS device on the LAN can reach the collector, not just
    // adb-reversed localhost traffic from Android.
    server.listen(port, '0.0.0.0', ready);
  });
  console.log(`[bench] collector listening on ${sink}`);

  // Pin the clock BEFORE the cooldown so the device settles at the frequency it
  // will actually run at, rather than cooling at 3.4 GHz and being capped after.
  let clocksPinned = false;
  if (options.platform === 'android' && options.pinClocks !== 'off') {
    const before = await readMaxFrequencies();
    await setClockPin(true);
    await sleep(1500);
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

  if (options.platform === 'android') {
    await adbReverse(port);
    keepReverseAlive(port);
  }

  const env = {
    ...process.env,
    EXPO_PUBLIC_BENCH_SUITE: options.suite,
    EXPO_PUBLIC_BENCH_ONLY: options.only,
    EXPO_PUBLIC_BENCH_TASKS: options.tasks,
    EXPO_PUBLIC_BENCH_BACKENDS: options.backends,
    EXPO_PUBLIC_BENCH_LABEL: options.label,
    EXPO_PUBLIC_BENCH_ITERATIONS: options.iterations,
    EXPO_PUBLIC_BENCH_WARMUP: options.warmup,
    EXPO_PUBLIC_BENCH_MEMORY_ITERATIONS: options.memoryIterations,
    EXPO_PUBLIC_BENCH_REPEATS: options.repeats,
    EXPO_PUBLIC_BENCH_MAX_TEMP_C: options.maxTempC,
    EXPO_PUBLIC_BENCH_GATE_TIMEOUT_S: options.gateTimeoutS,
    EXPO_PUBLIC_BENCH_MAX_BYTES: options.maxBytes,
    EXPO_PUBLIC_BENCH_KEEP_MODELS: options.keepModels ? '1' : '0',
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
  writeJson(paths.json, report);

  const measured = report.cases.filter((entry) => entry.status !== 'skipped');
  const failures = measured.filter((entry) => entry.status !== 'ok');
  console.log(`\n[bench] wrote ${paths.json}`);
  console.log(`[bench] measurements kept in ${paths.jsonl}`);
  console.log(
    `[bench] ${measured.length - failures.length} ok, ${failures.length} failed, ` +
      `${report.skipped.length} skipped`
  );

  child?.kill('SIGTERM');
  server.close();
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(`[bench] ${error.message}`);
  process.exit(2);
});
