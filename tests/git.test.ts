import { describe, it, expect } from 'vitest';
import { listTags } from '../src/git';

describe('git', () => {
  it('listTags returns array of strings', () => {
    const tags = listTags();
    expect(Array.isArray(tags)).toBe(true);
  });

  it('listTags items are non-empty strings', () => {
    const tags = listTags();
    for (const tag of tags) {
      expect(typeof tag).toBe('string');
      expect(tag.length).toBeGreaterThan(0);
    }
  });
});