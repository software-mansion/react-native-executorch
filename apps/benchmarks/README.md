# Performance benchmarks

An on-device harness that measures model load time, inference latency and peak
memory for the task pipelines, and a comparator that diffs two runs and fails on
regressions.

Its first job is bracketing an ExecuTorch bump: run the suite on 1.3.1, bump,
run it again on the same device, and compare.

## Why on-device

The numbers that matter come from the backends an ExecuTorch bump actually
changes — CoreML on the Apple Neural Engine, XNNPACK on an ARM core, Vulkan on
an Android GPU. A host-side benchmark on a CI runner exercises none of them: it
links a separately built desktop ExecuTorch against x86 XNNPACK, on a shared
runner whose noise floor is wider than most regressions. So the harness runs on
a real device and is triggered by hand, rather than running on every pull
request and being ignored.

## Running a suite

```bash
# Android, quick tier, results tagged "et-1.3.1"
yarn bench --platform android --label et-1.3.1

# iOS, everything
yarn bench --platform ios --suite full --label et-1.3.1

# A single case, more iterations
yarn bench --platform android --only classification/efficientnet-v2-s-xnnpack-int8 --iterations 50
```

`yarn bench` starts a collector on port 8099, sets the app's `EXPO_PUBLIC_BENCH_*`
variables, builds and launches the app, and writes
`results/<label>-<platform>-<device>.json` when the run ends. On Android it sets
up `adb reverse` for you; on an iOS device it binds the collector to the host's
LAN address (override with `--host`).

To drive the app yourself, pass `--no-launch` and the script prints the
environment to start it with.

Options: `--suite quick|full`, `--only <ids>`, `--iterations N`, `--warmup N`,
`--no-memory`, `--no-native`, `--port N`, `--out <path>`, `--cooldown N|auto`,
`--cooldown-max N`, `--pin-clocks auto|on|off`.

## Comparing two runs

```bash
yarn bench:compare results/et-1.3.1-ios-iPhone17,1.json results/et-1.4.1-ios-iPhone17,1.json
```

Prints a per-metric table and exits 1 if anything regressed past tolerance
(inference 10%, load 15%, memory 10% — override with `--inference N`, `--load N`,
`--memory N`).

Three guards keep the output honest:

- **Device mismatch is fatal.** Comparing an iPhone run against a Pixel run is
  meaningless; pass `--allow-device-mismatch` if you know what you are doing.
- **A metric whose workload changed is reported as `INCOMPARABLE`, not as a
  delta.** If a pipeline decoded 14 tokens in one run and 19 in the other, it did
  different work, and the ratio of the two timings measures nothing.
- **A metric whose own spread is wider than the tolerance is reported as
  `NOISY`.** It cannot resolve a regression of the size being asked about, and
  calling it "same" would overstate what the run knows.

A delta inside the run's own interquartile range is reported but not failed —
the two runs cannot distinguish it from scheduling jitter.

`NOISY` is not hypothetical. On a Galaxy S26 Ultra the YOLO26 pipeline metric
has an interquartile range around 38% of its own median, from garbage collection
during post-processing, and it moved 57% between two runs of identical code. Its
`execute.forward` number over the same runs sits inside 1%. When a case comes
back `NOISY`, read its `execute.*` rows: those measure ExecuTorch, which is what
a bump changes, and they are far steadier than any metric with TypeScript
post-processing in it.

Copy a run you want to keep into `baselines/`; `results/` is gitignored.

## What gets measured

Per case:

| Metric             | What it covers                                                                         |
| ------------------ | -------------------------------------------------------------------------------------- |
| `load.native`      | `loadModel` on the `.pte` alone                                                        |
| `load.task`        | The pipeline's `create` — load, schema validation, tensor pre-allocation               |
| `execute.<method>` | Raw `model.execute`, per exported method, no pipeline around it                        |
| `pipeline.median`  | The task's synchronous entry point end to end: preprocessing, execute, post-processing |
| `memory.loaded`    | Process footprint once the pipeline is ready                                           |
| `memory.peak`      | Peak footprint during inference                                                        |
| `memory.disposed`  | Footprint after `dispose` — a leak shows up as a case that never returns to baseline   |

The raw-execute pass is the one to watch for an ExecuTorch bump. A pipeline
timing folds `model.execute` together with preprocessing and post-processing,
which are TypeScript and did not change; `execute.<method>` is ExecuTorch and
nothing else. Its input and output tensors are derived from `model.schema`, so
it works for any `.pte` in the registry, including every method a multi-method
program exports. Methods whose schema cannot be pinned to concrete shapes are
reported as skipped, with the reason.

