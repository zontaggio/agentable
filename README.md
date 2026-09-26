<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/zontaggio/agentable/main/docs/assets/logo-dark.png">
    <img src="https://raw.githubusercontent.com/zontaggio/agentable/main/docs/assets/logo-light.png" alt="Agentable" width="420">
  </picture>
</p>

<p align="center">
  <b>Find out how ready your repository is for AI coding agents, and exactly what to fix.</b><br>
  81 checks, a local dashboard and a prioritized action plan. One command.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/agentable"><img src="https://img.shields.io/npm/v/agentable?color=0a6fdb&label=npm" alt="npm version"></a>
  <a href="https://github.com/zontaggio/agentable/actions/workflows/ci.yml"><img src="https://github.com/zontaggio/agentable/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="https://github.com/zontaggio/agentable/actions/workflows/codeql.yml"><img src="https://github.com/zontaggio/agentable/actions/workflows/codeql.yml/badge.svg" alt="CodeQL"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white" alt="Node.js 22+">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
</p>

```bash
npx agentable .
```

## Why

When an agent works on a codebase with no tests, no linter, vague docs or missing types, it guesses more, breaks more and wastes your time. The fix isn't a better prompt; it's a repository with guardrails the agent can lean on.

Agentable audits your repository and tells you which guardrails are missing, with evidence for every verdict and an ordered list of what to do next. It started as an open-source take on the agent-readiness idea popularised by [Factory](https://factory.ai), focused on **JavaScript and TypeScript web projects**, where most agent-assisted development happens today.

## What it checks

81 criteria in 9 categories, most of them deterministic: they read files, configs, dependencies, workflows and Git history, not guesses.

| Category                  | Examples                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Style & validation        | Linter, formatter, strict types, complexity and naming rules, dead code                  |
| Build system              | Documented setup and build, pinned dependencies, fast CI, releases                       |
| Testing                   | Unit and integration tests, coverage thresholds, test naming                             |
| Documentation             | README, `AGENTS.md` and its validation, freshness, agent skills                          |
| Dev environment           | Devcontainer, environment templates, local services and database setup                   |
| Debugging & observability | Logging, error tracking, tracing and alerting (for deployed services)                    |
| Security                  | Dependency updates, CodeQL or equivalent, secret scanning, branch protection, CODEOWNERS |
| Task discovery            | Issue and PR templates, labels, backlog health                                           |
| Product & analytics       | Analytics instrumentation and error-to-insight loops                                     |

Agentable first detects the project's shape (library or service, monorepo, database, feature flags…) and skips criteria that don't apply, so a CLI isn't failed for lacking distributed tracing.

## How it works

1. **Collect.** Reads the repository's files, dependencies, configs and Git history, and optionally GitHub settings through the `gh` CLI.
2. **Profile.** Works out what kind of project it is and which criteria apply.
3. **Evaluate.** Runs every applicable check and records its evidence and confidence. High-risk criteria only pass on strong evidence.
4. **Report.** Scores the repository from level 1 to 5 and opens a local dashboard with the results, their history and a prioritized action plan. Each failing check comes with a copy-ready prompt that asks your agent to fix it.

Three criteria can use AI through [OpenRouter](https://openrouter.ai/). It's optional: without a key they're marked `unverified` and everything else works the same.

## Agentable on Agentable

A tool that grades repositories should pass its own checks. This repository runs the practices it looks for in CI on every push:

- TypeScript strict, ESLint with naming and complexity rules, Prettier and a 300-line limit per file
- Tests with coverage thresholds, and a functional benchmark against 37 popular open-source repositories (`npm run quality:gates`)
- Dead code and unused dependency detection (knip), copy-paste detection (jscpd) and CodeQL
- A check that `AGENTS.md` and this README match the code, so the docs agents read can't go stale

## Usage

```bash
agentable [path] [options]
```

| Option                                 | What it does                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `--verbose`                            | More evidence detail in reports                                                                                     |
| `--no-gh`                              | Skip GitHub checks                                                                                                  |
| `--ai-failure-mode <fallback\|strict>` | What to do when AI is unavailable. Default: `fallback` (mark as unverified). `strict` requires a working AI config. |
| `--host <ip>`                          | Dashboard host (default: `127.0.0.1`)                                                                               |
| `--port <n>`                           | Dashboard port (default: `4173`)                                                                                    |
| `--setup`                              | Configure OpenRouter API key and model                                                                              |
| `--dry-run`                            | Show criteria catalog and exit without running analysis                                                             |

Install it globally if you use it often:

```bash
npm install -g agentable
agentable .
```

### AI models

`agentable --setup` stores an OpenRouter key and lets you pick a model:

| Preset  | Model                       | Why                                                                            |
| ------- | --------------------------- | ------------------------------------------------------------------------------ |
| Default | `openai/gpt-oss-120b`       | Cheapest option. Good enough for the few AI-assisted checks.                   |
| Top     | `anthropic/claude-sonnet-5` | Best cost-to-quality ratio. Recommended if you want better AI guidance.        |
| Premium | `anthropic/claude-opus-5.5` | Best quality, higher cost. For when you want the best possible AI refinements. |

Any other OpenRouter model works too, in its `vendor/model` form. The default is the cheapest on purpose: AI only touches 3 of the 81 criteria and the wording of the action plan.

### Per-project overrides

Create a `.agentable.json` in your repository root to skip criteria that don't apply:

```json
{
  "skip": ["criterion_id"],
  "overrides": {
    "criterion_id": {
      "applicable": false,
      "reason": "Not relevant for this project"
    }
  }
}
```

## Development

```bash
git clone https://github.com/zontaggio/agentable.git
cd agentable
npm install
npm run build
node dist/cli.js /path/to/any/repo
```

`npm test` runs the test suite; [CONTRIBUTING.md](CONTRIBUTING.md) lists every check CI runs and how releases work, and [AGENTS.md](AGENTS.md) explains the architecture and the checklist for adding a criterion. The repository also ships a devcontainer for Codespaces.

Ideas for new criteria are welcome: open an issue first so we can agree on how to detect it deterministically.

## License

[MIT](LICENSE) © Giordano Zonta. See [SECURITY.md](SECURITY.md) to report a vulnerability and [CHANGELOG.md](CHANGELOG.md) for release notes.
