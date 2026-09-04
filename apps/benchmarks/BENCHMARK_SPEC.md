# The v0.10.0 benchmark protocol

This is the contract every device runs against. Numbers from two devices are
only comparable if both followed it, so it is written down rather than left to
whoever happens to run the suite.

The short version: **check out this branch, run one command, send the JSONL.**

```bash
# Android
yarn bench --platform android --suite full --label v0.10.0 --repeats 3 --max-temp-c 35

# iOS
yarn bench --platform ios --suite full --label v0.10.0 --repeats 3
```

Send back `apps/benchmarks/results/v0.10.0-<platform>-<device>.jsonl`. It is
appended to after every single measurement, so it is worth having even if the
run is interrupted.

## What is measured

Every variant in `models.ts` that the device's platform can link, without
exception, taken from a generated list rather than a hand-written one
(`src/variants.generated.ts`, produced by `scripts/generate-variants.mjs`). At
the time of writing that is **163 variants on Android** and **234 on iOS**;
`DEFAULT` aliases are excluded because each resolves to a variant already in the
list under its own name.

Per variant, per repeat:

| Metric | What it covers |
| --- | --- |
| `taskLoadMs` | The pipeline's `create` — load, schema validation, tensor pre-allocation |
| `pipeline.median` | The task's entry point end to end: preprocessing, execute, post-processing |
| `native.methods[].stats` | Raw `model.execute`, per exported method, with no pipeline around it |
| `memory.loaded` | Process footprint once the pipeline is ready |
| `memory.peak` | Peak footprint during inference |
| `memory.disposed` | Footprint after `dispose` — a leak is a case that never returns to baseline |

`memory.*` is process footprint, not native heap: `phys_footprint` on iOS (what
jetsam measures an app against) and total PSS on Android. Both count the
resident pages of a memory-mapped `.pte`, which the heap counters miss entirely
and which is most of a model's cost.

Memory is sampled in a separate pass from the timings. Reading total PSS on
Android walks `/proc/self/smaps` and costs milliseconds; polling that during a
15 ms inference would land in the numbers.

## Runs, iterations, and which is which

- **3 repeats** per variant. A repeat is a complete measurement from a cold
  pipeline, with the device cooled back to the gate temperature in between.
- **20 iterations** inside each measurement, after 3 untimed warmups.

These are not the same thing and the distinction matters. Iterations bound the
noise *within* one measurement; repeats expose the run-to-run spread that
thermal state and clock drift produce, which on a phone is the larger of the
two. The summary reports the median of the three repeats and the spread between
them, so a variant that could not be pinned down says so.

## The thermal gate

Every measurement starts with the device at **35 °C or below**, enforced before
each individual repeat rather than once per run.

On Android the host polls `dumpsys battery` over adb and holds the device at the
gate until the ceiling is reached. An absolute ceiling is used rather than the
"has it stopped cooling" plateau rule: a plateau answers the right question when
comparing two runs on one device and the wrong one when comparing four devices,
because a phone that settles at 41 °C and one that settles at 30 °C both pass a
plateau test while measuring quite different things.

The wait is bounded (30 minutes by default). If a device never reaches 35 °C —
a warm room, a phone on charge — the measurement proceeds and is flagged
`gate.timedOut`, with the temperature it actually started at. Unplug the phone
if you can: charging holds it warm and will stall the gate.

**iOS has no equivalent.** Nothing in the public API exposes a temperature, and
`adb` has no counterpart. There, the gate falls back to waiting for
`thermalState` to report no throttling plus a fixed 90-second settle, and every
result records `gate.kind: "device"` so nobody reads an iOS number as gated to
35 °C. Give the phone a cool room and do not hold it.

## Clocks

**Clocks are left alone.** The device runs at whatever frequency its governor
picks, because that is the performance a user of the library actually gets.

The harness can pin them — Android's `PowerManager` fixed-performance mode,
which vendors implement as a hard frequency cap — and that is the right thing
when the question is "did this build regress", where the same clock in both runs
is worth more than a fast one. It is the wrong thing here. On a Galaxy S26 Ultra
it caps every cluster from 3.19/3.40 GHz to about 1.98 GHz, so every number
published from a pinned run would understate the device by roughly that ratio
and describe a state the phone would never enter on its own.

