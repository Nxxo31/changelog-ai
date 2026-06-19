# Technical Design

> **changelog-ai** is built on a strict TypeScript foundation with deterministic heuristics. This document specifies the internal contracts, parsing strategy, and configuration surface available today.

---

## 1. Technology Stack

| Layer | Tool | Purpose | Version |
|---|---|---|---|
| **Language** | TypeScript | Type-safe source code | ^5.4.0 |
| **Compiler** | tsc | Transpilation to CommonJS | bundled with TS |
| **CLI Framework** | Commander.js | Argument parsing, help generation | ^12.0.0 |
| **Testing** | Vitest | Unit test runner | ^1.5.0 |
| **Linting** | ESLint + @typescript-eslint | Code quality & style | ^8.57.0 / ^7.0.0 |
| **Runtime** | Node.js | Execution environment | ≥18.0.0 |

**No external APIs, no LLMs, no databases.** The tool operates entirely offline against the local git repository.

---

## 2. Project Structure

```
changelog-ai/
├── src/                          # TypeScript source (compiled to dist/)
│   ├── git.ts                    # Git log extraction, tag listing
│   ├── classifier.ts             # Conventional Commits parser & severity mapper
│   ├── template.ts               # Keep a Changelog markdown renderer
│   └── cli.ts                    # Commander.js entry point
├── tests/                        # Vitest suite (22 assertions)
│   ├── git.test.ts               # Tag listing (2 tests)
│   ├── classifier.test.ts        # Commit classification (14 tests)
│   └── template.test.ts          # Changelog rendering (6 tests)
├── docs/                         # Documentation (this directory)
│   ├── ARCHITECT Soviet.md       # Architecture diagrams & decisions
│   ├── TECHNICAL_DESIGN.md       # This file
│   ├── REQUIREMENTS.md           # Functional & non-functional requirements
│   ├── OPERATIONS.md             # Build, test, release procedures
│   ├── EXAMPLES.md               # Usage scenarios & CI templates
│   └── SETUP.md                  # Developer onboarding guide
├── dist/                         # Compiled JavaScript + declarations (gitignored)
├── package.json                  # Manifest: single dependency (commander)
├── tsconfig.json                 # Strict mode, CommonJS, source maps, declarations
├── vitest.config.ts              # Test inclusion: tests/**/*.test.ts
├── .eslintrc.json                # TS-recommended ruleset
└── .gitignore                    # Excludes node_modules, dist, coverage, env files
```

---

## 3. Type System

### 3.1 CommitInfo (Data Transfer Object)

```typescript
export interface CommitInfo {
  hash: string;      // Full SHA-1 hash from %H
  author: string;     // Author name from %an
  date: string;       // Date in ISO 8601 (YYYY-MM-DD) from %ad
  message: string;    // Full commit message (subject + body)
}
```

- **Source:** `src/git.ts:4-9`
- **Created by:** `parseGitLog()` after splitting the raw git log string
- **Consumed by:** `classifier.ts` (every classification starts here)

### 3.2 ChangeType (Enumeration)

```typescript
export enum ChangeType {
  FEAT     = 'feat',     // New features  ──→ Added section
  FIX      = 'fix',      // Bug fixes     ──→ Fixed section
  PERF     = 'perf',     // Performance   ──→ Changed section
  REFACTOR = 'refactor', // Refactoring   ──→ Changed section
  DOCS     = 'docs',     // Documentation ──→ Changed section
  STYLE    = 'style',    // Code style    ──→ Changed section
  TEST     = 'test',     // Testing       ──→ Other section
  CHORE    = 'chore',    // Maintenance   ──→ Other section
  CI       = 'ci',       // CI changes    ──→ Other section
  BUILD    = 'build',    // Build system  ──→ Other section
  BREAKING = 'breaking', // Explicit BC   ──→ Breaking section
  OTHER    = 'other'     // Unknown       ──→ Other section
}
```

- **Source:** `src/classifier.ts:4-15`
- **Parsed from:** The first token before the colon in the Conventional Commits prefix

### 3.3 Severity (Enumeration)

```typescript
export enum Severity {
  MAJOR = 'major',  // Breaking changes
  MINOR = 'minor',  // Features, performance improvements
  PATCH = 'patch'   // Everything else (fixes, chores, etc.)
}
```

- **Source:** `src/classifier.ts:17-21`
- **Derivation rule:**
  - `isBreaking = true` → `MAJOR`
  - `type ∈ {feat, perf}` → `MINOR`
  - Otherwise → `PATCH`

### 3.4 ClassifiedChange (Rich Domain Object)

```typescript
export interface ClassifiedChange {
  commit: CommitInfo;       // Original raw data
  type: ChangeType;          // Mapped from commit message prefix
  severity: Severity;        // Derived severity
  isBreaking: boolean;       // Detected via ! or BREAKING CHANGE footer
  scope?: string;           // Optional scope from parentheses
}
```

- **Source:** `src/classifier.ts:23-30`
- **Produced by:** `classifyCommit()`
- **Consumed by:** `generateChangelog()` via `ClassifiedChange[]`

### 3.5 ChangelogOptions (Configuration Surface)

