# Agentable v0.2 — Improvement Plan

> Full roadmap for fixing identified gaps. Ordered by impact and dependency.
> Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 1 — Dogfooding

> **Goal:** The project should pass its own criteria. A tool that audits repos for best practices must follow those practices itself.

### 1.1 Create `AGENTS.md`

- [ ] Create `AGENTS.md` at repo root
- [ ] Include: project purpose, architecture overview, directory layout, conventions
- [ ] Include: how to add a new criterion (step-by-step)
- [ ] Include: coding constraints (300-line max per file, zero runtime deps philosophy)
- **Why:** The `agents_md` criterion checks for this file in evaluated repos. Agentable doesn't have one — fails its own check.

### 1.2 Add ESLint + Prettier config

- [ ] Install `eslint`, `@eslint/js`, `typescript-eslint`, `prettier`, `eslint-config-prettier` as devDependencies
- [ ] Create `eslint.config.mjs` (flat config — modern ESLint v9+)
- [ ] Create `.prettierrc` with consistent style rules
- [ ] Add `"lint": "eslint src/"` and `"format": "prettier --check ."` scripts to `package.json`
- [ ] Add `"format:fix": "prettier --write ."` and `"lint:fix": "eslint src/ --fix"` scripts
- [ ] Fix any lint errors surfaced in existing code
- **Why:** The project checks `lint_config` and `formatter` criteria in others but has neither configured itself.

### 1.3 Add pre-commit hooks

- [ ] Install `husky` and `lint-staged` as devDependencies
- [ ] Add `"prepare": "husky"` script to `package.json`
- [ ] Create `.husky/pre-commit` hook that runs `npx lint-staged`
- [ ] Create `.lintstagedrc.json` config: run `eslint --fix` on `.ts` files, `prettier --write` on all staged files
- **Why:** The project checks `pre_commit_hooks` in evaluated repos. Agentable has no hooks.

### 1.4 Add CI workflow

- [ ] Create `.github/workflows/ci.yml`
- [ ] Steps: checkout → setup Node 20 → `npm ci` → `npm run build` → `npm run lint` → `npm run format` → `npm run check:max-lines` → `npm test`
- [ ] Trigger on push to `main` and pull requests
- [ ] Add Node 22 to the matrix for forward-compat validation
- **Why:** The project evaluates `fast_ci_feedback` in others. No `.github/workflows/` directory exists. A CI tool with no CI is not credible.

---

## Phase 2 — Performance & Modernization

> **Goal:** Fix the performance bottleneck in repo scanning and modernize the module system.

### 2.1 Fix `estimateLoc` performance

- [ ] In `src/collectors/local.ts`, replace sequential `readFile` loop (up to 1200 files, one at a time) with batched concurrent reads
- [ ] Use `Promise.all` with a concurrency limiter (~50 parallel reads)
- [ ] Alternative approach: use a single `wc -l` invocation via `runCommand` for all candidate files (one syscall instead of 1200)
- [ ] Benchmark before/after on a large repo (e.g., a monorepo with 5k+ files)
- **Why:** On large repos, `estimateLoc` sequentially reads up to 1200 files. This is the main latency bottleneck during the "Scanning repository" phase.
- **Current code:** `src/collectors/local.ts` lines 30–48

### 2.2 Migrate to ESM (future consideration)

