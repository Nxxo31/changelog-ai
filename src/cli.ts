#!/usr/bin/env node

import { Command } from 'commander';
import { getCommitsBetweenTags, getCommitsSinceTag, getCommitsBetweenHashes, listTags } from './git';
import { classifyCommits } from './classifier';
import { generateChangelog } from './template';

const program = new Command();

program
  .name('changelog-ai')
  .description('Generate changelogs from git commits using heuristics')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate a changelog between two git refs (tags or hashes)')
  .argument('<from>', 'Starting tag or commit hash')
  .argument('<to>', 'Ending tag or commit hash (use "HEAD" for latest)')
  .option('-o, --output <file>', 'Write changelog to file instead of stdout')
  .option('--author', 'Include commit author in output')
  .option('--scope', 'Include commit scope in output')
  .action(async (from, to, options) => {
    try {
      const commits = getCommitsBetweenTags(from, to);
      const classified = classifyCommits(commits);
      const changelog = generateChangelog(to, classified, from, {
        showAuthor: options.author,
        showScope: options.scope
      });

      if (options.output) {
        const fs = require('fs');
        fs.writeFileSync(options.output, changelog, 'utf-8');
        console.log(`Changelog written to ${options.output}`);
      } else {
        console.log(changelog);
      }
    } catch (error) {
      console.error('Error generating changelog:', (error as Error).message);
      process.exit(1);
    }
  });

program
  .command('tags')
  .description('List all git tags sorted by creation date (newest first)')
  .action(() => {
    const tags = listTags();
    if (tags.length === 0) {
      console.log('No tags found.');
    } else {
      tags.forEach(tag => console.log(tag));
    }
  });

program.parse(process.argv);