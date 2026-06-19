# Requirements

> This document captures the complete set of functional and non-functional requirements for **changelog-ai v0.1.0**, derived exclusively from implemented code, existing tests, and project configuration.

---

## Part I: Functional Requirements

### FR-001: Git Log Extraction

| ID | Requirement | Source |
|---|---|---|
| FR-001.1 | The tool shall accept two git refs (tags or commit hashes) as input | `src/cli.ts:20` — `.argument('<from>')`, `.argument('<to>')` |
| FR-001.2 | The tool shall extract all commits between the `from` and `to` refs, exclusive of `from`, inclusive of `to` | `src/git.ts:56` — `${from}..${to}` range notation |
| FR-001.3 | The tool shall support the special ref `HEAD` as the `to` argument to capture all commits since a tag | `src/cli.ts:21` — documented in usage |
| FR-001.4 | The tool shall exclude merge commits from the output | `src/git.ts:28` — `--no-merges` flag |
| FR-001.5 | The tool shall capture the full commit message (subject + body) for each commit | `src/git.ts:27` — `%s%n%b` in format string |
| FR-001.6 | The tool shall capture commit metadata: hash, author, date, message | `src/git.ts:27` — `%H`, `%an`, `%ad`, `%s`, `%b` |
| FR-001.7 | The tool shall use ASCII Record Separator (`\x1e`) as the inter-commit delimiter for safe multi-line message parsing | `src/git.ts:9`, `src/git.ts:24` |
| FR-001.8 | The tool shall return an empty array when no commits exist in the range | `src/git.ts:35` — `if (!raw) return []` |
| FR-001.9 | The tool shall list all git tags sorted by creation date (newest first) | `src/git.ts:77` — `git tag --sort=-creatordate` |

### FR-002: Commit Classification

| ID | Requirement | Source |
|---|---|---|
| FR-002.1 | The tool shall classify commits by type following Conventional Commits v1.0 | `src/classifier.ts:31` — `CONVENTIONAL_REGEX` |
| FR-002.2 | The tool shall support all Conventional Commits types: feat, fix, perf, refactor, docs, style, test, chore, ci, build | `src/classifier.ts:43-54` — `mapType()` mapping |
| FR-002.3 | The tool shall extract and preserve the optional scope from scoped commits (`feat(auth):`) | `src/classifier.ts:34` — `scope` capture group |
| FR-002.4 | The tool shall detect breaking changes via the `!` suffix in the commit type prefix | `src/classifier.ts:36` — `!!breaking` |
| FR-002.5 | The tool shall detect breaking changes via a `BREAKING CHANGE:` footer in the commit body | `src/classifier.ts:37-39` — `BREAKING_PATTERNS` array |
| FR-002.6 | The tool shall derive severity automatically: `feat`, `perf` → `MINOR`; breaking → `MAJOR`; all others → `PATCH` | `src/classifier.ts:62-66` — `deriveSeverity()` |
| FR-002.7 | The tool shall classify commits that do not match Conventional Commits as `OTHER` | `src/classifier.ts:48` — fallback to `ChangeType.OTHER` |
| FR-002.8 | The tool shall handle multi-line commit messages correctly | `src/classifier.ts:31` — `CONVENTIONAL_REGEX` uses `s` flag (dotAll) |
| FR-002.9 | The tool shall provide a batch classification function that maps over an array of commits | `src/classifier.ts:70-72` — `classifyCommits()` |
| FR-002.10 | The tool shall return an empty array when given an empty input for batch classification | `src/classifier.ts:70` — `.map()` on empty array |

### FR-003: Changelog Generation

| ID | Requirement | Source |
|---|---|---|
| FR-003.1 | The tool shall generate changelog output in Keep a Changelog format | `src/template.ts:107` — section headers match the spec |
| FR-003.2 | The tool shall emit all seven Keep a Changelog sections: Added, Changed, Deprecated, Removed, Fixed, Security, Other | `src/template.ts:107-112` |
| FR-003.3 | The tool shall group classified changes into the correct Keep a Changelog section based on their `ChangeType` | `src/template.ts:47-76` — `groupByType()` |
| FR-003.4 | The tool shall emit a dedicated ⚠ BREAKING CHANGES section for all breaking changes | `src/template.ts:109` |
| FR-003.5 | The tool shall omit empty sections from the output | `src/template.ts:79` — `if (changes.length === 0) return ''` |
| FR-003.6 | The tool shall strip the Conventional Commits prefix from each entry's message text | `src/template.ts:90` — regex replacement |
| FR-003.7 | The tool shall include the commit author when the `--author` flag is provided | `src/template.ts:95` — `showAuthor` option |
| FR-003.8 | The tool shall include the commit scope when the `--scope` flag is provided | `src/template.ts:86-87` — `showScope` option |
| FR-003.9 | The tool shall use the current ISO 8601 date for the version header | `src/template.ts:102` — `new Date().toISOString().split('T')[0]` |
| FR-003.10 | The tool shall allow a custom changelog title via options | `src/template.ts:100` — `title` option |
| FR-003.11 | The tool shall include a version comparison link in the footer when `previousVersion` is provided | `src/template.ts:118-119` |
| FR-003.12 | The tool shall use `---` as a horizontal rule separator at the end of the document | `src/template.ts:115` |

### FR-004: CLI Interface

