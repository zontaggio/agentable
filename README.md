# Agentable

`agentable` is a deterministic CLI that scores repository agent readiness using a fixed criteria catalog.

## Features

- CLI-first: run with `npx agentable [path]`
- Deterministic scoring for unchanged repositories
- Required BYOK OpenRouter for AI-assisted criteria
- AI baseline cache keyed by repository fingerprint
- Optional GitHub checks via `gh` CLI
- Web dashboard by default plus optional terminal report mode

## Install

```bash
npm install
npm run build
```

Or use directly from npm (after publishing):

```bash
npx agentable .
```

## Quick Start

After installation, run the tool against your repository:

```bash
# Analyze current directory
agentable .

# Analyze a specific path
agentable /path/to/repo

# Run with verbose output
agentable . --verbose
```

## Usage

```bash
agentable [path] [--verbose] [--no-gh] [--web] [--terminal] [--host <ip>] [--port <n>] [--setup]
```

Options:

- `--verbose`: print evidence lines for each criterion
- `--no-gh`: disable GitHub checks
- `--web`: force interactive dashboard mode (default)
- `--terminal`: force terminal report output
- `--host`: host interface for web mode (default `127.0.0.1`)
- `--port`: port for web mode (default `4173`)
- `--setup`: configure OpenRouter API key/model and persist locally

Exit codes:

- `0`: successful execution (including partial coverage)
- `1`: operational error (invalid path, unexpected internal error)

## Localhost dashboard mode

Run web mode:

```bash
agentable /absolute/path/to/repo
```

Custom host/port:

```bash
agentable /absolute/path/to/repo --web --host 127.0.0.1 --port 4173
```

Behavior:

- server stays running until `Ctrl+C`
- browser opens automatically and CLI still prints the link
- CLI shows a progress bar while analysis is running
- dashboard includes clickable criterion cards + detail modal
- refresh action reruns analysis without restarting the server
- download actions export JSON or standalone HTML snapshot
- timeline chart uses local history snapshots stored per repository

## BYOK OpenRouter

AI is mandatory. Without local OpenRouter config, the run fails and asks you to configure credentials.

Configuration model:

- On first run, CLI asks for:
  - OpenRouter API key
  - OpenRouter model (default: `gpt-oss-120b`)
- Credentials are saved in:
  - `~/.agentable/config.json`
- To reconfigure later:
  - `agentable --setup`

The first successful AI run for a repository fingerprint creates a baseline cache in:

- `~/.cache/agentable/`

Re-running with the same fingerprint reuses baseline and keeps score stable.

## Testing in your own codebase

From this project folder:

```bash
npm install
npm run build
```

Run against any local repository path:

```bash
node dist/cli.js /absolute/path/to/your-repo
```

Examples:

```bash
node dist/cli.js /Users/you/projects/my-api --verbose
node dist/cli.js /Users/you/projects/my-api --no-gh
```

## Scoring model

- `score = pass / (pass + fail) * 100`
- `skip` is excluded from denominator
- `unverified` is excluded from score denominator
- `coverage = (pass + fail) / total_criteria * 100`

Always read score together with coverage.

## Criteria Categories

Agentable evaluates repositories across 9 comprehensive categories:

1. **Style & Validation** - code quality, linting, formatting, type checking
2. **Build System** - compilation, bundling, CI/CD pipeline
3. **Testing** - unit tests, integration tests, coverage
4. **Documentation** - README, API docs, changelog
5. **Dev Environment** - setup scripts, dependency management
6. **Debugging & Observability** - logging, monitoring, error tracking
7. **Security** - dependency scanning, secrets management
8. **Task Discovery** - make targets, npm scripts, workflow automation
9. **Product & Analytics** - feature flags, metrics collection

Each criterion is scored as: **pass**, **fail**, **skip** (not applicable), or **unverified** (insufficient metadata or API permissions).

## GitHub integration

GitHub-specific checks use `gh` CLI when available and authenticated.

If `gh` is missing or unauthenticated:

- run still succeeds
- GitHub-dependent criteria become `UNVERIFIED`

## Development

```bash
npm test
```

This runs build + tests.

## Examples

### Basic Usage

```bash
# Start dashboard for current directory (default)
agentable .

# Analyze with verbose output showing evidence
agentable . --verbose

# Disable GitHub integration
agentable . --no-gh

# Force terminal report mode
agentable . --terminal
```

### Web Dashboard

```bash
# Start interactive dashboard (same as default)
agentable . --web

# Custom port
agentable . --web --port 8080

# Bind to specific interface
agentable . --web --host 0.0.0.0 --port 3000
```

### Configuration

```bash
# Configure or reconfigure OpenRouter settings
agentable --setup

# Run setup then analyze
agentable --setup
agentable .
```

If you run non-interactively and no config is present, use:

```bash
agentable --setup
```

## Architecture

- **Collectors**: Gather data from local files, git, GitHub API, and AI
- **Evaluators**: Apply criteria logic against collected context
- **Scoring**: Deterministic aggregation of pass/fail/skip/unverified
- **Reporter**: Terminal output with ANSI colors
- **Web Server**: Interactive dashboard with history and drill-down
- **Cache**: Fingerprint-based persistence for AI baselines