```typescript
export interface ChangelogOptions {
  title?: string;        // Default: "Changelog"
  description?: string;  // Optional header text
  showAuthor?: boolean;  // Append "(by Author)" to each entry
  showScope?: boolean;   // Prefix with "**scope:**"
  dateFormat?: string;   // Reserved for future use (currently ISO 8601)
}
```

- **Source:** `src/template.ts:4-10`
- **Populated from:** CLI flags `--author`, `--scope`

---

## 4. Parsing Strategy

### 4.1 Git Log Format String

The tool constructs the following format for `git log`:

```
%x1e%H¹%an¹%ad¹%s%n%b
```

| Token | Git Directive | Meaning |
|---|---|---|
| `%x1e` | Record Sep | ASCII `0x1E` between commits |
| `%H` | Hash | Full commit SHA-1 |
| `%an` | Author | Commit author name |
| `%ad` | Date | Author date (respects `--date=short`) |
| `%s` | Subject | First line of commit message |
| `%n%b` | Body | Newline + body paragraphs |

**Why `¹` (superscript 1)?** It serves as a field delimiter within a single record. The record itself is delimited by `\x1e`. This 2-level delimiter approach prevents collisions without needing a CSV-style quote/escape strategy.

### 4.2 Conventional Commit RegExp

```typescript
const CONVENTIONAL_REGEX = /^(?<type>\w+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:(?<description>.+)/s;
```

| Capture | is Optional | Description |
|---|---|---|
| `type` | No | The commit type (feat, fix, chore, etc.) |
| `scope` | Yes | Parenthesized scope: `feat(auth)` |
| `breaking` | Yes | The `!` flag before the colon |
| `description` | No | Everything after the colon and space |

### 4.3 Breaking Change Detection

Two independent signals are evaluated:

1. **Prefix signal:** `type?` contains `!`. Example: `feat!: ...`
2. **Footer signal:** The full commit message (subject + body) matches `/BREAKING\s*CHANGE/i`

Either signal being true sets `isBreaking = true` and forces `Severity.MAJOR`.

---

## 5. Configuration

### 5.1 No Environment Variables (V1)

The V1 release uses zero environment variables. All behavior is controlled through CLI arguments.

### 5.2 CLI Options

| Flag | Short | Type | Default | Description |
|---|---|---|---|---|
| `--output` | `-o` | `string` | `undefined` | Write to file instead of stdout |
| `--author` | — | `boolean` | `false` | Include commit author name |
| `--scope` | — | `boolean` | `false` | Include commit scope prefix |

### 5.3 Future Configuration (V2)

The interface `ChangelogOptions` has a `dateFormat` field reserved for future date formatting without changing the public API.

---

## 6. Build & Compilation

### 6.1 TypeScript Configuration

Source: `tsconfig.json`

| Option | Value | Purpose |
|---|---|---|
| `target` | `ES2022` | Modern JS features, no polyfills needed for Node ≥18 |
| `module` | `commonjs` | Node.js native module system |
| `strict` | `true` | Full type safety (noImplicitAny, strictNullChecks, etc.) |
| `declaration` | `true` | Emits `.d.ts` files for consumers |
| `declarationMap` | `true` | Source maps for `.d.ts` files |
| `sourceMap` | `true` | Source maps for compiled `.js` (debugging) |
| `rootDir` | `./src` | Source root (prevents accidental imports from outside) |
| `outDir` | `./dist` | Compiled output directory |

### 6.2 Output Artifacts

For each `.ts` file in `src/`, `tsc` emits:

```
dist/
├── git.js
├── git.js.map
├── git.d.ts
├── git.d.ts.map
├── classifier.js
├── classifier.js.map
├── classifier.d.ts
├── classifier.d.ts.map
├── template.js
├── template.js.map
├── template.d.ts
├── template.d.ts.map
├── cli.js
├── cli.js.map
├── cli.d.ts
└── cli.d.ts.map
```esso

**Entry point:** `dist/cli.js` (declared in `package.json:bin`)

---

## 7. Quality Gates

All three gates must pass before any code is considered ready:

```bash
npm run typecheck    # tsc --noEmit  → catch type errors
npm run lint         # eslint src/   → catch style/quality issues
npm test -- --run    # vitest once   → catch regressions
```

These are enforced by the pre-commit checklist in `CONTRIBUTING.md` and are required for pull request acceptance.

---

## 8. Extensibility Points

While the current release is intentionally minimal, the codebase has been structured to allow the following future enhancements without breaking existing APIs:

| Enhancement | Integration Point | Current State |
|---|---|---|
| LLM-based classification | New `src/llm.ts` module; call from `classifier.ts` as fallback when heuristic confidence is low | Not implemented |
| Custom templates | Extend `ChangelogOptions` with `templatePath?: string`; load Handlebars/EJS template | Not implemented |
| GitHub Action | Add `action.yml` in repo root; package as composite action using `dist/cli.js` | Not implemented |
| Plugin system | Expose `ChangelogPlugin` interface; apply transforms to `ClassifiedChange[]` before rendering | Not implemented |

These are architectural possibilities, not commitments. The current codebase does not contain any stubs, interfaces, or dead code for these features.

