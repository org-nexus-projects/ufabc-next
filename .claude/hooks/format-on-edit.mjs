#!/usr/bin/env node
// PostToolUse(Write|Edit|MultiEdit): run oxfmt on the edited file.
// About a third of the repo predates oxfmt. Reformatting those files would bury the
// real change in whitespace noise, so only new files and files that were already
// formatted at HEAD are formatted.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { isGeneratedPath, projectDir, readInput, toRepoPath } from './lib.mjs';

const FORMATTABLE =
  /\.(ts|mts|cts|tsx|js|mjs|cjs|jsx|vue|json|jsonc|css|scss)$/u;

const input = readInput();
const filePath = input.tool_input?.file_path;

if (typeof filePath !== 'string' || !FORMATTABLE.test(filePath)) {
  process.exit(0);
}

const repoPath = toRepoPath(filePath);
const oxfmt = join(projectDir, 'node_modules', '.bin', 'oxfmt');

if (
  repoPath.startsWith('..') ||
  isGeneratedPath(repoPath) ||
  !existsSync(oxfmt)
) {
  process.exit(0);
}

function git(args, options = {}) {
  return spawnSync('git', args, {
    cwd: projectDir,
    encoding: 'utf-8',
    ...options,
  });
}

function wasFormattedAtHead() {
  const head = git(['show', `HEAD:${repoPath}`]);
  if (head.status !== 0) {
    // Not in HEAD: a new file, so it should follow the formatter from the start.
    return true;
  }
  const formatted = spawnSync(oxfmt, [`--stdin-filepath=${repoPath}`], {
    cwd: projectDir,
    encoding: 'utf-8',
    input: head.stdout,
  });
  return formatted.status === 0 && formatted.stdout === head.stdout;
}

if (!wasFormattedAtHead()) {
  process.exit(0);
}

try {
  execFileSync(oxfmt, ['--no-error-on-unmatched-pattern', repoPath], {
    cwd: projectDir,
    stdio: 'ignore',
    timeout: 20_000,
  });
} catch {
  // A syntax error makes oxfmt fail; the type checker reports it with better context.
}

process.exit(0);
