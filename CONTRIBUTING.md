# Contributing to Agentable

Thank you for your interest in contributing to Agentable!

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run tests: `npm test`

## Making Changes

1. Create a new branch for your feature or bugfix
2. Make your changes following the existing code style
3. Add tests for new functionality
4. Ensure all tests pass
5. Update documentation as needed

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Ensure the build passes and tests are green
3. Request review from maintainers
4. Address any feedback

## Code Style

- Use TypeScript for all new code
- Follow existing patterns and conventions
- Add JSDoc comments for public APIs
- Keep functions focused and testable
- Keep each `src/**/*.ts` file at 300 lines or fewer

## Checks

CI runs all of these on every push; run them locally before opening a pull request:

```bash
npm test                 # build, 300-line budget, then the Node test runner
npm run test:coverage    # tests with coverage thresholds (75% lines, 65% branches, 80% functions)
npm run lint             # ESLint, including naming and complexity rules
npm run format           # Prettier check (npm run format:fix to apply)
npm run knip             # unused files, exports and dependencies
npm run duplication      # copy-pasted code (jscpd)
npm run check:docs       # AGENTS.md and README.md match the code
```

Run the functional quality gates against the benchmark dataset:

```bash
npm run quality:gates
```

Try your changes on a real repository:

```bash
npm run build
node dist/cli.js /path/to/repo --verbose
```

Adding a criterion? Follow the checklist in [AGENTS.md](AGENTS.md#how-to-add-a-new-criterion).

## Commit Messages

Use conventional commit format:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `test:` for test additions/changes
- `refactor:` for code refactoring
- `chore:` for build/tooling changes

Add user-facing changes to `CHANGELOG.md` under _Unreleased_.

## Releasing

1. Move the _Unreleased_ notes in `CHANGELOG.md` under a new version heading.
2. `npm version <patch|minor|major>` to bump `package.json` and create the tag.
3. `git push --follow-tags`. The release workflow publishes the GitHub release and, when the `NPM_TOKEN` secret is set, the npm package.

## Questions?

Open an issue for any questions or concerns about contributing.