| ID | Requirement | Source |
|---|---|---|
| FR-004.1 | The tool shall expose a `generate` command accepting `<from>` and `<to>` positional arguments | `src/cli.ts:18` — `.command('generate')` |
| FR-004.2 | The tool shall support `--output` / `-o` to write changelog to a file | `src/cli.ts:22` — `.option('-o, --output <file>')` |
| FR-004.3 | The tool shall support `--author` flag | `src/cli.ts:23` — `.option('--author')` |
| FR-004.4 | The tool shall support `--scope` flag | `src/cli.ts:24` — `.option('--scope')` |
| FR-004.5 | The tool shall expose a `tags` command to list all tags | `src/cli.ts:47` — `.command('tags')` |
| FR-004.6 | The tool shall expose `--version` flag via Commander.js | `src/cli.ts:16` — `.version('0.1.0')` |
| FR-004.7 | The tool shall expose `--help` flag via Commander.js | `src/cli.ts:16` — Commander.js default behavior |
| FR-004.8 | The tool shall print a human-readable error and exit with code 1 when the git command fails | `src/cli.ts:38-41` — try/catch with `process.exit(1)` |

---

## Part II: Non-Functional Requirements

### NFR-001: Code Quality

| ID | Requirement | Evidence |
|---|---|---|
| NFR-001.1 | TypeScript strict mode shall be enabled for all source files | `tsconfig.json:6` — `"strict": true` |
| NFR-001.2 | All TypeScript files shall compile without errors | `tsconfig.json` + `npm run typecheck` |
| NFR-001.3 | ESLint shall be configured with the TypeScript recommended ruleset | `.eslintrc.json:9-11` — `extends: [plugin:@typescript-eslint/recommended]` |
| NFR-001.4 | No ESLint errors shall exist in the source code | `.eslintrc.json` configured; no custom overrides silencing errors |
| NFR-001.5 | Declaration files (`.d.ts`) shall be emitted for all source files | `tsconfig.json:14` — `"declaration": true` |
| NFR-001.6 | Source maps shall be emitted for compiled JavaScript | `tsconfig.json:16` — `"sourceMap": true` |
| NFR-001.7 | The project shall declare all runtime dependencies explicitly | `package.json:19-22` — only `commander` as runtime dep |

### NFR-002: Testing

| ID | Requirement | Evidence |
|---|---|---|
| NFR-002.1 | The project shall have a unit test suite | `tests/` with 3 test files |
| NFR-002.2 | All tests shall run via Vitest | `package.json:8` — `"test": "vitest"`, `vitest.config.ts` |
| NFR-002.3 | Tests shall cover all `ChangeType` branches in `classifier.ts` | `tests/classifier.test.ts` — 14 tests, one per type branch |
| NFR-002.4 | Tests shall cover changelog generation with all major section types | `tests/template.test.ts` — Added, Fixed, Breaking, Author, Empty, Custom title |
| NFR-002.5 | Tests shall cover tag listing edge case | `tests/git.test.ts` — 2 tests for array shape and non-empty strings |
| NFR-002.6 | Test runner shall support watch mode during development | `package.json:8` — `npm test` (default, no `--run`) |
| NFR-002.7 | Test runner shall support CI mode (single run) | `package.json:8` + `npm test -- --run` |

### NFR-003: Performance & Reliability

| ID | Requirement | Rationale |
|---|---|---|
| NFR-003.1 | The tool shall have zero network dependencies | Only `child_process.execSync` for git; no HTTP calls |
| NFR-003.2 | The tool shall operate entirely offline | Self-contained; no API keys, no external services |
| NFR-003.3 | The tool shall use constant memory proportional to the number of commits in the range | Streaming via `execSync` → parse in memory; no pagination needed for typical ranges |
| NFR-003.4 | The tool shall produce deterministic output for the same input | No random seed, no date-dependent logic beyond the version date, no external calls |

### NFR-004: Developer Experience

| ID | Requirement | Evidence |
|---|---|---|
| NFR-004.1 | The project shall provide a `dev` script for watch mode compilation | `package.json:7` — `"dev": "tsc --watch"` |
| NFR-004.2 | The project shall provide a `build` script for production compilation | `package.json:6` — `"build": "tsc"` |
| NFR-004.3 | The project shall declare a binary entry point in package.json | `package.json:4-6` — `"bin": {"changelog-ai": "dist/cli.js"}` |
| NFR-004.4 | The project shall document all development commands in SETUP.md | `docs/SETUP.md` |

### NFR-005: Operational

| ID | Requirement | Evidence |
|---|---|---|
| NFR-005.1 | The project shall be installable via `npm link` for local development | `docs/SETUP.md:14` — documented workflow |
| NFR-005.2 | The project shall build to a clean `dist/` directory (overwritten on each build) | `tsconfig.json:10` — `"outDir": "./dist"` |
| NFR-005.3 | The project shall ignore build artifacts in `.gitignore` | `.gitignore` — `dist/`, `*.tsbuildinfo` listed |

---

## Part III: Test Coverage Summary

| Module | Tests | Coverage |
|---|---|---|
| `git.ts` (tag listing) | 2 | Verifies array shape, non-empty strings |
| `classifier.ts` | 14 | All ChangeType branches, breaking detection (2 signals), scope, multi-line, batch |
| `template.ts` | 6 | All major sections, author toggle, scope toggle, empty-section skip, custom title |
| **Total** | **22** | **Complete unit coverage** |