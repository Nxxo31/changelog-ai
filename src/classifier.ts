import { CommitInfo } from './git';

export enum ChangeType {
  FEAT = 'feat',
  FIX = 'fix',
  PERF = 'perf',
  REFACTOR = 'refactor',
  DOCS = 'docs',
  STYLE = 'style',
  TEST = 'test',
  CHORE = 'chore',
  CI = 'ci',
  BUILD = 'build',
  BREAKING = 'breaking',
  OTHER = 'other'
}

export enum Severity {
  MAJOR = 'major',
  MINOR = 'minor',
  PATCH = 'patch'
}

export interface ClassifiedChange {
  commit: CommitInfo;
  type: ChangeType;
  severity: Severity;
  isBreaking: boolean;
  scope?: string;
}

const CONVENTIONAL_REGEX = /^(?<type>\w+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*(?<description>.+)/s;
const BREAKING_PATTERNS = [
  /BREAKING\s*CHANGE/i,
  /BREAKING[- ]CHANGE/i,
  /breaking change/i
];

export function classifyCommit(commit: CommitInfo): ClassifiedChange {
  const match = commit.message.match(CONVENTIONAL_REGEX);

  if (match?.groups) {
    const { type, scope, breaking } = match.groups;
    const cleanType = type.toLowerCase().trim();

    // Combine subject + body for full breaking change detection
    const fullMessage = commit.message;
    const hasBreakingFooter = BREAKING_PATTERNS.some(pattern => pattern.test(fullMessage));
    const isBreaking = !!breaking || hasBreakingFooter;

    return {
      commit,
      type: mapType(cleanType),
      severity: deriveSeverity(cleanType, isBreaking),
      isBreaking,
      scope: scope || undefined
    };
  }

  // Non-conventional commit — check for breaking patterns in message
  const hasBreaking = BREAKING_PATTERNS.some(p => p.test(commit.message));

  return {
    commit,
    type: hasBreaking ? ChangeType.BREAKING : ChangeType.OTHER,
    severity: hasBreaking ? Severity.MAJOR : Severity.PATCH,
    isBreaking: hasBreaking,
    scope: undefined
  };
}

function mapType(type: string): ChangeType {
  const mapping: Record<string, ChangeType> = {
    feat: ChangeType.FEAT,
    fix: ChangeType.FIX,
    perf: ChangeType.PERF,
    refactor: ChangeType.REFACTOR,
    docs: ChangeType.DOCS,
    style: ChangeType.STYLE,
    test: ChangeType.TEST,
    chore: ChangeType.CHORE,
    ci: ChangeType.CI,
    build: ChangeType.BUILD
  };
  return mapping[type] || ChangeType.OTHER;
}

function deriveSeverity(type: string, isBreaking: boolean): Severity {
  if (isBreaking) return Severity.MAJOR;
  if (type === 'feat') return Severity.MINOR;
  if (type === 'perf') return Severity.MINOR;
  return Severity.PATCH;
}

export function classifyCommits(commits: CommitInfo[]): ClassifiedChange[] {
  return commits.map(classifyCommit);
}