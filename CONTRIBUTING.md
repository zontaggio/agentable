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

## Testing

Run the full test suite:

```bash
npm test
```

Test against a real repository:

```bash
npm run build
node dist/cli.js /path/to/repo --verbose
```

## Commit Messages

Use conventional commit format:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `test:` for test additions/changes
- `refactor:` for code refactoring
- `chore:` for build/tooling changes

## Questions?

Open an issue for any questions or concerns about contributing.
