# Setup Guide

This guide covers installation, development setup, and contribution workflow for changelog-ai.

## Requirements

- **Node.js** 18 or higher
- **npm** 9 or higher
- **Git** 2.30+ (for tag-based changelog generation)

Verify your versions:

```bash
node --version  # Should be v18+
npm --version   # Should be 9+
git --version   # Should be 2.30+
```

## Installation for Users

### Option 1: npm link (recommended for development)

```bash
git clone https://github.com/Nxxo31/changelog-ai.git
cd changelog-ai
npm install
npm run build
npm link

# Now available globally
changelog-ai --version
changelog-ai tags
```

### Option 2: Direct execution

```bash
git clone https://github.com/Nxxo31/changelog-ai.git
cd changelog-ai
npm install
npm run build

# Run directly
node dist/cli.js tags
node dist/cli.js generate v1.0.0 v1.1.0
```

### Option 3: npm package (future)

Once published to npm:

```bash
npm install -g changelog-ai
```

## Installation for Contributors

### 1. Fork and clone

```bash
# Fork via GitHub UI, then:
git clone https://github.com/YOUR_USERNAME/changelog-ai.git
cd changelog-ai
```

### 2. Install dependencies

```bash
npm install
```

This installs:
- **TypeScript** — Language and compiler
- **Commander** — CLI framework
- **Vitest** — Testing framework
- **ESLint** — Code linting (TypeScript plugin)
- **@types/node** — TypeScript definitions

### 3. Build

```bash
npm run build
```

Output goes to `dist/`. The CLI entry point is `dist/cli.js`.

### 4. Link for local testing

```bash
npm link
changelog-ai tags  # verify installation
```

## Development Commands

```bash
# TypeScript type checking
npm run typecheck

# ESLint code quality check
npm run lint

# Run tests (watch mode)
npm test

# Run tests once (CI mode)
npm test -- --run

# Build TypeScript
npm run build

# Watch mode (auto-rebuild on change)
npm run dev

# All checks (for pre-commit hook)
npm run typecheck && npm run lint && npm test
```

## Project Structure

```
changelog-ai/
├── src/
│   ├── git.ts        # Git log extraction via execSync
│   ├── classifier.ts # Conventional Commits parsing
│   ├── template.ts   # Keep a Changelog generation
│   └── cli.ts        # Commander.js CLI
├── tests/
│   ├── git.test.ts
│   ├── classifier.test.ts
│   └── template.test.ts
├── docs/
│   ├── EXAMPLES.md   # Usage examples and CI/CD templates
│   └── SETUP.md      # This file
├── PROJECT.md        # Product specification
├── README.md         # User-facing documentation
├── CONTRIBUTING.md  # Contribution guidelines
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .eslintrc.json
```

## Git Workflow

### Branch naming

```
feat/your-feature    # New features
fix/your-fix         # Bug fixes
docs/your-docs       # Documentation only
chore/your-task      # Maintenance tasks
```

### Pre-commit checklist

Before every commit, run:

```bash
npm run typecheck
npm run lint
npm test -- --run
```

All three must pass. No exceptions.

### Commit convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat(classifier): add support for WIP commits"
git commit -m "fix(git): handle empty tag list gracefully"
git commit -m "docs: update CI/CD examples"
```

### Release process

```bash
# 1. Update version in package.json
# 2. Commit
git add -A
git commit -m "chore(release): v1.1.0"

# 3. Create tag
git tag v1.1.0

# 4. Push everything
git push && git push --tags

# 5. Generate changelog for the release
changelog-ai generate v1.0.0 v1.1.0 -o CHANGELOG.md
```

## Environment

No environment variables are required. The CLI operates entirely offline using local git history.

Optional future variables (V2):

```bash
# Optional: LLM provider for V2 ambiguous commit classification
OPENAI_API_KEY=sk-...        # OpenAI (optional, not required)
OLLAMA_URL=http://localhost:11434  # Local Ollama (optional, not required)
```

## Troubleshooting Setup

### Permission denied running `changelog-ai`

```bash
npm link
# If still failing:
chmod +x dist/cli.js
```

### TypeScript errors on `npm install`

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### ESLint not found

```bash
npm install
npm run lint
```

### Tests fail with "Cannot find module"

```bash
npm run build
npm test
```