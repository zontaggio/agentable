# AGENTS.md

## Project Purpose

Agentable is a deterministic CLI that audits a repository for agent-readiness signals across 9 categories (72 criteria total) and launches a local web dashboard with scores, evidence, and a prioritized action plan.

It detects the project profile (service vs library, monorepo, database usage, etc.) and skips criteria that don't apply.

Primary goals:

- high signal-to-noise checks (conservative pass/fail behavior)
- reproducible scoring and evidence output
- optional AI-assisted criteria with safe fallback mode
- fast local execution with minimal operational overhead

## Architecture Overview

The runtime is split into four layers:

1. `collectors` gather evidence from local files, Git, GitHub CLI, and AI provider integrations.
2. `core/profile` detects project shape (service, library, monorepo, database, etc.) to drive applicability.
3. `core/evaluate` maps criterion IDs to evaluators and produces criterion-level decisions + evidence.
4. `core/scoring` and `core/reporter` compute aggregate metrics and structured output payloads.
5. `web` transforms results into the dashboard payload and serves the UI.

Execution flow:

1. Parse CLI args (`src/cli/*`).
2. Build local/git/gh/ai context (`src/collectors/*`).
3. Build project profile (`src/core/profile.ts`).
4. Evaluate all criteria (`src/core/evaluate.ts` + `src/core/evaluate/rules-*.ts`).
5. Score + recommend (`src/core/scoring.ts`, `src/web/improvement-tips/*`).
6. Serve dashboard (`src/web/server.ts`) and open browser.

## Directory Layout

- `src/cli`: CLI entrypoint, args, setup flow, help, browser launch, progress UI
- `src/catalog/v1`: criterion definitions grouped by category
- `src/collectors`: repository and provider context collection
- `src/core`: profile building, evaluation engine, scoring, reporting, user config
- `src/web`: server, transforms, template bridge, card metadata, improvement tips
- `src/web/frontend`: editable dashboard frontend sources (`index.html`, `app.css`, `app.js`)
- `src/utils`: filesystem helpers, command execution, content hashing
- `test`: Node test runner suites
- `scripts`: utility scripts (line budget checks, frontend bundle, quality-gates, benchmark generation)
- `fixtures`: benchmark and quality-gate fixtures
- `dist`: TypeScript build output

## Conventions

- Language/runtime: TypeScript on Node 22+.
- Module system: CommonJS today (`"type": "commonjs"`).
- Tests: Node built-in test runner (`node --test`).
- Naming:
  - criterion IDs are snake_case and stable
  - evaluator modules use `rules-*.ts`
  - category definitions live under `src/catalog/v1/*.criteria.ts`
- Commits follow Conventional Commit style (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `revert:`).

## Coding Constraints

- Max file length: 300 lines for TypeScript source under `src/` (enforced by `npm run check:max-lines`).
- Prefer zero runtime dependencies:
  - add runtime packages only with clear, hard-to-replace value
  - prefer Node built-ins and internal utilities first
- Keep behavior deterministic where possible; avoid weak keyword-only heuristics for high-impact checks.
- Treat permission-limited external data as `unverified` rather than forcing false `fail`.

## How To Add A New Criterion

Use this checklist to avoid incomplete registrations.

0. Generate scaffold files (recommended)
   - Run `npm run new:criterion -- <criterion_id> <category> [source] [--ai-assisted]`.
   - The command creates starter snippets in `scaffolds/criteria/<criterion_id>/`.

1. Define criterion metadata
   - Add the criterion definition in the appropriate `src/catalog/v1/*.criteria.ts` file.
   - Ensure `id`, `category`, `description`, and `aiAssisted` flags are accurate.

2. Implement evaluator logic
   - Add handling in the category evaluator module under `src/core/evaluate/rules-*.ts`.
   - Return conservative evidence and avoid low-confidence keyword-only passes.

3. Register evaluator mapping
   - Add the new `criterion_id` to `src/core/evaluate/rules-index.ts` in `RULES`.
   - Point it to the right category evaluator function.

4. Add dashboard card metadata
   - Update `src/web/card-meta.ts`:
     - optional display-name override in `OVERRIDE_NAMES`
     - optional badge classification in `BASIC_IDS` or `ADVANCED_IDS`

5. Add applicability rule when needed
   - Update `src/core/evaluate/applicability.ts` if criterion should be skipped for certain project profiles.
   - Provide a clear skip reason.

6. Add guidance copy when needed
   - Add criterion-specific next steps/tooling text in `src/web/improvement-tips/constants.ts`.
   - `src/web/improvement-tips/defaults.ts` will use these overrides automatically.

7. Add/adjust tests
   - Add tests in `test/` that cover pass/fail/unverified/skip behavior for the new criterion.
   - Favor explicit fixtures and edge cases.

8. Validate locally
   - `npm run build`
   - `npm test`
   - `npm run check:max-lines`

## Pull Request Checklist

- Criterion is fully registered across catalog, rules, and dashboard metadata
- Evidence logic is deterministic and conservative
- New behavior has tests
- Build, tests, and max-line budget pass
