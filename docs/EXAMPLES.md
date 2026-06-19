# Examples

This document shows real-world usage scenarios for changelog-ai.

## Basic Usage

### Generate changelog between two tags

```bash
changelog-ai generate v1.0.0 v1.1.0
```

Output:

```markdown
# Changelog

## [v1.1.0] - 2026-01-15

### Added

- add OAuth login
- add user profile page

### Fixed

- correct session timeout logic

### ⚠ BREAKING CHANGES

- drop legacy v1 API endpoints

---
```

### Generate from tag to HEAD

```bash
# Use when your tags aren't at exact commit boundaries
changelog-ai generate v1.5.0 HEAD
```

### Save to file

```bash
changelog-ai generate v0.1.0 v0.2.0 -o CHANGELOG.md
```

## Advanced Options

### Include commit author

```bash
changelog-ai generate v1.0.0 HEAD --author
```

Output includes the author name for each change:

```markdown
- add dark mode support (by Maria Garcia)
- fix payment redirect (by Carlos Ruiz)
```

### Include commit scope

```bash
changelog-ai generate v1.0.0 HEAD --scope
```

Output includes the scope from Conventional Commits:

```markdown
- **auth:** add OAuth login
- **payments:** fix redirect logic
- **ui:** add dark mode support
```

### Combine options

```bash
changelog-ai generate v1.0.0 v2.0.0 --author --scope -o RELEASE.md
```

## CI/CD Integration

### GitHub Actions (manual trigger)

```yaml
name: Generate Changelog

on:
  workflow_dispatch:
    inputs:
      from_tag:
        description: 'From tag'
        required: true
      to_tag:
        description: 'To tag'
        required: true

jobs:
  changelog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run build

      - name: Generate changelog
        run: |
          node dist/cli.js generate ${{ github.event.inputs.from_tag }} ${{ github.event.inputs.to_tag }} -o CHANGELOG.md

      - name: Upload changelog
        uses: actions/upload-artifact@v4
        with:
          name: changelog
          path: CHANGELOG.md
```

### GitHub Actions (on release)

```yaml
name: Changelog on Release

on:
  push:
    tags:
      - 'v*'

jobs:
  changelog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci && npm run build

      - name: Get previous tag
        id: prev_tag
        run: |
          PREV=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")
          echo "prev=$PREV" >> $GITHUB_OUTPUT

      - name: Generate changelog
        if: steps.prev_tag.outputs.prev != ''
        run: |
          node dist/cli.js generate ${{ steps.prev_tag.outputs.prev }} ${{ github.ref_name }} -o CHANGELOG.md

      - name: Create PR with changelog
        if: steps.prev_tag.outputs.prev != ''
        uses: peter-evans/create-pull-request@v6
        with:
          title: "Changelog: ${{ github.ref_name }}"
          body-path: CHANGELOG.md
          commit-message: "docs: update changelog for ${{ github.ref_name }}"
```

### GitLab CI

```yaml
generate-changelog:
  stage: release
  script:
    - npm ci
    - npm run build
    - node dist/cli.js generate $PREVIOUS_TAG $CI_COMMIT_TAG -o CHANGELOG.md
  artifacts:
    paths:
      - CHANGELOG.md
  only:
    - tags
```

### Local release workflow

```bash
# 1. Bump version in package.json
# 2. Commit and tag
git add -A
git commit -m "chore(release): bump version"
git tag v1.2.0
git push && git push --tags

# 3. Generate changelog
changelog-ai generate v1.1.0 v1.2.0 -o CHANGELOG.md

# 4. Review and publish
```

## Conventional Commits Examples

For best results, write commit messages following the Conventional Commits spec:

| Commit message | Classification |
|----------------|----------------|
| `feat: add user registration` | Added |
| `fix(auth): correct token expiry` | Fixed |
| `feat(payments)!: new Stripe integration` | ⚠ BREAKING CHANGES |
| `fix!: remove deprecated /v1/users` | ⚠ BREAKING CHANGES |
| `perf(api): cache responses` | Changed |
| `refactor: simplify auth flow` | Changed |
| `docs: update API documentation` | Changed |
| `fix: resolve null pointer\n\nBREAKING CHANGE: config format changed` | ⚠ BREAKING CHANGES |

## Troubleshooting

### No commits found

If `generate` returns an empty changelog:

1. Verify the tags exist: `changelog-ai tags`
2. Check the range: `git log v1.0.0..v1.1.0 --oneline`
3. Ensure tags are on the same branch

### Tag not found

```bash
Error: Command failed: git log v99.0.0..HEAD...
fatal: ambiguous argument 'v99.0.0': unknown revision
```

Verify the tag exists: `git tag -l` or `changelog-ai tags`

### Merge commits included

Use `--no-merges` flag by default (already configured). If you need merges:

Modify `src/git.ts` and remove `--no-merges` from the git command.