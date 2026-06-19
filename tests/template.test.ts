import { describe, it, expect } from 'vitest';
import { generateChangelog } from '../src/template';
import { classifyCommit } from '../src/classifier';
import { CommitInfo } from '../src/git';

function makeCommit(message: string): CommitInfo {
  return { hash: 'a1b2c3d', author: 'Dev', date: '2024-01-01', message };
}

describe('template', () => {
  it('generates changelog with added section', () => {
    const commits = [
      makeCommit('feat: add new dashboard'),
      makeCommit('feat(ui): add theme switcher')
    ];
    const classified = commits.map(c => classifyCommit(c));
    const result = generateChangelog('v1.1.0', classified, 'v1.0.0', {
      showScope: true
    });

    expect(result).toContain('# Changelog');
    expect(result).toContain('## [v1.1.0]');
    expect(result).toContain('### Added');
    expect(result).toContain('add new dashboard');
    expect(result).toContain('**ui:** add theme switcher');
  });

  it('generates changelog with fixed section', () => {
    const commits = [makeCommit('fix: resolve memory leak')];
    const classified = commits.map(c => classifyCommit(c));
    const result = generateChangelog('v1.0.1', classified);

    expect(result).toContain('### Fixed');
    expect(result).toContain('resolve memory leak');
  });

  it('generates changelog with breaking changes section', () => {
    const commits = [makeCommit('feat!: remove deprecated API')];
    const classified = commits.map(c => classifyCommit(c));
    const result = generateChangelog('v2.0.0', classified);

    expect(result).toContain('### ⚠ BREAKING CHANGES');
    expect(result).toContain('remove deprecated API');
  });

  it('includes author when option is set', () => {
    const commits = [makeCommit('fix: critical bug')];
    const classified = commits.map(c => classifyCommit(c));
    const result = generateChangelog('v1.0.1', classified, 'v1.0.0', {
      showAuthor: true
    });

    expect(result).toContain('(by Dev)');
  });

  it('skips empty sections', () => {
    const commits = [makeCommit('feat: new feature')];
    const classified = commits.map(c => classifyCommit(c));
    const result = generateChangelog('v1.1.0', classified);

    expect(result).not.toContain('### Changed');
    expect(result).not.toContain('### Fixed');
    expect(result).toContain('### Added');
  });

  it('generates changelog with custom title', () => {
    const result = generateChangelog('v1.0.0', [], undefined, {
      title: 'Release Notes'
    });
    expect(result).toContain('# Release Notes');
  });
});