# Examples

> Real-world usage scenarios for changelog-ai. Each example is tested against the current codebase.

---

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

---

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

---

## Conventional Commits Examples

The following table shows how each commit message type is classified and where it appears in the output:

| Commit message | Changelog section | Severity |
|---|---|---|
| `feat: add user registration` | Added | Minor |
| `fix(auth): correct token expiry` | Fixed | Patch |
| `feat(payments)!: new Stripe integration` | ⚠ BREAKING CHANGES | Major |
| `fix!: remove deprecated /v1/users` | ⚠ BREAKING CHANGES | Major |
| `perf(api): cache responses` | Changed | Minor |
| `refactor: simplify auth flow` | Changed | Patch |
| `docs: update API documentation` | Changed | Patch |
| `fix: resolve null pointer`<br>`BREAKING CHANGE: config format changed` | ⚠ BREAKING CHANGES | Major |
| `test: add integration tests` | Other | Patch |
| `chore: update dependencies` | Other | Patch |

---

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
          fetch-depth: 0  # Required for tag access

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
          name: changelog-${{ github.event.inputs.to_tag }}
          path: CHANGELOG.md
```

### GitHub Actions (on release tag)

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

---

## Troubleshooting

### No commits found

If `generate` returns an empty changelog:

1. Verify the tags exist: `changelog-ai tags`
2. Check the range directly: `git log v1.0.0..v1.1.0 --oneline`
3. Ensure both tags are on the same branch
4. In CI, ensure full history is fetched: `fetch-depth: 0` in checkout action

### Tag not found

```bash
fatal: ambiguous argument 'v99.0.0': unknown revision
```

Verify the tag exists: `git tag -l` or `changelog-ai tags`

### Permission denied

```bash
# After npm link, ensure the binary is executable:
chmod +x dist/cli.js
npm link
```

### Empty changelog despite commits

If the changelog is generated but shows no entries:

1. Check that commits follow Conventional Commits format
2. Verify the range is correct: `git log <from>..<to> --oneline`
3. Confirm the tags are ordered correctly (older → newer, not vice versa)

### Build errors after pulling changes

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Linting errors after merging

```bash
npm run lint -- --fix  # Auto-fix safe issues
```

Review the remaining output for issues that require manual fixes.