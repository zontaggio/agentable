# Changelog

All notable changes to Agentable are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org).

## [Unreleased]

## [0.2.0] - 2026-09-25

### Changed

- **Breaking:** requires Node.js 22 or later (Node 20 reached end of life).
- Model presets now use full OpenRouter IDs and current models: `openai/gpt-oss-120b` (default), `anthropic/claude-sonnet-5` (top) and `anthropic/claude-opus-5.5` (premium).

### Fixed

- Libraries and CLIs are no longer failed on service-only criteria (distributed tracing, alerting, metrics, deployment observability, structured logging, log scrubbing, error tracking, error-to-insight pipelines, feature flags).
- `env_template` only applies when there is configuration to document (a service, external services or `.env` files).
- Complexity and naming rules are read from ESLint, Biome and Oxlint configs; before, they were only found when mentioned in docs.
- AI requests always send a full `vendor/model` ID, including for bare model names saved by earlier versions.
- README-based checks read the root README; a nested one such as `docs/README.md` could be picked instead.
- Categories with nothing evaluated show "N/A" instead of "0%", and the criterion badge stays inside the detail view.

### Security

- On Windows the dashboard opens through the URL protocol handler instead of `cmd /c start`, and only http(s) URLs are opened.
- Unexpected dashboard errors are logged in the terminal instead of being returned to the browser.
- Repository fingerprinting reads each file's size and contents from one handle, closing a race with the size limit.

### Internal

- CI checks dead code (knip), duplication (jscpd), coverage thresholds, and that AGENTS.md and README.md match the code; CodeQL scans every push.
- Releases are published from version tags.

## [0.1.1] - 2026-03-07

### Changed

- Clearer guidance copy for failing criteria in the dashboard.

## [0.1.0] - 2026-03-07

First public release.

### Added

- CLI that scores a JavaScript/TypeScript repository against 81 agent-readiness criteria in 9 categories and serves a local dashboard with evidence, score history and a prioritized action plan.
- Project profiling (service or library, monorepo, database, feature flags…) that skips criteria that don't apply.
- Optional AI-assisted criteria and action-plan wording through OpenRouter, with a deterministic fallback when AI is unavailable (`--ai-failure-mode`).
- Copy-ready remediation prompts for failing criteria.
- `--dry-run`, per-project overrides in `.agentable.json`, and guided setup with model presets.

[Unreleased]: https://github.com/zontaggio/agentable/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/zontaggio/agentable/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/zontaggio/agentable/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/zontaggio/agentable/releases/tag/v0.1.0
