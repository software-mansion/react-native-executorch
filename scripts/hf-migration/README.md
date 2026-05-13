# HF Migration Tooling

Scripts that restructure the `software-mansion/react-native-executorch-*` repos
on Hugging Face to match [MODEL_SPEC.md](../../MODEL_SPEC.md). One-shot
migration; the scripts are kept in the repo so the operation is reviewable and
re-runnable.

## Files

| File                  | Role                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `inventory.py`        | Snapshots HF state (files on `main`, existing tags) for every `react-native-executorch-*` repo. |
| `inventory.json`      | Committed snapshot. Refreshed by re-running `inventory.py`.                                 |
| `parse_modelurls.py`  | Extracts URL references from `packages/.../modelUrls.ts` and resolves each tag variable through `versions.ts`. |
| `generate_mapping.py` | Produces `mapping.yaml` (old → new path per file) using the convention in MODEL_SPEC.md.    |
| `mapping.yaml`        | Generated, hand-edited for edge cases, then consumed by `migrate.py`.                       |
| `migrate.py`          | Applies `mapping.yaml` against HF. Supports `--dry-run`. (Coming in a follow-up.)            |
| `gen_config.py`       | Emits per-`<backend>/config.json` for each restructured repo. (Coming in a follow-up.)       |

## Workflow

```bash
# 1. Refresh inventory (anytime the HF state changes)
python3 scripts/hf-migration/inventory.py

# 2. Extract URL references from the library source
python3 scripts/hf-migration/parse_modelurls.py

# 3. Generate the mapping. Review the YAML, hand-edit edge cases.
python3 scripts/hf-migration/generate_mapping.py

# 4. Dry-run the migration (read-only)
python3 scripts/hf-migration/migrate.py --dry-run

# 5. Execute (force-moves the v0.9.0 tag where it exists)
python3 scripts/hf-migration/migrate.py --tag v0.9.0
```

## Target tag

The new layout lands on `main` and is tagged `v0.9.0` on every repo. Repos
that already have a `v0.9.0` tag (pre-migration: the
`NEXT_VERSION_TAG`-pinned models) get the tag force-moved to point at the new
layout. The old layout remains reachable through earlier tags (`v0.8.0`,
`v0.7.0`, ...).

## Decisions

See [MODEL_SPEC.md](../../MODEL_SPEC.md) for the convention. Key consequences
for this tooling:

- File names normalize to `<model>_<size>_<backend>_<precision>.pte` (§3).
- Files move into per-backend subdirectories (§2).
- Llama QLoRA variants are dropped from the new layout but kept under old
  tags (§7.2). `mapping.yaml` lists them with `target: null`.
- Whisper `*-quantized.en` repos are consolidated into the base `.en` repos
  (§7.3). `mapping.yaml` lists those moves explicitly.
- Style-transfer base + quantized already share one HF repo each, no
  consolidation needed.
