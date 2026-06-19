# Contributing to Changelog AI

Thank you for your interest in contributing to changelog-ai.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
git clone https://github.com/Nxxo31/changelog-ai.git
cd changelog-ai
npm install
npm run build
```

### Development Workflow

```bash
npm run typecheck   # Run TypeScript type checker
npm run lint        # Run ESLint
npm test            # Run tests (watch mode: npm test)
npm run build       # Compile to dist/
```

All three checks (`typecheck`, `lint`, `test`) must pass before opening a PR.

## Project Layout

| File | Purpose |
|------|---------|
| `src/git.ts` | Git log extraction, tag listing |
| `src/classifier.ts` | Commit type/severity classification |
| `src/template.ts` | Changelog rendering |
| `src/cli.ts` | CLI interface |
| `tests/*.test.ts` | Unit tests (Vitest) |
| `docs/EXAMPLES.md` | Usage examples |
| `docs/SETUP.md` | Setup and installation guide |

## Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer: BREAKING CHANGE: ...]
```

Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `chore`, `ci`, `build`, `style`

## Adding Tests

Tests live in `tests/` and use [Vitest](https://vitest.dev/).

- One describe block per module
- One `it()` per behavior being tested
- Use descriptive test names that explain what is being validated
- Mock git commands when testing git module (see existing tests)

```typescript
// Example structure
describe('moduleName', () => {
  describe('functionName', () => {
    it('does X when Y', () => {
      // arrange
      const input = '...';
      // act
      const result = functionName(input);
      // assert
      expect(result).toBe('...');
    });
  });
});
```

Run tests in watch mode during development:

```bash
npm test
```

Run once (CI mode):

```bash
npm test -- --run
```

## Reporting Issues

Before opening an issue, please:

1. Check existing issues
2. Verify the issue with the latest version (`main` branch)
3. Include the output of `changelog-ai generate <from> <to>` with the problematic commits

## Code Style

- TypeScript strict mode enabled (`strict: true` in tsconfig)
- ESLint configured for TypeScript
- Prefer explicit types over `any`
- Keep functions small and focused
- Add JSDoc comments for exported functions

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`feat/your-feature`)
3. Run all checks: `npm run typecheck && npm run lint && npm test`
4. Commit using Conventional Commits
5. Open a PR with a clear description

## V2 Development (Planned)

The V2 roadmap includes LLM integration for ambiguous commit classification. When implementing this feature:

- Create a new `src/llm.ts` abstraction layer
- Support pluggable LLM providers (local Ollama, NVIDIA NIM, etc.)
- Make LLM calls optional and configurable via flag
- Keep the heuristics layer as the default (no LLM dependency)

## License

By contributing, you agree that your contributions will be dual-licensed under the MIT License and the GNU General Public License v3, and that contributors retain copyright of their own contributions.