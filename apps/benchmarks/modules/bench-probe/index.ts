import { requireNativeModule } from 'expo-modules-core';

/**
 * Host metadata identifying the machine a benchmark run was produced on.
 *
 * Results are only comparable across runs that share these values, so the
 * comparator refuses to diff two runs whose `model` or `osVersion` differ.
 */
export interface BenchDeviceInfo {
  /** Raw hardware identifier: `iPhone17,1` on iOS, `Build.MODEL` on Android. */
  readonly model: string;
  /** Marketing OS version, e.g. `18.2` or `15`. */
  readonly osVersion: string;
  /** SoC name when the platform reports one, otherwise an empty string. */
  readonly soc: string;
  /** `true` when running on a simulator or emulator rather than real hardware. */
  readonly isEmulator: boolean;
  /** Number of CPU cores visible to the process. */
  readonly cpuCores: number;
  /** Total physical RAM in bytes. */
  readonly totalMemoryBytes: number;
}

/**
 * Device thermal state at a point in the run.
 *
 * Timings taken while a device is throttling are not comparable with timings
 * taken while it is cool, so this is recorded per case and the comparator
 * refuses to diff across it.
 */
export interface BenchThermalState {
  /** Android `PowerManager` thermal status, mapped onto iOS states. -1 if unknown. */
  readonly status: number;
  /** `none` | `light` | `moderate` | `severe` | `critical` | `emergency` | `shutdown`. */
  readonly statusName: string;
  /** Battery temperature in Celsius on Android; -1 where unavailable. */
  readonly batteryTemperatureC: number;
}

interface BenchProbeNativeModule {
  /**
   * Process memory footprint in bytes.
   *
   * iOS reports `task_vm_info.phys_footprint` — the figure jetsam evaluates
   * against the per-app limit. Android reports total PSS. Both include the
   * pages a memory-mapped `.pte` actually has resident, which the native heap
   * counters miss entirely; that is why the sampler pays for the slower call.
   */
  memoryFootprintBytes(): number;
  /**
   * Native heap allocation in bytes. Cheap to read but blind to mapped model
   * pages, so it is recorded alongside the footprint rather than instead of it.
   */
  nativeHeapBytes(): number;
  thermalState(): BenchThermalState;
  deviceInfo(): BenchDeviceInfo;
}

export default requireNativeModule<BenchProbeNativeModule>('BenchProbe');