Do not pass `--pin-clocks on` for these runs. It is off by default; the flag
exists for A/B work against another build, and `bench:compare` refuses to diff a
pinned run against an unpinned one for the same reason.

With the clock free, the thermal gate is the only control over run-to-run drift,
which is why it runs before every repeat rather than once per suite. A phone
that boosts early and sags as it heats produced 9% to 51% differences between
two runs of identical code; starting every measurement cold is what keeps that
in hand.

## Inputs

Every input is synthetic and a pure function of its parameters, so two runs on
two devices feed byte-identical data to the models. This is not a detail:
post-processing cost is input-dependent — an NMS pass over 200 candidate boxes
is not the work of one over 3 — so a harness that used a photo from the gallery
would move for reasons unrelated to the device.

`src/inputs.ts` is the definition; `INPUT_SPEC_VERSION` is recorded in every
report and the comparator refuses to diff across a change to it.

| Task | Input |
| --- | --- |
| Vision (classification, detection, segmentation, style transfer, OCR, keypoints, image embeddings) | A fixed 512x512 or 640x640 scene: a vertical gradient, three solid ellipses, and a seeded dither |
| Text embeddings, privacy filter | Fixed prose, with the PII text seeded with the entity types a detector should find |
| VAD, speech-to-text | 10 s of a voice-shaped waveform: a 130 Hz pulse train through three formant resonators, 0.7 s bursts alternating with 0.3 s of near-silence |
| Text-to-speech | Fixed text; the voice is the alphabetically first the config publishes, so the choice is a property of the voice set rather than of declaration order |
| Text-to-image | Fixed prompt, fixed seed |
| LLM | Fixed short prompt, **64 tokens decoded with EOS ignored and temperature 0** |

Two caveats worth knowing before reading the output:

- **Speech-to-text.** The waveform is voice-shaped but is not speech, so
  Whisper's decoder emits far fewer tokens than a real clip would and the
  pipeline figure is dominated by the encoder. Compare its `native.methods`
  numbers, not its pipeline number.
- **LLMs.** Decode is pinned to a fixed token count because generation length is
  otherwise a property of the model and its quantisation, and a wall-clock
  figure over a varying token count compares nothing. Divide `pipeline.median`
  by 64 for milliseconds per token; `detail.timeToFirstTokenMs` and
  `detail.prefillMs` are reported separately. Multimodal models are driven
  text-only.

## Tiers

| Tier | Contents | Android scale |
| --- | --- | --- |
| `quick` | Small vision and text models | minutes |
| `full` | Everything except LLMs | ~28 GB, hours |
| `everything` | Including LLMs | ~119 GB |

LLMs are their own tier because they are 39 of the 163 Android variants and
around 90 GB of the 119 GB. Run `--suite everything` overnight and expect the
gate to be the slowest part of it.

Leave the phone unplugged if its battery will survive the run: charging holds a
device warm, so a charged run spends far longer at the gate and may never reach
35 °C at all. If it has to be plugged in, the run still completes — the
measurements that started warm are flagged `gate.timedOut` with their real
starting temperature.

Models are deleted after each variant's last repeat, so peak disk is one model
rather than the whole tier. Pass `--keep-models` to keep them when re-running a
small tier repeatedly.

Variants whose download exceeds `--max-bytes` (6 GB by default) are recorded as
`skipped` with their size rather than attempted. On an 8 GB phone a 6 GB bf16
LLM is competing with the whole of RAM, and a run is more useful saying it did
not try than dying halfway through the download.

## Interrupted runs

Measurements are appended to the JSONL as they land, so nothing is lost. To
carry on:

```bash
yarn bench --platform android --suite full --label v0.10.0 --resume
```

`--resume` reads the JSONL, and the device skips every `(variant, repeat)` it
already holds. Only successful measurements count as done, so a variant that
errored is retried.

## Reading the output

```bash
yarn bench:summary results/v0.10.0-android-SM-S948B.jsonl              # markdown table
yarn bench:summary results/*.jsonl --format csv > benchmarks.csv       # every device
```

`Inference ms` is the median of the three repeats and `Spread %` the range
between fastest and slowest as a percentage of it. A large spread is a real
result, not a formatting artefact: it means the variant was not pinned down at
this repeat count, and its `Execute ms` column — ExecuTorch alone, without the
TypeScript pre- and post-processing — is the steadier number to read.
