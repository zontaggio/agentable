# Agentable

[![CI](https://github.com/zontaggio/agentable/actions/workflows/ci.yml/badge.svg)](https://github.com/zontaggio/agentable/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-green)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-orange)](CHANGELOG.md)

`agentable` scans a repository for agent-readiness signals across 9 categories (testing, security, build system, documentation, and more) and serves a local dashboard with scores, evidence, and a prioritized action plan. Most checks are deterministic; a few use AI when available, and fall back to `unverified` when not.

## Highlights

- 72 criteria grouped into 9 categories, from linting config to backlog health
- Profile-aware: skips checks that don't apply (e.g. database criteria for repos with no ORM)
- Web-only UX (CLI acts as launcher/configurator for dashboard)
- Configurable AI failure mode (`fallback` default, `strict` optional)
- Evidence-based scoring with three confidence tiers (`high`, `medium`, `low`)
- Prioritized action plan (`critical`, `high leverage`, `quick wins`)
- Hybrid recommendations (deterministic ranking + optional AI wording refinement)
- Local history snapshots and export (`.json` / standalone `.html`)

## Install

```bash
npx agentable .
```

Or install globally:

```bash
npm install -g agentable
agentable .
```

Run from source:

```bash
npm install
npm run build
node dist/cli.js .
```

## Usage

```bash
agentable [path] [--verbose] [--no-gh] [--ai-failure-mode <fallback|strict>] [--host <ip>] [--port <n>] [--setup] [--dry-run]
```

Options:

- `--verbose`: include additional evidence in internal report payloads
- `--no-gh`: disable GitHub checks via `gh` CLI
- `--ai-failure-mode`: AI behavior on provider/config failure (`fallback` default, `strict` optional)
- `--host`: dashboard bind host (default: `127.0.0.1`)
- `--port`: dashboard port (default: `4173`)
- `--setup`: configure OpenRouter API key + model
- `--dry-run`: print full criteria catalog + applicability preview, then exit without analysis/server/AI calls

Removed options:

- `--no-ai` was removed (use `--ai-failure-mode=strict` when AI must be mandatory)
- `--terminal` was removed (dashboard is the only runtime surface)

## First run and config

On first interactive setup, Agentable stores AI config at:

- `~/.agentable/config.json`

Strict mode requires a configured OpenRouter API key and model.  
If no TTY is available and config is missing, strict mode fails with instructions to run:

```bash
agentable --setup
```

Fallback mode runs even without config and marks AI-assisted criteria as `unverified`.

## OpenRouter setup

`--setup` guides users through:

1. OpenRouter API key
2. Model choice with presets:
   - `gpt-oss-120b` (default, cheapest)
   - `claude-sonnet-4.6` (top, best cost-benefit)
   - `claude-opus-4.6` (premium, more expensive)

Custom model ids are also supported.
API key entry is masked during setup.

## Project overrides (`.agentable.json`)

You can skip criteria or mark specific criteria as not applicable per repository:

```json
{
  "skip": ["criterion_id"],
  "overrides": {
    "criterion_id": {
      "applicable": false,
      "reason": "Optional explanation shown in report"
    }
  }
}
```

Behavior:

- `skip`: force criterion status to `skip`
- `overrides.<id>.applicable: false`: force status to `skip` with optional custom reason
- applied before normal applicability and evaluation logic

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

- `src/catalog/v1/`: criterion definitions grouped by category
- `src/collectors/`: local/git/gh/ai data collection
- `src/core/profile.ts`: project profile detection (service vs library, database, monorepo, etc.)
- `src/core/evaluate.ts`: conservative criterion decisions + evidence
- `src/core/evaluate/applicability.ts`: profile-based criterion skipping
- `src/core/scoring.ts`: score + confidence aggregation
- `src/web/improvement-tips/`: deterministic ranking, priority scoring, and fallback guidance
- `src/web/frontend/`: dashboard frontend source files (`index.html`, `app.css`, `app.js`)
- `src/web/server.ts`: dashboard server, report endpoint, feedback endpoint
