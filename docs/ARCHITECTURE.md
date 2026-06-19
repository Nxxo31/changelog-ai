# Architecture

> **changelog-ai** follows a strict layered architecture where each module has a single, well-defined responsibility. The design prioritizes deterministic behavior, zero external dependencies, and full testability.

---

## System Overview

The application is a command-line tool that consumes git history and produces a changelog in the [Keep a Changelog](https://keepachangelog.com/) format. It consists of four core layers:

1. **Presentation (CLI)** — parses user input and presents output
2. **Domain (Classifier)** — applies semantic rules to commits
3. **Data (Git)** — extracts raw commit history from the local git repository
4 Loosely coupled through pure functions and explicit interfaces

```m
flowchart TD
    A([User CLI Invocation]) --> B[CLI Parser\nCommander.js]
    B --> C[Git Extractor\nsrc/git.ts]
    C --> D[Raw Commits]
    D --> E[Classifier Engine\nsrc/classifier.ts]
    E --> F[Classified Changes]
    F --> G[Template Renderer\nsrc/template.ts]
    G --> H{Output?}
    H -->|stdout| I[Terminal]
    H -->|file| J[CHANGELOG.md]
```

---

## Component Map

| Module | File | Responsibility | Lines |
|---|---|---|---|
| **CLI** | `src/cli.ts` | Parse arguments, delegate to domain, route output | ~60 |
| **Git** | `src/git.ts` | Execute git commands, parse raw log output into typed objects | ~90 |
| **Classifier** | `src/classifier.ts` | Identify commit type, severity, scope, and breaking changes | ~90 |
| **Template** | `src/template.ts` | Group classified changes into Keep a Changelog format | ~110 |

---

## Data Flow

```m
flowchart LR
    A(git log --pretty=format) -->|raw string| B(parseGitLog)
    B -->|CommitInfo[]| C(classifyCommit)
    C -->|ClassifiedChange[]| D(generateChangelog)
    D -->|markdown string| E[stdout / file]
```

### Step-by-step

1. **Extraction** — `git.ts` runs `git log` with a custom `--pretty=format:` using an ASCII Record Separator (`\x1e`) to safely delimit multi-line commit messages. No parsing libraries; pure string manipulation.
2. **Classification** — `classifier.ts` matches the commit message against a RegExp for Conventional Commits (`^(?<type>\w+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:(?<description>.+)`). It derives the `ChangeType`, `Severity`, and `isBreaking` flag. Breaking changes are detected via `!` prefix **or** `BREAKING CHANGE:` in the footer.
3. **Rendering** — `template.ts` groups `ClassifiedChange[]` into sections (`Added`, `Fixed`, `Changed`, etc.) and renders them into a markdown string following the Keep a Changelog spec.
4. **Output** — `cli.ts` either writes the string to `process.stdout` or to a file via `fs.writeFileSync`.

---

## Module Interaction

```m
flowchart TD
    subgraph CLI_Layer["Presentation Layer"]
        CLI["cli.ts<br/>Commander.js"]
    end

    subgraph Domain_Layer["Domain Layer"]
        CLF["classifier.ts<br/>Rules Engine"]
        TPL["template.ts<br/>Renderer"]
    end

    subgraph Data_Layer["Data Layer"]
        GIT["git.ts<br/>Extractor"]
    end

    CLI -->|getCommitsBetweenTags()| GIT
    CLI -->|classifyCommits()| CLF
    GIT -->|CommitInfo[]| CLF
    CLF -->|ClassifiedChange[]| TPL
    TPL -->|markdown| CLI
```

**Key design principle:** The domain layer (`classifier.ts`, `template.ts`) is completely agnostic of the CLI and git. It operates on plain objects (`CommitInfo`, `ClassifiedChange`), making it trivial to unit-test without mocking `execSync` or file I/O.

---

## Key Design Decisions

### 1. ASCII Record Separator for Git Parsing

Problem: `git log` output usually has newlines between commits, but commit messages can contain newlines, making simple `split('\n')` unreliable.

Solution: The `--pretty=format:` string uses the ASCII Record Separator (`\x1e`, Unicode `0x1E`) between commits. This character is extremely unlikely to appear in a commit message, making the delimiter collision-free without complex escaping.

See: `src/git.ts:9` and `src/git.ts:24-30`

### 2. Empty Deprecated/Removed/Security Sections

The template always emits section headers for these categories even if empty. This is intentional—the Keep a Changelog spec encourages explicitly showing empty sections to signal they were considered. The sections render as empty, which is semantically correct.

### 3. Commander.js as the Only Runtime Dependency

The CLI surface is intentionally minimal (2 commands, 5 flags). Commander.js provides just enough parsing for positional arguments, options, and `--help`/`--version` without pulling in a full framework. This keeps the dependency tree shallow and audit-friendly.

---

## Testing Architecture

```m
flowchart LR
    subgraph Unit
        A[git.test.ts] -->|mocks execSync| B[listTags]
        C[classifier.test.ts] -->|pure functions| D[classifyCommit, classifyCommits]
        E[template.test.ts] -->|mock data| F[generateChangelog]
    end
```

- **git.test.ts** — verifies `listTags()` returns an array of non-empty strings. Does not test `getCommitsBetweenTags()` directly because that requires a real git history; integration testing is left to manual QA.
- **classifier.test.ts** — covers all `ChangeType` branches, scope extraction, breaking change detection, and anomaly cases.
- **template.test.ts** — verifies markdown generation, section presence, author/scope toggles, and empty-section skipping.

