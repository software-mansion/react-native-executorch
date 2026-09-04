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
# Everything the platform can run except LLMs, gated at 37C
yarn bench --platform android --suite full --label v0.10.0 --max-temp-c 37

# The small models only, for bisecting
yarn bench --platform android --suite quick --label et-1.4.1

# One task, or one backend, across every model that has it
yarn bench --platform android --tasks objectDetection,instanceSegmentation
yarn bench --platform android --backends vulkan

# A single variant, more iterations
yarn bench --platform android --only classification/efficientnet-v2-s-xnnpack-int8 --iterations 50
```

`yarn bench` starts a collector on port 8099, sets the app's `EXPO_PUBLIC_BENCH_*`
variables, builds and launches the app, and **appends every measurement to
`results/<label>-<platform>-<device>.jsonl` as it lands**. On Android it sets up
`adb reverse` for you; on an iOS device it binds the collector to the host's LAN
address (override with `--host`).

The console prints one line per measurement, carrying its position:

```
[bench] [37/489] ( 13/163 models · run 1/3) object-detection/yolo26-nano-size-384-xnnpack-fp32 - 24.61 ms, peak 412 MB, load 180 ms, 33.4C
```

`--resume` reads the JSONL back and skips every `(variant, repeat)` already
recorded, so an interrupted run continues rather than restarting. Only
successful measurements count as done.

To drive the app yourself, pass `--no-launch` and the script prints the
environment to start it with.

Options: `--suite quick|full|everything`, `--only <ids>`, `--tasks <names>`,
`--backends <tags>`, `--repeats N`, `--max-temp-c C`, `--gate-timeout-s N`,
`--max-bytes N`, `--keep-models`, `--iterations N`, `--warmup N`, `--no-memory`,
`--no-native`, `--resume`, `--port N`, `--out <path>`,
`--pin-clocks off|auto|on` (off by default; see Clocks).

**`BENCHMARK_SPEC.md` is the protocol** — what is measured, on what inputs, under
what thermal and clock conditions. Read it before comparing two devices, and
point anyone benchmarking on their own hardware at it.

## Summarising a run

```bash
yarn bench:summary results/v0.10.0-android-SM-S948B.jsonl
yarn bench:summary results/*.jsonl --format csv > benchmarks.csv
```

One row per variant: size, load time, inference time, peak memory, and the
spread between repeats. It reads the in-progress `.jsonl` as happily as the
final `.json`, so a running suite can be summarised without stopping it.

## Comparing two runs

```bash
yarn bench:compare results/et-1.3.1-ios-iPhone17,1.json results/et-1.4.1-ios-iPhone17,1.json
```

Prints a per-metric table and exits 1 if anything regressed past tolerance
(execute 10%, pipeline 30%, load 35%, memory 10% - override with `--execute N`,
`--pipeline N`, `--load N`, `--memory N`).

Repeats are folded before diffing: each metric becomes the median across them,
and its noise floor is widened to cover the run-to-run range as well as the
within-run one. That second term is why repeats are taken at all - the spread
between three cold measurements is routinely larger than the spread between
twenty back-to-back iterations inside one of them.

Four guards keep the output honest:

- **Device mismatch is fatal.** Comparing an iPhone run against a Pixel run is
  meaningless; pass `--allow-device-mismatch` if you know what you are doing.
- **An input-spec change is fatal.** Two runs built from different inputs
  measured different work, whatever else they agree on.
- **A metric whose workload changed is reported as `INCOMPARABLE`, not as a
  delta.** If a pipeline decoded 14 tokens in one run and 19 in the other, it did
  different work, and the ratio of the two timings measures nothing.
- **A metric whose own spread is wider than the tolerance is reported as
  `NOISY`.** It cannot resolve a regression of the size being asked about, and
  calling it "same" would overstate what the run knows.

A delta inside the run's own interquartile range is reported but not failed -
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

Per variant, per repeat:

| Metric             | What it covers                                                                         |
| ------------------ | -------------------------------------------------------------------------------------- |
| `load.native`      | `loadModel` on the `.pte` alone                                                        |
| `load.task`        | The pipeline's `create` - load, schema validation, tensor pre-allocation               |
| `execute.<method>` | Raw `model.execute`, per exported method, no pipeline around it                        |
| `pipeline.median`  | The task's synchronous entry point end to end: preprocessing, execute, post-processing |
| `memory.loaded`    | Process footprint once the pipeline is ready                                            |
| `memory.peak`      | Peak footprint during inference                                                        |
| `memory.disposed`  | Footprint after `dispose` - a leak shows up as a case that never returns to baseline   |

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
cost is input-dependent - an NMS pass over 200 candidate boxes is not the work
of one over 3 - and a harness that picked a photo from the gallery would move
for reasons unrelated to the change under test. See `src/inputs.ts`, and
`INPUT_SPEC_VERSION` within it: it is recorded in every report and the
comparator refuses to diff across a change to it.

The exception is speech-to-text. The synthetic waveform is voice-shaped but is
not speech, so Whisper's decoder emits far fewer tokens than a real clip would
and the pipeline figure is dominated by the encoder. Compare its
`execute.<method>` numbers rather than its pipeline number.

## The thermal gate

Every measurement starts from the same thermal state, because on a phone that is
the largest thing separating two runs of identical code.

Before each repeat the device parks at the gate and the host polls
`dumpsys battery` until the battery is at or below `--max-temp-c` (37C by
default) and the framework reports no throttling. An absolute ceiling is used
rather than a "has it stopped cooling" plateau: a plateau answers the right
question when comparing two runs on one device and the wrong one when comparing
four devices, since a phone settling at 41C and one settling at 30C both pass a
plateau test while measuring quite different things.

The wait lives on the host because Android exposes battery temperature to `adb`
and not to an ordinary app. It is bounded by `--gate-timeout-s` (30 minutes), and
a measurement that starts warm anyway is flagged `gate.timedOut` with the
temperature it actually began at, rather than silently pretending. Charging keeps
a device warm and is called out when detected.

iOS exposes no temperature at all, on the device or over the wire. There the gate
falls back to waiting for `thermalState` to clear plus a fixed 90-second settle,
and records `gate.kind: "device"` so no iOS number is read as gated to 37C.

## Clocks

Clocks are left alone by default, because a benchmark should report the
performance the device actually delivers.

`--pin-clocks on` puts Android into `PowerManager`'s fixed-performance mode,
which vendors implement as a hard frequency cap: on a Galaxy S26 Ultra it takes
every cluster from 3.19/3.40 GHz down to about 1.98 GHz. That is worth having
when the question is "did this build regress" - a device boosts early in a run
and sags as it heats, which is how two runs of *identical* code came out 9% to
51% apart, and the same clock in every run removes that. It is not worth having
when the question is "how fast is this model on this phone", because the answer
then describes a frequency the governor would never pick and understates the
device by the ratio of the two clocks.

So: pinned for an A/B against another build, unpinned for publishing numbers.
`bench:compare` refuses to diff across the two, and the driver reads the
frequency back after enabling rather than trusting the call, because not every
vendor implements the HAL. It restores normal clocks on exit, Ctrl-C and crash
alike. There is no iOS equivalent - nothing in the public API pins or caps the
clock - so iOS runs depend on the thermal gate alone.

## Tiers

| Tier | Contents | Android scale |
| --- | --- | --- |
| `quick` | Small vision and text models | minutes |
| `full` | Everything except LLMs | ~28 GB |
| `everything` | Including LLMs | ~119 GB |

LLMs are their own tier because they are 39 of the 163 Android variants and
around 90 GB of the 119 GB: a `full` run that pulled them in would be a multi-day
download before a single vision model was measured.

Models are deleted after a variant's last repeat, so peak disk is one model
rather than the whole tier. `--keep-models` turns that off when re-running a
small tier repeatedly, where re-downloading costs more than the disk does.

A variant whose download exceeds `--max-bytes` (6 GB) is recorded as `skipped`
with its size rather than attempted: on an 8 GB phone a 6 GB bf16 LLM is
competing with the whole of RAM, and a run is more useful saying it did not try
than dying halfway through the download.

## Where the case list comes from

There is no hand-written case list. `src/variants.generated.ts` is produced from
`packages/react-native-executorch/src/models.ts` by
`scripts/generate-variants.mjs`, and `src/suite.ts` joins each variant to the
driver for its task in `src/drivers.ts`.

That split is what keeps the suite honest at this scale. A variant added to the
registry is benchmarked without touching the harness; a variant removed stops
being benchmarked the same way; and a task added with no driver is reported as
`skipped` with that reason rather than silently disappearing. Hand-listing 261
variants would guarantee the list went stale, and a model that is quietly never
measured is the exact failure this harness exists to prevent.

```bash
yarn bench:variants --sizes    # regenerate, re-measuring download sizes
yarn bench:variants:check      # fail if the committed file is stale
```

Adding a **task** means adding a driver: a factory, the call to time, and the
config key holding the `.pte` for the raw-execute pass. Adding a **model or
variant** means nothing here at all - regenerate and it is covered.

## The native probe

`modules/bench-probe` is a local Expo module reading the process footprint:
`task_vm_info.phys_footprint` on iOS (what jetsam measures an app against) and
total PSS on Android. Both count the resident pages of a memory-mapped `.pte`,
which the native-heap counters miss entirely — and that is most of a model's
footprint.
