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
 *   yarn bench --platform android --suite full --max-temp-c 35
 *   yarn bench --platform android --suite full --repeats 3   # with an error bar
 *   yarn bench --platform android --resume         # continue an interrupted run
 *   yarn bench --platform ios --no-launch          # app started by hand
 */

import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { networkInterfaces, tmpdir } from 'node:os';
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
  repeats: '1',
  maxTempC: '37',
  gateTimeoutS: '1800',
  maxBytes: '6000000000',
  port: '8099',
  host: '',
  out: '',
  cooldown: 'auto',
  cooldownMax: '900',
  pinClocks: 'off',
  buildType: 'release',
};

function parseArgs(argv) {
  const options = {
    ...DEFAULTS,
    launch: true,
    memory: true,
    native: true,
    resume: false,
    keepModels: false,
    unplug: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--no-launch') options.launch = false;
    else if (arg === '--no-memory') options.memory = false;
    else if (arg === '--no-native') options.native = false;
    else if (arg === '--resume') options.resume = true;
    else if (arg === '--keep-models') options.keepModels = true;
    else if (arg === '--unplug') options.unplug = true;
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


/**
 * Stops the device charging for the duration of the run, and reads the level.
 *
 * **Off by default, and worth understanding before turning on.** The cable adb
 * needs also charges the phone, and charging holds it about 1.5C warmer: an S26
 * Ultra sat at 34.9-35.1C plugged in and 33.5C unplugged. Under the old 35C gate
 * that gap decided whether any measurement ever started, so the harness stopped
 * charging on its own.
 *
 * That cure was worse. `dumpsys battery unplug` convinces the framework the
 * device is on battery, and Samsung answers by engaging Battery Saver — sticky
 * until the cell reaches 90%. The CPU's maximum frequencies stay put, so it does
 * not look like throttling, but EfficientNet int8 went from 66 ms to 116 ms with
 * nothing else changed. Benchmarking a phone in a power-saving mode no user
 * asked for measures the power-saving mode.
 *
 * With the gate at 37C the whole trade disappears: charging costs 1.5C and the
 * ceiling has room for it, so the run stays plugged in and the battery survives
 * a long suite. `--unplug` remains for a device whose idle floor genuinely needs
 * it, and it now clears Battery Saver rather than leaving it set.
 * @returns The battery percentage after unplugging, or null if adb cannot say.
 */
async function stopCharging() {
  await adbCapture('dumpsys battery unplug');
  // Undo the vendor's reaction to believing it is on battery. Without this the
  // run measures Battery Saver rather than the device.
  await adbCapture('settings put global low_power 0');
  const out = await adbCapture('dumpsys battery | grep level');
  const level = /level:\s*(\d+)/.exec(out);
  return level ? Number(level[1]) : null;
}

/**
 * Fails the run if the device is in a power-saving mode.
 *
 * A phone in Battery Saver is not the phone the numbers are meant to describe,
 * and it does not announce itself: frequencies read normal and nothing throttles,
 * the work is simply slower. Checked rather than assumed, because the harness
 * itself turned it on once by unplugging.
 * @returns A description of the problem, or null when the device is in a normal
 * state.
 */
async function powerSaveProblem() {
  const lowPower = (await adbCapture('settings get global low_power')).trim();
  if (lowPower === '1') {
    return 'Battery Saver is on; it slows the device without capping frequencies';
  }
  return null;
}

function run(command, args, env) {
  return spawn(command, args, { cwd: APP_ROOT, env, stdio: 'inherit', shell: false });
}

/**
 * Clears everything that can carry a previous run's settings into this one.
 *
 * Every `EXPO_PUBLIC_BENCH_*` value is inlined into the bundle when Metro
 * transforms it, so the settings live in the bundler, not in the app. Two things
 * then keep them alive across invocations:
 *
 * - A Metro already listening on the dev-server port. `expo run:*` attaches to
 *   it rather than starting its own, and that process holds the environment it
 *   was launched with — no cache clearing can reach it. This is what actually
 *   bit: a run asked for one repeat under a new label and the app announced
 *   three repeats under the old one.
 * - Metro's transform cache, whose key does not cover these variables.
 *
 * Killing a bundler the user may have started by hand is worth it here: a
 * benchmark that silently measures under settings nobody chose is worse than
 * one that takes an extra thirty seconds to boot.
 * @param port The dev-server port to free, matching what `expo run:*` will use.
 */
function resetBundler(port = 8081) {
  const held = spawnSync('lsof', ['-ti', `tcp:${port}`], { encoding: 'utf8' });
  const pids = (held.stdout ?? '')
    .split('\n')
    .map((pid) => pid.trim())
    .filter(Boolean);
  if (pids.length > 0) {
    console.log(`[bench] stopping the bundler on port ${port}; it holds the previous settings`);
    spawnSync('kill', ['-9', ...pids], { stdio: 'ignore' });
  }
  for (const dir of [join(tmpdir(), 'metro-cache'), join(APP_ROOT, 'node_modules/.cache')]) {
    rmSync(dir, { recursive: true, force: true });
  }
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
  // Every key the output file already holds, whatever the app believes.
  //
  // `--resume` works by the app asking which measurements exist and skipping
  // them, and that request travels the same adb tunnel that has been seen to
  // drop: a lost answer means the app re-measures everything and the file grows
  // a second copy of each row. The writer is the only place that can actually
  // promise otherwise, so it refuses a key it already has rather than trusting
  // the handshake.
  let onDisk = new Set(readCompleted(paths.jsonl));
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
      // The app reports what it actually booted with. A mismatch means the
      // bundle predates this invocation, and every number it goes on to produce
      // would be labelled with settings that were not the ones requested.
      const stale = [];
      if (body.label !== options.label) stale.push(`label ${body.label} != ${options.label}`);
      if (body.repeats !== Number(options.repeats)) {
        stale.push(`repeats ${body.repeats} != ${options.repeats}`);
      }
      if (stale.length > 0) {
        console.error(
          `\n[bench] FATAL: the app is running a stale bundle (${stale.join(', ')}).\n` +
            'Metro inlines EXPO_PUBLIC_BENCH_* at bundle time and served a cached build.\n' +
            'The cache is cleared automatically now; if this persists, stop Metro and rerun.'
        );
        server.close();
        process.exit(3);
      }

      paths = outputPaths(options, body.device);
      // The device is only known now, so the path may have changed under us.
      completed = options.resume ? readCompleted(paths.jsonl) : [];
      onDisk = new Set(readCompleted(paths.jsonl));
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
      const key = `${body.id}#${body.progress?.repeat ?? 1}`;
      if (body.status === 'ok' && onDisk.has(key)) {
        console.log(`[bench] ${key} is already recorded; keeping the first and dropping this one`);
        return;
      }
      // Appended before anything else touches it: a kill between the POST and
      // the write is the one gap this file exists to close.
      appendFileSync(paths.jsonl, `${JSON.stringify(body)}\n`);
      if (body.status === 'ok') onDisk.add(key);
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

  if (options.platform === 'android') {
    const problem = await powerSaveProblem();
    if (problem) {
      throw new Error(
        `${problem}.\nTurn it off before benchmarking: ` +
          'adb shell settings put global low_power 0'
      );
    }
  }

  let unplugged = false;
  if (options.platform === 'android' && options.unplug) {
    const level = await stopCharging();
    unplugged = true;
    console.log(
      `[bench] charging stopped for this run (battery ${level ?? '?'}%) — the cable holds the ` +
        'device above the gate temperature'
    );
    if (level !== null && level < 40) {
      console.warn(
        `[bench] WARNING: battery is at ${level}% and will not charge during the run; ` +
          'a long suite may not finish. Pass --no-unplug to leave charging on.'
      );
    }
  }

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
  // Always hand the phone back as it was found, including on Ctrl-C or a crash.
  // Leaving it capped at 2 GHz would poison every later measurement taken on it,
  // and leaving it refusing to charge is worse: the owner has no reason to
  // suspect a benchmark for a phone that is quietly running its battery down.
  const restoreDevice = () => {
    if (clocksPinned) {
      clocksPinned = false;
      spawnSync('adb', ['shell', 'cmd', 'power', 'set-fixed-performance-mode-enabled', 'false'], {
        stdio: 'ignore',
      });
    }
    if (unplugged) {
      unplugged = false;
      spawnSync('adb', ['shell', 'dumpsys', 'battery', 'reset'], { stdio: 'ignore' });
      spawnSync('adb', ['shell', 'settings', 'put', 'global', 'low_power', '0'], {
        stdio: 'ignore',
      });
    }
  };
  process.on('exit', restoreDevice);
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(signal, () => {
      restoreDevice();
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
    // A previous run's app survives its driver being killed, and reconnects to
    // whatever collector is listening next — reporting the tail of the old plan
    // as though it were the new one. Observed as a "from scratch" run whose
    // first measurement was case 3 repeat 3.
    if (options.platform === 'android') {
      await adbCapture('am force-stop com.anonymous.benchmarks');
    }
    // A release build is the point of a published benchmark. A debug build
    // compiles the library's own C++ without optimisation and serves JS as a
    // dev bundle with dev-mode checks, so everything outside `execute` is
    // slower than any shipped app would be: the ExecuTorch runtime is a
    // prebuilt release library and is unaffected, but the preprocessing and
    // post-processing around it are not, and those are most of the pipeline
    // for a good part of the estate. Numbers taken in debug describe a build
    // nobody ships.
    const release = options.buildType === 'release';
    if (release) {
      // Release bundles the JS into the APK at build time, so the
      // EXPO_PUBLIC_BENCH_* values above are baked in during the build and no
      // dev server is involved. Nothing to reset, and nothing to attach to.
      console.log('[bench] building in release');
    } else {
      console.warn('[bench] WARNING: debug build, unoptimised. Do not publish these numbers.');
      resetBundler();
    }
    console.log(`[bench] launching the app on ${options.platform}`);
    const variantArgs =
      options.platform === 'android'
        ? ['--variant', release ? 'release' : 'debug']
        : ['--configuration', release ? 'Release' : 'Debug'];
    child = run('yarn', ['expo', `run:${options.platform}`, ...variantArgs], env);

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
  report.buildType = options.buildType;
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
