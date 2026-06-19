# Operations

> Day-to-day procedures for building, testing, and releasing changelog-ai. This document is the single source of truth for operational commands.

---

## 1. Supported Commands

All commands run from the repository root.

### 1.1 CLI Commands (end users)

```bash
# List available tags (newest first)
changelog-ai tags

# Generate changelog between two tags
changelog-ai generate <from> <to>

# Generate from tag to latest commit
changelog-ai generate v1.0.0 HEAD

# Save to file instead of stdout
changelog-ai generate <from> <to> -o CHANGELOG.md
changelog-ai generate <from> <to> --output CHANGELOG.md

# Include commit author in each entry
changelog-ai generate <from> <to> --author

# Include commit scope in each entry
changelog-ai generate <from> <to> --scope

# Combine flags
changelog-ai generate v1.0.0 HEAD --author --scope -o RELEASE.md

# Show CLI help
changelog-ai --help

# Show version
changelog-ai --version
```

### 1.2 Development Commands

```bash
# Install dependencies (after clone or package changes)
npm install

# Type-check all TypeScript files (no emit)
npm run typecheck

# Run ESLint on src/
npm run lint

# Run unit tests (watch mode)
npm test

# Run unit tests once (CI mode)
npm test -- --run

# Compile TypeScript to dist/
npm run build

# Watch mode (auto-recompile on save)
npm run dev

# Full pre-commit check (all three gates)
npm run typecheck && npm run lint && npm test -- --run

# Full check with build
npm run typecheck && npm run lint && npm test -- --run && npm run build
```

---

## 2. Build Pipeline

### 2.1 Build Flow

```m
flowchart LR
    A[src/*.ts\nTypeScript Source] -->|tsc| B[dist/*.js\nCommonJS Output]
    A -->|tsc| C[dist/*.d.ts\nDeclarations]
    A -->|tsc| D[dist/*.js.map\nSource Maps]
    B --> E[package.json:bin\nEntry Point]
    E --> F[changelog-ai command\nAvailable globally]
```

### 2.2 Build Behavior

- **Clean build:** `dist/` is overwritten entirely on every run. No incremental artifacts are preserved between builds.
- **Declaration files:** Each `.ts` file produces a `.d.ts` and `.d.ts.map`, enabling type-safe imports from external consumers.
- **Source maps:** `*.js.map` files map compiled JS back to TypeScript for debugging.
- **Output format:** `commonjs` (compatible with Node.js `require()`).
- **Target:** `ES2022` (compatible with Node.js 18+, no need for transpilation or polyfills).

### 2.3 Local Installation for Testing

```bash
# After building, link globally:
npm link

# Verify:
changelog-ai --version
changelog-ai tags

# Remove global link:
npm unlink
```

---

## 3. Test Pipeline

### 3.1 Test Flow

```m
flowchart TD
    A[tests/*.test.ts] --> B[Vitest Runner]
    B -->|in source files| C[src/git.ts]
    B -->|in source files| D[src/classifier.ts]
    B -->|in source files| E[src/template.ts]
    B --> F[Test Results\nstdout]
```

### 3.2 Running Tests

| Command | Mode | Use Case |
|---|---|---|
| `npm test` | Watch | Active development with TDD |
| `npm test -- --run` | Single run | CI/CD pipelines, pre-commit |
| `npm test -- --coverage` | With coverage | Manual coverage review |
| `npm test -- src/cli.test.ts` | Filtered | Run specific test file |

### 3.3 Test Environment

- **Framework:** Vitest (Vite-powered test runner)
- **Globals:** Enabled (`describe`, `it`, `expect` available globally)
- **Test files:** Located in `tests/**/*.test.ts` (configured in `vitest.config.ts`)
- **Node environment:** `node` (not browser)

---

## 4. Release Process

### 4.1 Current Release Flow (Manual)

The release process is **fully manual** for v0.1.0. CI/CD pipelines are planned for V2.

```bash
# 1. Ensure a clean state
git status
git checkout main

# 2. Run full quality gates
npm run typecheck && npm run lint && npm test -- --run && npm run build

# 3. Update version in package.json and VERSION file
#    Edit "version": "0.x.0" in package.json
#    Edit the version in VERSION file

# 4. Commit the release
git add -A
git commit -m "chore(release): v0.x.0"

# 5. Create annotated tag
git tag -a v0.x.0 -m "Release v0.x.0"

# 6. Push everything
git push && git push --tags

# 7. Generate and attach the changelog
changelog-ai generate <previous-tag> v0.x.0 -o CHANGELOG.md
```

### 4.2 Release Commands Reference

| Step | Command | Notes |
|---|---|---|
| List tags | `changelog-ai tags` | Use before creating new tag |
| Find previous tag | `git describe --tags --abbrev=0 HEAD^` | Find tag before the one being created |
| Generate changelog | `changelog-ai generate <from> <to> -o CHANGELOG.md` | From previous tag to new tag |
| Verify build | `node dist/cli.js tags` | Run the compiled binary directly |
| Link globally | `npm link` | After build, for local testing |

---

## 5. Development Workflow

### 5.1 Pre-commit Checklist

```bash
npm run typecheck && npm run lint && npm test -- --run
```

All three must pass. No exceptions.

### 5.2 Branch Naming Convention

| Prefix | Purpose |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `chore/` | Maintenance, dependencies |
| `refactor/` | Code restructuring without behavior change |

### 5.3 Commit Convention

Follow [Conventional Commits](https://conventionalcommits.org/):

```bash
git commit -m "feat(classifier): add BREAKING CHANGE footer detection"
git commit -m "fix(template): remove duplicate section on empty changes"
git commit -m "docs: update README with new flags"
git commit -m "chore: bump vitest to ^1.5.0"
```

### 5.4 Working Directory Requirements

- **Git history:** `getCommitsBetweenTags()` requires `fetch-depth: 0` when running in CI, otherwise tags may not be reachable.
- **Node version:** Enforce ≥18.0.0 in CI (`actions/setup-node@v4` with `node-version: '20'` recommended).
- **Working directory:** The CLI runs `git` from `process.cwd()` by default. Pass an explicit `cwd` argument to override.

---

## 6. CI/CD Status

> **Note:** CI/CD workflows are currently **not present** (`.github/workflows/` contains only a `.gitkeep`). The following is the target state for V2.

### 6.1 Planned CI Workflow

```yaml
# .github/workflows/ci.yml (planned for V2)
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for tag-based changelog generation

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test -- --run
      - run: npm run build
```

### 6.2 Release Workflow (Planned for V2)

```yaml
# .github/workflows/release.yml (planned for V2)
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci && npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 7. Environment Variables

| Variable | Required | Description |
|---|---|---|
| None | — | V1 operates entirely offline with zero environment variables |

No API keys, no tokens, no external configuration is required for V1.

---

## 8. Troubleshooting

### Build fails with "Cannot find module"

```bash
npm run build
npm test
```

The test runner imports from `dist/` (not `src/`), so compilation must precede testing.

### `changelog-ai: command not found` after npm link

```bash
npm link
# If still failing:
chmod +x dist/cli.js
```

### Tags not found in CI

```bash
# Ensure full history is fetched:
git fetch --tags --unshallow
# Or in checkout:
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

### Tests pass locally but fail in CI

```bash
# Run once in CI mode:
npm test -- --run

# Check Node version matches:
node --version  # Should be ≥18.0.0
```

### ESLint errors after merge

```bash
npm run lint
# Auto-fix safe issues:
npm run lint -- --fix
```

ESLint will report remaining errors that require manual fixes.