# Agentable

`agentable` evaluates repository agent readiness with deterministic criteria plus AI-assisted checks, and launches a guided web dashboard.

## Highlights

- Web-only UX (CLI acts as launcher/configurator for dashboard)
- Configurable AI failure mode (`fallback` default, `strict` optional)
- Conservative evaluation policy to reduce false positives
- Score + coverage + confidence metrics
- Prioritized action plan (`critical`, `high leverage`, `quick wins`)
- Hybrid recommendations (deterministic ranking + AI wording refinement)
- Local history snapshots and export (`.json` / standalone `.html`)

## Install

```bash
npm install
npm run build
```

Run from source:

```bash
node dist/cli.js .
```

## Usage

```bash
agentable [path] [--verbose] [--no-gh] [--ai-failure-mode <fallback|strict>] [--host <ip>] [--port <n>] [--setup]
```

Options:

- `--verbose`: include additional evidence in internal report payloads
- `--no-gh`: disable GitHub checks via `gh` CLI
- `--ai-failure-mode`: AI behavior on provider/config failure (`fallback` default, `strict` optional)
- `--host`: dashboard bind host (default: `127.0.0.1`)
- `--port`: dashboard port (default: `4173`)
- `--setup`: reconfigure OpenRouter API key/model

Removed options:

- `--no-ai` was removed (use `--ai-failure-mode=strict` when AI must be mandatory)
- `--terminal` was removed (dashboard is the only runtime surface)

## First run and config

On first interactive setup, Agentable stores OpenRouter config at:

- `~/.agentable/config.json`

Strict mode requires configured OpenRouter credentials. If no TTY is available and config is missing, strict mode fails with instructions to run:

```bash
agentable --setup
```

Fallback mode runs even without config and marks AI-assisted criteria as `unverified`.

## Runtime behavior

`agentable .`:

1. Runs analysis with progress indicator.
2. Starts local dashboard server.
3. Opens browser automatically.
4. Prints dashboard URL and keeps server alive until `Ctrl+C`.

## Scoring and confidence

- `score = pass / (pass + fail) * 100`
- `coverage = (pass + fail) / total * 100`
- `confidenceScore`: weighted confidence of evaluated criteria
- `highConfidenceCoverage`: percentage of evaluated criteria with high confidence

`skip` and `unverified` are excluded from score denominator.

## Conservative accuracy policy

Agentable uses evidence tiers:

- `strong`: explicit dependency/file/API state
- `medium`: workflow/script corroboration
- `weak`: generic text mention

Key high-risk criteria are hardened to avoid keyword-only passes. Permission-limited GitHub metadata is normalized to `unverified` instead of `fail`.

## Guided recommendations

Dashboard includes an `Action Plan` sorted by deterministic priority:

- `critical`
- `high leverage`
- `quick wins`

Each recommendation includes:

- why it matters
- what good looks like
- high-level next steps
- expected outcome

If AI refinement fails, deterministic guidance is still shown.
Each recommendation also includes an `actionabilityScore` (0-100) to help triage execution order.

## GitHub integration

GitHub checks use `gh` CLI.

If `gh` is missing, unauthenticated, or permission-limited:

- run still succeeds
- affected criteria become `unverified`

## Development

```bash
npm test
```

Run functional launch quality gates:

```bash
npm run quality:gates
```

Dataset template is available at `fixtures/quality-gates/functional-benchmark.template.json`.
`quality:gates` is a strict launch gate and is expected to fail until your benchmark dataset reaches required thresholds.

## Architecture

- `src/collectors`: local/git/gh/ai data collection
- `src/core/evaluate.ts`: conservative criterion decisions + evidence
- `src/core/scoring.ts`: score + confidence aggregation
- `src/web/improvement-tips.ts`: deterministic ranking and fallback guidance
- `src/web/*`: dashboard server, transforms, templates
