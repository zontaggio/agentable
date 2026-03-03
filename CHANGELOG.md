# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- AI is now mandatory for all runs.
- First run automatically opens setup wizard when OpenRouter config is missing.
- `--setup` remains the only explicit reconfiguration flow for model/API key.
- AI collector internals now use a provider interface, with OpenRouter as the active provider.
- Web dashboard mode is now the default CLI behavior.
- CLI now shows a progress bar while analysis is running.
- CLI banner now includes an AI ASCII star mark.
- CLI now opens the dashboard URL in the browser automatically and still prints the link.

### Removed
- Removed `--no-ai` CLI option.

### Breaking
- Running without valid OpenRouter config now fails instead of producing partial `UNVERIFIED` AI criteria.

## [0.1.0] - 2026-03-02

### Added
- Initial release of Agentable CLI
- Comprehensive criteria catalog (v1.0.0) with 9 categories
- Local project context collection
- Git metadata collection
- GitHub CLI integration for repository checks
- OpenRouter AI-assisted criteria evaluation
- Deterministic fingerprinting for cache consistency
- AI baseline caching system
- Terminal reporter with colored output
- Interactive web dashboard
- Score history tracking
- Project profiling and classification
- Configurable host/port for web mode
- User configuration management for API keys
- Test suite for core functionality
- TypeScript type definitions throughout

### Features
- **CLI**: Command-line interface with multiple flags
- **Scoring**: Deterministic scoring algorithm
- **Web Mode**: Interactive localhost dashboard
- **AI Integration**: Optional OpenRouter integration
- **GitHub**: Optional `gh` CLI integration
- **Caching**: Fingerprint-based AI baseline cache
- **History**: Timeline tracking of score evolution
- **Categories**: 9 comprehensive evaluation categories
  - Style & Validation
  - Build System
  - Testing
  - Documentation
  - Dev Environment
  - Debugging & Observability
  - Security
  - Task Discovery
  - Product & Analytics

[0.1.0]: https://github.com/agentable/cli/releases/tag/v0.1.0
