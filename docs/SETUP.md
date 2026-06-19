# Setup Guide

> Developer onboarding and installation guide for changelog-ai.

---

## Requirements

| Tool | Minimum Version | Verify |
|---|---|---|
| Node.js | 18.0.0 | `node --version` |
| npm | 9.0.0 | `npm --version` |
| Git | 2.30.0 | `git --version` |

Recommended: Node.js 20 LTS for best compatibility.

---

## Installation for Users

### Option 1: npm link (recommended)

```bash
git clone https://github.com/Nxxo31/changelog-ai.git
cd changelog-ai
npm install
npm run build
npm link

# Verify
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

---

## Installation for Contributors

### 1. Fork and clone

```bash
git clone https://github.com/YOUR_USERNAME/changelog-ai.git
cd changelog-ai
```

### 2. Install dependencies

```bash
npm install
```

Dependencies installed:

| Package | Role |
|---|---|
| `typescript` | Language and compiler |
| `commander` | CLI argument parsing |
| `vitest` | Test runner |
| `eslint` | Code linting |
| `@typescript-eslint/*` | TypeScript ESLint plugin |
| `@types/node` | TypeScript definitions for Node.js |

### 3. Build

```bash
npm run build
```

Output is written to `dist/`. The CLI entry point is `dist/cli.js`.

### 4. Link for local testing

```bash
npm link
changelog-ai tags  # verify installation
```

To remove the global link:

```bash
npm unlink
```

---

## Command Reference

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run dev` | Watch mode (auto-recompile on save) |
| `npm run typecheck` | TypeScript type validation only |
| `npm run lint` | ESLint on `src/` |
| `npm test` | Run tests in watch mode |
| `npm test -- --run` | Run tests once (CI mode) |
| `changelog-ai generate <from> <to>` | Generate changelog between two refs |
| `changelog-ai tags` | List all tags |
| `changelog-ai --help` | Show CLI help |
| `changelog-ai --version` | Show version |

---

## Project Structure

```
changelog-ai/
├── src/
│   ├── git.ts        # Git log extraction via execSync
│   ├── classifier.ts # Conventional Commits parsing & severity
│   ├── template.ts   # Keep a Changelog rendering
│   └── cli.ts        # Commander.js CLI
├── tests/
│   ├── git.test.ts        # 2 tests (tag listing)
│   ├── classifier.test.ts # 14 tests (classification)
│   └── template.test.ts   # 6 tests (changelog generation)
├── docs/
│   ├── ARCHITECTURE.md    # Architecture diagrams
│   ├── TECHNICAL_DESIGN.md# Type system & parsing
│   ├── REQUIREMENTS.md    # Requirements
│   ├── OPERATIONS.md      # Build & release procedures
│   ├── EXAMPLES.md        # Usage examples
│   └── SETUP.md           # This file
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .eslintrc.json
```

---

## Git Workflow

### Branch naming

| Prefix | Use case |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `chore/` | Maintenance |
| `refactor/` | Code restructuring |

### Pre-commit checklist

Before every commit, run all three quality gates:

```bash
npm run typecheck && npm run lint && npm test -- --run
```

All three must pass. No exceptions.

### Commit convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat(classifier): add BREAKING CHANGE footer detection"
git commit -m "fix(git): handle empty tag list gracefully"
git commit -m "docs: update CI/CD examples"
```

---

## Release Process

```bash
# 1. Run full quality gates
npm run typecheck && npm run lint && npm test -- --run && npm run build

# 2. Update version in package.json and VERSION file

# 3. Commit
git add -A
git commit -m "chore(release): v1.1.0"

# 4. Tag
git tag v1.1.0

# 5. Push
git push && git push --tags

# 6. Generate release changelog
changelog-ai generate v1.0.0 v1.1.0 -o CHANGELOG.md
```

---

## Environment

No environment variables are required. The CLI operates entirely offline using local git history.

---

## Troubleshooting

### Permission denied running `changelog-ai`

```bash
chmod +x dist/cli.js
npm link
```

### TypeScript errors after npm install

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Cannot find module '../dist/cli'

```bash
# The test runner imports from dist/, so build first:
npm run build
npm test
```

### ESLint not found

```bash
npm install
npm run lint
```

### Tests fail in CI but pass locally

```bash
# Run in CI mode (single run):
npm test -- --run

# Verify Node version:
node --version  # Must be ≥18.0.0
```

### Tag not found error

```bash
# Verify the tag exists:
changelog-ai tags
# or
git tag -l
```

### No commits found between tags

```bash
# Verify commits exist in range:
git log v1.0.0..v1.1.0 --oneline

# In CI, ensure full history is fetched:
# In .github/workflows:
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

### Merge commits in output

The tool already excludes merge commits by default (`--no-merges` in `src/git.ts`). This behavior cannot be changed via CLI flags in V1 — modifying the source to remove `--no-merges` would require editing `src/git.ts`, which is not recommended unless you understand the implications.

Instead, use a custom git alias for merge-inclusive output:

```bash
# Create a local git alias
git config alias.log-no-filter --no-merges

# Or generate directly with git log piped to a file
git log v1.0.0..v1.1.0 --oneline > /tmp/commits.txt
```