import { execSync } from 'child_process';

export interface CommitInfo {
  hash: string;
  author: string;
  date: string;
  message: string;
}

const RECORD_SEP = '\x1e'; // ASCII Record Separator (Unicode 0x1E) — safe for commit messages

/**
 * Executes a git command and returns its stdout trimmed.
 * Throws on non-zero exit.
 */
function git(args: string, cwd?: string): string {
  return execSync(`git ${args}`, {
    cwd: cwd || process.cwd(),
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe']
  }).trim();
}

/**
 * Format each commit as a single record using the ASCII Record Separator (\x1e).
 * Field layout within the record: %H|%an|%ad|%s\n%b
 */
function buildGitLogArgs(range: string): string {
  // %H (hash), %an (author), %ad (date), %s (subject), %b (body)
  // Use %x1e record separator between commits; trailing newline removed
  return `log ${range} --pretty=format:${RECORD_SEP}%H¹%an¹%ad¹%s%n%b --date=short --no-merges`;
}

/**
 * Parse raw git log output (single string with record separators) into CommitInfo array.
 */
function parseGitLog(raw: string): CommitInfo[] {
  if (!raw) return [];

  return raw.split(RECORD_SEP)
    .map(record => {
      // Each record: hash|author|date|subject\nbody
      const firstLineEnd = record.indexOf('\n');
      const headerPart = firstLineEnd >= 0 ? record.substring(0, firstLineEnd) : record;
      const bodyPart = firstLineEnd >= 0 ? record.substring(firstLineEnd + 1) : '';

      const parts = headerPart.split('¹');
      if (parts.length < 3) return null;

      return {
        hash: parts[0] || '',
        author: parts[1] || '',
        date: parts[2] || '',
        message: bodyPart.trim() || parts[3] || ''
      };
    })
    .filter((c): c is CommitInfo => c !== null && c.hash !== '');
}

/**
 * Get commits between two tags.
 * Returns commits from tag `from` (exclusive) to tag `to` (inclusive).
 */
export function getCommitsBetweenTags(from: string, to: string, cwd?: string): CommitInfo[] {
  const range = `${from}..${to}`;
  const raw = git(buildGitLogArgs(range), cwd);
  return parseGitLog(raw);
}

/**
 * Get commits between two commit hashes (exclusive to exclusive).
 */
export function getCommitsBetweenHashes(fromHash: string, toHash: string, cwd?: string): CommitInfo[] {
  const range = `${fromHash}..${toHash}`;
  const raw = git(buildGitLogArgs(range), cwd);
  return parseGitLog(raw);
}

/**
 * Get commits since a specific tag up to HEAD.
 */
export function getCommitsSinceTag(fromTag: string, cwd?: string): CommitInfo[] {
  const raw = git(buildGitLogArgs(`${fromTag}..HEAD`), cwd);
  return parseGitLog(raw);
}

/**
 * List all tags in the repository sorted by creation date.
 */
export function listTags(cwd?: string): string[] {
  const raw = git('tag --sort=-creatordate', cwd);
  return raw ? raw.split('\n').filter(Boolean) : [];
}