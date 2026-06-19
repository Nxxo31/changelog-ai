import { describe, it, expect } from 'vitest';
import { classifyCommit, classifyCommits, ChangeType, Severity } from '../src/classifier';
import { CommitInfo } from '../src/git';

function makeCommit(message: string, overrides: Partial<CommitInfo> = {}): CommitInfo {
  return {
    hash: 'abc1234',
    author: 'Test Author',
    date: '2024-01-15',
    message,
    ...overrides
  };
}

describe('classifier', () => {
  describe('classifyCommit', () => {
    it('classifies feat as MINOR', () => {
      const commit = makeCommit('feat: add user authentication');
      const result = classifyCommit(commit);
      expect(result.type).toBe(ChangeType.FEAT);
      expect(result.severity).toBe(Severity.MINOR);
      expect(result.isBreaking).toBe(false);
    });

    it('classifies fix as PATCH', () => {
      const commit = makeCommit('fix: correct date display');
      const result = classifyCommit(commit);
      expect(result.type).toBe(ChangeType.FIX);
      expect(result.severity).toBe(Severity.PATCH);
    });

    it('classifies perf as MINOR', () => {
      const commit = makeCommit('perf: improve API response time');
      const result = classifyCommit(commit);
      expect(result.type).toBe(ChangeType.PERF);
      expect(result.severity).toBe(Severity.MINOR);
    });

    it('classifies refactor as PATCH', () => {
      const commit = makeCommit('refactor: clean up module exports');
      const result = classifyCommit(commit);
      expect(result.type).toBe(ChangeType.REFACTOR);
      expect(result.severity).toBe(Severity.PATCH);
    });

    it('classifies docs as PATCH', () => {
      const commit = makeCommit('docs: update README');
      const result = classifyCommit(commit);
      expect(result.type).toBe(ChangeType.DOCS);
    });

    it('classifies test as PATCH', () => {
      const commit = makeCommit('test: add user model tests');
      const result = classifyCommit(commit);
      expect(result.type).toBe(ChangeType.TEST);
    });

    it('classifies chore as PATCH', () => {
      const commit = makeCommit('chore: update dependencies');
      const result = classifyCommit(commit);
      expect(result.type).toBe(ChangeType.CHORE);
    });

    it('extracts scope from scoped commit', () => {
      const commit = makeCommit('feat(auth): add OAuth login');
      const result = classifyCommit(commit);
      expect(result.scope).toBe('auth');
      expect(result.type).toBe(ChangeType.FEAT);
    });

    it('detects breaking change via ! suffix', () => {
      const commit = makeCommit('feat!: remove legacy API endpoint');
      const result = classifyCommit(commit);
      expect(result.isBreaking).toBe(true);
      expect(result.severity).toBe(Severity.MAJOR);
    });

    it('detects breaking change via BREAKING CHANGE footer', () => {
      const commit = makeCommit('feat: update config format\n\nBREAKING CHANGE: old config is no longer supported');
      const result = classifyCommit(commit);
      expect(result.isBreaking).toBe(true);
      expect(result.severity).toBe(Severity.MAJOR);
    });

    it('classifies non-conventional commits as OTHER', () => {
      const commit = makeCommit('updated the login page styles');
      const result = classifyCommit(commit);
      expect(result.type).toBe(ChangeType.OTHER);
      expect(result.severity).toBe(Severity.PATCH);
    });

    it('classifies commits with multiple lines', () => {
      const commit = makeCommit('fix: resolve null pointer\n\nThe issue occurred when user data was missing.\nReviewed by @admin');
      const result = classifyCommit(commit);
      expect(result.type).toBe(ChangeType.FIX);
    });
  });

  describe('classifyCommits', () => {
    it('classifies multiple commits', () => {
      const commits = [
        makeCommit('feat: add dark mode'),
        makeCommit('fix: correct typo'),
        makeCommit('docs: update API docs')
      ];
      const results = classifyCommits(commits);
      expect(results).toHaveLength(3);
      expect(results[0].type).toBe(ChangeType.FEAT);
      expect(results[1].type).toBe(ChangeType.FIX);
      expect(results[2].type).toBe(ChangeType.DOCS);
    });

    it('returns empty array for empty input', () => {
      const results = classifyCommits([]);
      expect(results).toHaveLength(0);
    });
  });
});