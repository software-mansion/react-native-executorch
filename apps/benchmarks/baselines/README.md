# Baselines

Committed reference runs. `results/` holds whatever the last local run produced
and is gitignored; a run worth keeping is copied in here by hand, so the numbers
under version control are ones somebody chose.

Name files `<label>-<platform>-<device>.json`, matching what `yarn bench` writes.

Compare against one with:

```bash
yarn bench:compare baselines/et-1.3.1-android-SM-S948B.json results/et-1.4.1-android-SM-S948B.json
```

A baseline is only meaningful against the same device and OS version. The
comparator enforces that and refuses to diff across hardware.

## What is here

| File | Covers |
| --- | --- |
| `et-1.3.1-full-android-SM-S948B.json` | ExecuTorch 1.3.1, full suite, Galaxy S26 Ultra (SM-S948B), Android 16 |

This is the reference for the 1.3.1 to 1.4.1 bump. Re-run the same suite on the
same device after the bump and compare against it.

## Re-recording

Re-record a baseline when the suite's cases, inputs or iteration counts change,
since those alter what the numbers mean. Note in the commit message what moved
and why, so a later reader can tell a deliberate re-record from a regression
that was quietly absorbed into the baseline.
