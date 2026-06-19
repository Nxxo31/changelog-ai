# Changelog AI

> Generate beautiful changelogs from your git history — automatically.

**changelog-ai** analyzes your git commits between two tags (or commits) and generates a changelog in the [Keep a Changelog](https://keepachangelog.com/) format. It classifies commits using [Conventional Commits](https://www.conventionalcommits.org/) conventions and detects breaking changes — no LLM, no external API, no paid dependencies.

Built for developer teams who want meaningful release notes without the manual effort.

## Features

- **Zero external dependencies** — runs entirely offline using git history
- **Conventional Commits** parsing with full type support
- **Breaking change detection** via `!` suffix or `BREAKING CHANGE:` footer
- **Keep a Changelog** format output (user-friendly and machine-readable)
- **Flexible output** — stdout or file, with optional author and scope metadata
- **TypeScript** with full type safety and 22 unit tests
- **MIT license** — free for personal and commercial use

## Installation

```bash
# Clone the repo
git clone https://github.com/Nxxo31/changelog-ai.git
cd changelog-ai

# Install and build
npm install
npm run build

# Use globally
npm link
```

Or run directly with `node dist/cli.js`.

## Quick Start

```bash
# List available tags
changelog-ai tags

# Generate changelog between two tags
changelog-ai generate v1.0.0 v1.1.0

# Generate from tag to HEAD
changelog-ai generate v1.0.0 HEAD

# Save to file
changelog-ai generate v0.1.0 v0.2.0 -o CHANGELOG.md

# Include commit author
changelog-ai generate v0.1.0 HEAD --author --scope
```

## Commit Types

The tool recognizes all [Conventional Commits](https://www.conventionalcommits.org/) v1.0 types:

| Type       | Section    | Severity |
|------------|------------|----------|
| `feat`     | Added      | Minor    |
| `fix`      | Fixed      | Patch    |
| `perf`     | Changed    | Minor    |
| `refactor` | Changed    | Patch    |
| `docs`     | Changed    | Patch    |
| `test`     | Other      | Patch    |
| `chore`    | Other      | Patch    |

### Breaking Changes

Detected automatically from:

- `feat!:` or `fix!:` (the `!` suffix)
- Any type with `!` prefix: `refactor!:`
- Footer containing `BREAKING CHANGE:`

## Development

```bash
# Run all checks
npm run typecheck    # TypeScript type validation
npm run lint         # ESLint code quality
npm test             # Unit tests with Vitest
npm run build        # Compile TypeScript to dist/
```

## Project Structure

```
src/
  git.ts        — Git log extraction (git log, tag listing)
  classifier.ts — Commit classification (type, severity, breaking)
  template.ts   — Changelog generation (Keep a Changelog format)
  cli.ts        — Commander.js CLI interface

tests/
  git.test.ts        — 2 tests (tag listing)
  classifier.test.ts — 14 tests (commit classification)
  template.test.ts   — 6 tests (changelog generation)

docs/
  EXAMPLES.md — Usage examples and advanced scenarios
  SETUP.md    — Installation and contribution guide
```

## Architecture

changelog-ai uses a two-layer classification strategy:

1. **Heuristics (V1, MVP)** — Deterministic rules from Conventional Commits format and BREAKING CHANGE detection. Fast, offline, zero cost.
2. **LLM Layer (V2, planned)** — Optional refinement for ambiguous commits using local or third-party LLMs. Activated via flag.

The CLI is intentionally simple: it reads git history, classifies commits, and renders a template. No database, no network calls, no external state.

## Roadmap

| Version | Goal |
|---------|------|
| **V1**  | MVP: Heuristics + template + CLI (current) |
| **V2**  | LLM layer for ambiguous commits, GitHub Action, PR comment |
| **V3**  | SaaS: hosted changelogs with subscription notifications |

## License

MIT — see [PROJECT.md](PROJECT.md) for full product specification.