- [ ] Change `"type": "module"` in `package.json`
- [ ] Update `tsconfig.json`: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`
- [ ] Convert test files from `require()` to `import`
- [ ] Rename test files from `.test.js` to `.test.mjs` or keep as `.test.js` with ESM syntax
- [ ] Verify all `scripts/*.mjs` still work (they already use ESM)
- [ ] Update `dist/cli.js` bin entry if needed
- **Why:** `"type": "commonjs"` is dated for a Node 20+ project. The project's own scripts already use `.mjs`. However, this is lower priority and higher risk — defer until Phase 1-2 are stable.
- **Risk:** Breaking change for any downstream consumers importing from `agentable`. Needs careful testing.

---

## Phase 3 — Extensibility

> **Goal:** Make the tool easier to extend for contributors and reduce coupling to a single AI vendor.

### 3.1 Add OpenAI-compatible AI provider

- [ ] The `AiProvider` interface already exists in `src/collectors/ai-provider.ts` — no new abstraction needed
- [ ] Create `src/collectors/providers/openai/` directory mirroring the `openrouter/` structure
- [ ] Implement `openaiProvider` satisfying the `AiProvider` interface
- [ ] Use the OpenAI chat completions API format (this also covers local models via Ollama, LM Studio, vLLM)
- [ ] Add `provider` field to `~/.agentable/config.json`: `"provider": "openrouter" | "openai"`
- [ ] Update `src/cli/setup.ts` to prompt for provider selection during `--setup`
- [ ] Update `src/collectors/ai.ts` to select provider based on config
- [ ] Default remains OpenRouter for backward compatibility
- **Why:** Being locked to a single AI provider is a friction point. The OpenAI-compatible format is the de facto standard and covers the broadest ecosystem (OpenAI, Azure, Ollama, vLLM, Together, Fireworks, etc.).

### 3.2 Reduce criteria registration ceremony

- [ ] Currently adding ONE criterion requires editing 4–6 files:
  1. `src/catalog/v1/*.criteria.ts` — definition
  2. `src/core/evaluate/rules-*.ts` — evaluator logic
  3. `src/core/evaluate/rules-index.ts` — manual registration in `RULES` map
  4. `src/web/card-meta.ts` — display name, badge, maxPoints
  5. Optionally `src/core/evaluate/applicability.ts` — skip conditions
  6. Optionally `src/web/improvement-tips/defaults.ts` — improvement text
- [ ] **Option A (recommended):** Auto-generate `rules-index.ts` — keep current structure but use a build script that scans `rules-*.ts` exports and generates the registration map. Removes step 3 entirely.
- [ ] **Option B:** Co-locate criteria — each criterion is a single file that exports `{ definition, evaluator, cardMeta, applicability?, tips? }`. A registry module auto-discovers them. More invasive but cleaner long-term.
- [ ] Whichever option: add a `scripts/new-criterion.mjs` scaffolding script that generates the boilerplate files for a new criterion
- **Why:** High ceremony discourages contributions and increases error surface. The manual `RULES` map in `rules-index.ts` is the most fragile part — easy to forget registering a new evaluator.

---

## Phase 4 — Web Dashboard DX

> **Goal:** Make the dashboard frontend maintainable without losing the zero-dependency philosophy.

### 4.1 Extract inline templates to real files

- [ ] Create `src/web/frontend/` directory with actual files:
  - `index.html` — main HTML shell
  - `app.css` — all CSS (currently spread across `css-foundation.ts`, `css-components.ts`, `css-layout.ts`, `css-responsive.ts`)
  - `app.js` — all client-side JS (currently in `js-charts.ts`, `js-modal.ts`, `js-runtime.ts`, `js-sections.ts`, `js-events-bootstrap.ts`)
- [ ] Add a build step (in `npm run build`) that reads these files and generates TypeScript constants:
  ```
  // generated by build
  export const APP_CSS = `...`;
  export const APP_JS = `...`;
  export const INDEX_HTML = `...`;
  ```
- [ ] Or simpler: use `fs.readFileSync` at build time via a small `scripts/bundle-frontend.mjs`
- [ ] Update `src/web/templates.ts` to import from the generated file instead of composing strings
- [ ] Verify standalone HTML export still works
- **Why:** ~1500+ lines of CSS/JS living as TypeScript template strings means no syntax highlighting, no editor support, no hot-reload during development. Any layout change is painful. Extracting to real files gives proper tooling without adding runtime deps.

---

## Phase 5 — Nice-to-haves

> **Goal:** Quality-of-life improvements that round out the tool.

### 5.1 Add `--dry-run` flag

- [ ] Add `--dry-run` to `src/cli/args.ts` parser
- [ ] When set, print the full criteria catalog (id, category, source, description, aiAssisted) as a formatted table
- [ ] Show which criteria would be skipped based on project profile (requires running `collectLocalProjectContext` + `buildProjectProfile` only)
- [ ] Exit without starting the engine, server, or AI calls
- [ ] Update `--help` output and README
- **Why:** There's no way to see what the tool checks without running the full analysis. Useful for understanding scope before committing to a run (especially with AI costs).

### 5.2 Add `.agentable.json` project config

- [ ] Define schema: `{ "skip": ["criterion_id", ...], "overrides": { "criterion_id": { "applicable": false, "reason": "..." } } }`
- [ ] Read `.agentable.json` from repo root in `collectLocalProjectContext`
- [ ] Apply skip/override rules before evaluation in `evaluateAllCriteria`
- [ ] Document the config format in README
- **Why:** Some criteria are not relevant for all projects (e.g., `product_analytics` for an internal tool). Users should be able to opt out without forking.

### 5.3 Type the tests

- [ ] Rename `test/*.test.js` → `test/*.test.ts`
- [ ] Add `test/` to `tsconfig.json` include (or create a `tsconfig.test.json` extending the base)
- [ ] Replace `require()` calls with `import`
- [ ] Ensure `npm test` script still works (compile tests before running)
- [ ] Alternative: keep `.js` but add JSDoc `@type` and `@param` annotations for the critical helpers
- **Why:** Tests in untyped JS lose the safety net that TypeScript provides for the rest of the codebase. Refactors in `src/` can silently break test assumptions.

---

## Verification Criteria

After each phase, validate:

1. `npm run build` succeeds
2. `npm test` passes
3. `npm run check:max-lines` passes (no file > 300 lines)
4. `node dist/cli.js .` runs against the agentable repo itself — score should improve phase over phase
5. After Phase 1 specifically: the project should pass `agents_md`, `lint_config`, `formatter`, `pre_commit_hooks`, and `fast_ci_feedback` on itself

## Priority Order

| Priority | Item                  | Effort | Impact                   |
| -------- | --------------------- | ------ | ------------------------ |
| 1        | 1.1 AGENTS.md         | 30 min | High (credibility)       |
| 2        | 1.2 ESLint + Prettier | 1–2 hr | High (credibility)       |
| 3        | 1.3 Pre-commit hooks  | 30 min | Medium (credibility)     |
| 4        | 1.4 CI workflow       | 30 min | High (credibility)       |
| 5        | 2.1 estimateLoc perf  | 1 hr   | High (UX on large repos) |
| 6        | 5.1 --dry-run         | 1 hr   | Medium (UX)              |
| 7        | 3.1 OpenAI provider   | 2–3 hr | High (adoption)          |
| 8        | 3.2 Criteria ceremony | 3–4 hr | Medium (contributor DX)  |
| 9        | 4.1 Extract templates | 2–3 hr | Medium (maintainability) |
| 10       | 5.2 .agentable.json   | 1–2 hr | Medium (flexibility)     |
| 11       | 5.3 Type tests        | 1–2 hr | Low (internal quality)   |
| 12       | 2.2 ESM migration     | 3–4 hr | Low (modernization)      |

---

## Changelog

| Date | Item | Notes |
| ---- | ---- | ----- |
| —    | —    | —     |
