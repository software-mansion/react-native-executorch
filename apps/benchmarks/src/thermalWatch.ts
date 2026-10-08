/**
 * Watching the device's thermal state across a measurement.
 *
 * The gate establishes the temperature a measurement *starts* at, which is not
 * the same as the temperature it *ran* at. A case that enters at 36.6 C and
 * spends the next few minutes decoding can be throttling long before it
 * finishes, and reading the thermal state once at the end hides it: the device
 * has often recovered by then.
 *
 * That is not a hypothetical. `smollm2-1.7b` entered its window under the
 * ceiling, reached `severe` at 41.5 C during the pass, and produced iterations
 * spanning 2.6 s to 7.3 s. The number that came out described a throttling
 * phone rather than the model, and nothing in the row said so.
 *
 * So the state is sampled throughout, and the worst sample is what the result
 * carries.
 */

import BenchProbe from '../modules/bench-probe';

/** The hottest the device got while a measurement ran. */
export interface ThermalPeak {
  /** Highest Android `PowerManager` thermal status seen, or null if unknown. */
  readonly status: number | null;
  /** Name of that status. */
  readonly statusName: string;
  /** Highest battery temperature seen, in Celsius, or null if unknown. */
  readonly batteryTemperatureC: number | null;
  /** How many samples the window collected. */
  readonly samples: number;
}

/** A watch in progress. */
export interface ThermalWatch {
  /** Stops sampling and returns the worst state seen. */
  stop(): ThermalPeak;
}

/**
 * Samples the thermal state until stopped.
 *
 * Sampling is cheap next to a measurement pass, but not free, so the interval
 * is the same one the memory sampler uses rather than something tighter.
 * @param intervalMs How often to sample.
 * @returns The running watch.
 */
export function watchThermal(intervalMs: number): ThermalWatch {
  let status: number | null = null;
  let statusName = 'unknown';
  let temperature: number | null = null;
  let samples = 0;

  const sample = () => {
    const state = BenchProbe.thermalState();
    samples++;
    // Both fields use -1 for "unknown"; iOS never reports a temperature.
    if (state.status >= 0 && (status === null || state.status > status)) {
      status = state.status;
      statusName = state.statusName;
    }
    if (
      state.batteryTemperatureC >= 0 &&
      (temperature === null || state.batteryTemperatureC > temperature)
    ) {
      temperature = state.batteryTemperatureC;
    }
  };

  sample();
  const timer = setInterval(sample, intervalMs);

  return {
    stop() {
      clearInterval(timer);
      sample();
      return { status, statusName, batteryTemperatureC: temperature, samples };
    },
  };
}
