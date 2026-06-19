# Changelog AI

> Generate beautiful release notes from your git history — automatically.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![ESLint](https://img.shields.io/badge/ESLint-TypeScript-8080f2?logo=eslint&logoColor=white)](.eslintrc.json)
[![Vitest](https://img.shields.io/badge/Vitest-22%20tests-6e9f18?logo=vitest&logoColor=white)](tests/)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A518.0.0-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**changelog-ai** analyzes your git commits between two tags (or commits) and generates a changelog in the [Keep a Changelog](https://keepachangelog.com/) format. It classifies commits using [Conventional Commits](https://www.conventionalcommits.org/) conventions and detects breaking changes — no LLM, no external API, no paid dependencies.

Built for developer teams who want meaningful release notes without the manual effort.

---

## Features

- **Zero external dependencies** — runs entirely offline using git history
- **Conventional Commits parsing** with full type support
- **Breaking change detection** via `!` suffix or `BREAKING CHANGE:` footer
- **Keep a Changelog** format output (user-friendly and machine-readable)
- **Flexible output** — stdout or file, with optional author and scope metadata
- **TypeScript** with strict mode, full type safety, and 22 unit tests
- **MIT license** — free for personal and commercial use

---

## Quick Start

```bash
# Clone and build
git clone https://github.com/Nxxo31/changelog-ai.git
cd changelog-ai
npm install
npm run build
npm link

# List available tags
changelog-ai tags

# Generate changelog between two tags
changelog-ai generate v1.0.0 v1.1.0

# Generate from tag to HEAD
changelog-ai generate v1.0.0 HEAD

# Save to file
changelog-ai generate v0.1.0 v0.2.0 -o CHANGELOG.md

# Include author and scope metadata
changelog-ai generate v0.1.0 HEAD --author --scope
```

Or run directly with `node dist/cli.js generate <from> <to>`.

---

## CLI Reference

```bash
# Generate changelog
changelog-ai generate <from> <to> [-o <file>] [--author] [--scope]

# List all tags (newest first)
changelog-ai tags

# Help
changelog-ai --help

# Version
changelog-ai --version
```

| Flag | Description |
|---|---|
| `-o, --output <file>` | Write output to file instead of stdout |
| `--author` | Append the commit author to each changelog entry |
| `--scope` | Include the Conventional Commits scope in each entry |

---

## Commit Types

The tool recognizes all [Conventional Commits](https://www.conventionalcommits.org/) v1.0 types:

| Type | Changelog Section | Severity |
|---|---|---|
| `feat` | Added | Minor |
| `fix` | Fixed | Patch |
| `perf` | Changed | Minor |
| `refactor` | Changed | Patch |
| `docs` | Changed | Patch |
| `test` | Other | Patch |
| `chore` | Other | Patch |

### Breaking Changes

Detected automatically from:

- `feat!:` or `fix!:` (the `!` suffix) → `feat!:`, `fix!:`, `refactor!:`, etc.
- Footer containing `BREAKING CHANGE:` (in the commit body)

---

## Architecture

```mermaid
flowchart TD
    A([User]) -->|changelog-ai generate <from> <to>| B[cli.ts\nCommander.js]
    B -->|getCommitsBetweenTags()| C[git.ts\nGit Extractor]
    C -->|CommitInfo[]| D[classifier.ts\nRules Engine]
    D -->|ClassifiedChange[]| E[template.ts\nRenderer]
    E -->|markdown| B
    B -->|stdout or file| F([Output])
```

- **`src/git.ts`** — executes `git log` and parses output into typed `CommitInfo` objects
- **`src/classifier.ts`** — applies Conventional Commits rules to classify type, severity, scope, and breaking changes
- **`src/template.ts`** — groups classified changes into Keep a Changelog sections and renders markdown
- **`src/cli.ts`** — orchestrates the pipeline and exposes the user-facing CLI interface

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the complete component map, interaction diagrams, and design decisions.

---

## Development Commands

```bash
npm run typecheck   # TypeScript type validation
npm run lint         # ESLint code quality
npm test             # Unit tests (watch mode)
npm test -- --run   # Unit tests (single run, CI mode)
npm run build        # Compile TypeScript to dist/
npm run dev          # Watch mode compilation
```

All three quality gates (`typecheck`, `lint`, `test`) must pass before any commit.

---

## Project Structure

```
changelog-ai/
├── src/
│   ├── git.ts        # Git log extraction (git log, tag listing)
│   ├── classifier.ts # Commit classification (type, severity, breaking)
│   ├── template.ts   # Changelog generation (Keep a Changelog format)
│   └── cli.ts        # Commander.js CLI interface
├── tests/
│   ├── git.test.ts        # 2 tests (tag listing)
│   ├── classifier.test.ts # 14 tests (commit classification)
│   └── template.test.ts   # 6 tests (changelog generation)
├── docs/
│   ├── ARCHITECTURE.md    # Architecture diagrams & design decisions
│   ├── TECHNICAL_DESIGN.md# Type system, parsing, build configuration
│   ├── REQUIREMENTS.md    # Functional & non-functional requirements
│   ├── OPERATIONS.md       # Build, test, release procedures
│   ├── EXAMPLES.md        # Usage examples and CI/CD templates
│   └── SETUP.md           # Installation and contribution guide
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .eslintrc.json
```

---

## Documentation

| Document | Purpose |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System diagrams, module responsibilities, design decisions |
| [TECHNICAL_DESIGN.md](docs/TECHNICAL_DESIGN.md) | Type system, interfaces, parsing strategy, build config |
| [REQUIREMENTS.md](docs/REQUIREMENTS.md) | Functional & non-functional requirements with code evidence |
| [OPERATIONS.md](docs/OPERATIONS.md) | Build, test, and release procedures |
| [EXAMPLES.md](docs/EXAMPLES.md) | Usage scenarios and CI/CD integration templates |
| [SETUP.md](docs/SETUP.md) | Installation and developer onboarding |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [PROJECT.md](PROJECT.md) | Product specification and roadmap |

---

## License

MIT — see [PROJECT.md](PROJECT.md) for full product specification.