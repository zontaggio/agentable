# Functional Quality Gates Dataset

This folder stores benchmark data used by:

```bash
npm run quality:gates
```

Expected file:

- `functional-benchmark.json`

Start from `functional-benchmark.template.json` and replace the sample records with
real benchmark runs.

## Minimum dataset for launch gate

- At least 30 repositories
- 5 repeated runs per repository for determinism checks
- UX study summary (`participants`, `successes`)

The script fails if thresholds are not met.
