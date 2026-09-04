/**
 * The thermal gate.
 *
 * Every measurement is taken from the same thermal starting point, because on a
 * phone that is the largest thing separating two runs of identical code. The
 * device asks the host to hold before each measurement; the host polls
 * `dumpsys battery` over adb and answers when the temperature is at or below
 * the configured ceiling.
 *
 * The wait lives on the host rather than on the device for one reason: Android
 * exposes battery temperature to `adb` but not to an ordinary app, and iOS
 * exposes only a coarse `thermalState` with no number behind it. A device-side
 * gate would therefore have to guess on both platforms, where the host can read
 * the real figure on one of them.
 *
 * When there is no host — the app started by hand, or an iOS device with no
 * readable temperature — the gate degrades to the on-device thermal state plus
 * a fixed settle, and says so in the result rather than pretending it waited.
 */

import BenchProbe from '../modules/bench-probe';
import { config } from './config';

/** What the gate did before a measurement, recorded with that measurement. */
export interface GateResult {
  /** How the wait was decided. */
  readonly kind: 'host' | 'device' | 'none';
  /** Seconds actually waited. */
  readonly waitedS: number;
  /** Battery temperature in Celsius when the gate opened, or null if unknown. */
  readonly temperatureC: number | null;
  /** Android `PowerManager` thermal status when the gate opened, or null. */
  readonly thermalStatus: number | null;
  /** True when the gate gave up on its ceiling and let a warm measurement run. */
  readonly timedOut: boolean;
}

const sleep = (ms: number): Promise<void> => new Promise((wake) => setTimeout(wake, ms));

/**
 * Fixed settle used when no temperature can be read.
 *
 * Long enough for the heat of one measurement to leave the SoC, short enough
 * that a suite of hundreds of cases still finishes. It is a fallback, not a
 * substitute: a run gated this way records `kind: 'device'` so its spread is
 * read with that in mind.
 */
const BLIND_SETTLE_MS = 90_000;

/** Polling period of the device-side thermal check. */
const DEVICE_POLL_MS = 10_000;

/**
 * Waits on the device alone, with no host to read a temperature from.
 *
 * `thermalState` is coarse — a status enum, not a figure — so this waits for it
 * to report no throttling and then settles for a fixed period regardless. The
 * fixed part is what does the real work; the status check only avoids starting
 * a measurement while the OS is actively throttling.
 * @param timeoutS Seconds to wait before measuring anyway.
 * @returns What the gate observed.
 */
async function waitOnDevice(timeoutS: number): Promise<GateResult> {
  const started = Date.now();
  const deadline = started + timeoutS * 1000;

  for (;;) {
    const state = BenchProbe.thermalState();
    const throttling = state.status > 0;
    if (!throttling) break;
    if (Date.now() >= deadline) {
      return {
        kind: 'device',
        waitedS: Math.round((Date.now() - started) / 1000),
        temperatureC: state.batteryTemperatureC >= 0 ? state.batteryTemperatureC : null,
        thermalStatus: state.status,
        timedOut: true,
      };
    }
    await sleep(DEVICE_POLL_MS);
  }

  await sleep(BLIND_SETTLE_MS);
  const state = BenchProbe.thermalState();
  return {
    kind: 'device',
    waitedS: Math.round((Date.now() - started) / 1000),
    temperatureC: state.batteryTemperatureC >= 0 ? state.batteryTemperatureC : null,
    thermalStatus: state.status,
    timedOut: false,
  };
}

/**
 * Holds until the device is cool enough for the next measurement.
 *
 * With a collector reachable, this is a single long-poll: the host does the
 * waiting and answers with what it saw, so the device is not burning cycles
 * (and heat) polling while it waits to be cold.
 * @param caseId The case about to be measured, for the host's progress line.
 * @param repeat Which repeat of that case, 1-based.
 * @param repeats How many repeats the case gets in total.
 * @returns What the gate did, to be recorded with the measurement.
 */
export async function waitUntilCool(
  caseId: string,
  repeat: number,
  repeats: number
): Promise<GateResult> {
  if (!config.sink) return waitOnDevice(config.gateTimeoutS);

  const started = Date.now();
  try {
    const response = await fetch(`${config.sink}/gate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId,
        repeat,
        repeats,
        maxTempC: config.maxTempC,
        timeoutS: config.gateTimeoutS,
      }),
    });
    const body = (await response.json()) as Partial<GateResult> & { readonly kind?: string };

    // The host answers `none` when it cannot read a temperature at all, which is
    // every iOS device and any Android one adb cannot reach. Falling back to the
    // device-side wait is better than measuring immediately, and it is recorded
    // as a device gate so nobody reads it as a 35C guarantee.
    if (body.kind === 'none') return waitOnDevice(config.gateTimeoutS);

    return {
      kind: 'host',
      waitedS: body.waitedS ?? Math.round((Date.now() - started) / 1000),
      temperatureC: body.temperatureC ?? null,
      thermalStatus: body.thermalStatus ?? null,
      timedOut: body.timedOut ?? false,
    };
  } catch {
    // A dropped adb tunnel must not strand the run: fall back rather than fail.
    return waitOnDevice(config.gateTimeoutS);
  }
}