**`execute.<method>` and `pipeline.median` are not comparable to each other.**
Where a model declares a dynamic dimension, the raw pass takes it at the top of
its declared domain, so it measures the worst case the model can be asked for.
The pipeline feeds whatever the input actually needs. On all-MiniLM-L6-v2 that
is the difference between a 254-token forward and a 20-token one, and the raw
number comes out several times the pipeline's. Each is comparable against itself
across runs, which is all the comparator asks of them. The resolved shapes are
recorded per method in the report, so it is always visible what was run.

Memory is sampled in a separate pass from the timings. Reading total PSS on
Android walks `/proc/self/smaps` and costs milliseconds; polling that during a
15 ms inference would land in the numbers.

## Determinism

Every input is synthetic and is a pure function of its parameters, so two runs
feed byte-identical data to the models. That matters because post-processing
cost is input-dependent — an NMS pass over 200 candidate boxes is not the work
of one over 3 — and a harness that picked a photo from the gallery would move
for reasons unrelated to the change under test. See `src/inputs.ts`.

The exception is speech-to-text. The synthetic waveform is voice-shaped but is
not speech, so Whisper's decoder emits far fewer tokens than a real clip would
and the pipeline figure is dominated by the encoder. Compare its
`execute.<method>` numbers rather than its pipeline number.

## Cooling between runs

`--cooldown auto` waits for the device to actually be cool rather than sleeping
a fixed guess, which is both too long when the phone is already cold and too
short when it is not. It polls `dumpsys` until the framework reports no
throttling and the battery temperature has stopped falling. A plateau is used
rather than an absolute threshold because what counts as cool differs per
device, while "no longer dropping" does not.

The wait has a 30s floor, so the heat of building and installing dissipates
before the first case, and a `--cooldown-max` ceiling (900s by default) so a
warm room or a charging phone cannot stall a run indefinitely. Charging keeps a
device warm and is called out when detected. `--cooldown N` still sleeps a fixed
N seconds.

Android only: iOS exposes no thermal readout over the wire, so there is nothing
for the host to poll and `auto` falls back to a fixed sleep.

## Holding the clock still

The largest source of noise on a phone is not the code, it is the clock. A
device boosts early in a run and sags as it heats, which is how two runs of
_identical_ code came out 9% to 51% apart.

On Android the driver pins the CPU to a fixed clock for the duration of a run
via `PowerManager`'s fixed-performance mode. Vendors implement it as a hard
frequency cap: on a Galaxy S26 Ultra it takes every cluster from 3.19/3.40 GHz
to about 1.98 GHz. Absolute numbers come out lower than a boosted run, which is
the point — the same clock in every run is worth more than a fast one.

`--pin-clocks` defaults to `auto`: pin if the device supports it, carry on
without it if not. `on` fails the run rather than measuring unpinned, `off`
disables it. The driver reads the frequency back after enabling rather than
trusting the call, because not every vendor implements the HAL, and it restores
normal clocks on exit, Ctrl-C and crash alike. A pinned run and an unpinned one
are not comparable, and `bench:compare` refuses to diff across them.

There is no iOS equivalent. Nothing in the public API pins or caps the clock,
so runs there depend on the thermal gate and on cooling the device between
suites.

## Tiers

`quick` (the default) is the small models — classification, selfie segmentation,
style transfer, BlazeFace, MiniLM embeddings, FSMN VAD. Roughly 150 MB of
downloads, a couple of minutes on device. `full` adds SSDLite, YOLO26, CLIP, the
privacy filter, Whisper tiny and Supertonic TTS.

## Adding a case

Add an entry to `CASES` in `src/suite.ts`. The runner derives everything else —
what to download, which methods to benchmark, what to sample — from the config
and the model's schema. A case needs an id, its registry config, the pipeline's
`create`, and a `run` worklet that returns the iteration's workload size.

Pipelines with no synchronous entry point (Supertonic streams through four
sub-models with JS-thread orchestration between chunks) set `mode: 'async'` and
provide `runAsync`. Those timings include a thread hop per call, so they are
comparable across runs but not against worklet-timed cases.

## The native probe

`modules/bench-probe` is a local Expo module reading the process footprint:
`task_vm_info.phys_footprint` on iOS (what jetsam measures an app against) and
total PSS on Android. Both count the resident pages of a memory-mapped `.pte`,
which the native-heap counters miss entirely — and that is most of a model's
footprint.
