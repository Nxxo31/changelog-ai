import { ClassifiedChange, ChangeType, Severity } from './classifier';

export interface ChangelogOptions {
  title?: string;
  description?: string;
  showAuthor?: boolean;
  showScope?: boolean;
  dateFormat?: string;
}

interface GroupedChanges {
  added: ClassifiedChange[];
  changed: ClassifiedChange[];
  deprecated: ClassifiedChange[];
  removed: ClassifiedChange[];
  fixed: ClassifiedChange[];
  security: ClassifiedChange[];
  breaking: ClassifiedChange[];
  other: ClassifiedChange[];
}

function groupByType(changes: ClassifiedChange[]): GroupedChanges {
  const groups: GroupedChanges = {
    added: [],
    changed: [],
    deprecated: [],
    removed: [],
    fixed: [],
    security: [],
    breaking: [],
    other: []
  };

  for (const change of changes) {
    if (change.isBreaking) {
      groups.breaking.push(change);
    }

    switch (change.type) {
      case ChangeType.FEAT:
        groups.added.push(change);
        break;
      case ChangeType.FIX:
        groups.fixed.push(change);
        break;
      case ChangeType.PERF:
      case ChangeType.REFACTOR:
      case ChangeType.STYLE:
        groups.changed.push(change);
        break;
      case ChangeType.DOCS:
        groups.changed.push(change);
        break;
      case ChangeType.TEST:
      case ChangeType.CI:
      case ChangeType.BUILD:
      case ChangeType.CHORE:
        groups.other.push(change);
        break;
      default:
        groups.other.push(change);
        break;
    }
  }

  return groups;
}

function formatEntry(change: ClassifiedChange, options: ChangelogOptions): string {
  let line = '- ';

  if (options.showScope && change.scope) {
    line += `**${change.scope}:** `;
  }

  // Extract first line of message and strip conventional commit prefix
  const firstLine = change.commit.message.split('\n')[0];
  const cleanMessage = firstLine.replace(/^\w+(?:\([^)]*\))?!?:\s*/, '');
  line += cleanMessage;

  if (options.showAuthor) {
    line += ` (by ${change.commit.author})`;
  }

  return line;
}

function buildSection(title: string, changes: ClassifiedChange[], options: ChangelogOptions): string {
  if (changes.length === 0) return '';

  let section = `### ${title}\n\n`;
  section += changes.map(c => formatEntry(c, options)).join('\n');
  section += '\n\n';
  return section;
}

export function generateChangelog(
  version: string,
  changes: ClassifiedChange[],
  previousVersion?: string,
  options: ChangelogOptions = {}
): string {
  const {
    title = 'Changelog',
    description,
    showAuthor = false,
    showScope = false,
    dateFormat = 'YYYY-MM-DD'
  } = options;

  const today = new Date().toISOString().split('T')[0];
  const groups = groupByType(changes);

  let output = `# ${title}\n\n`;

  if (description) {
    output += `${description}\n\n`;
  }

  output += `## [${version}] - ${today}\n\n`;

  output += buildSection('Added', groups.added, options);
  output += buildSection('Changed', groups.changed, options);
  output += buildSection('Deprecated', [], options);
  output += buildSection('Removed', [], options);
  output += buildSection('Fixed', groups.fixed, options);
  output += buildSection('Security', groups.security, options);
  output += buildSection('⚠ BREAKING CHANGES', groups.breaking, options);
  output += buildSection('Other', groups.other, options);

  // Footer
  output += `---\n\n`;

  if (previousVersion) {
    output += `[${version}]: https://github.com/compare/${previousVersion}...${version}\n`;
  }

  return output.trimEnd() + '\n';
}