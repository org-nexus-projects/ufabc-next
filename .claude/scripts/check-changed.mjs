#!/usr/bin/env node
// Checks only what this branch changed, because the repo carries thousands of
// pre-existing lint findings and unformatted files that are not the agent's job.
//
//   node .claude/scripts/check-changed.mjs [--base origin/main]
//
// 1. oxlint findings on changed lines (new and modified lines only).
// 2. oxfmt drift in changed files that were formatted at the base (or are new).
// 3. The type check and test commands for every workspace the change touches.
// Exits 1 when step 1 or 2 finds something.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = spawnSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf-8',
}).stdout.trim();
const baseIndex = process.argv.indexOf('--base');
const baseRef = baseIndex === -1 ? 'origin/main' : process.argv[baseIndex + 1];

const LINTABLE = /\.(ts|mts|cts|tsx|js|mjs|cjs|jsx|vue)$/u;
const FORMATTABLE =
  /\.(ts|mts|cts|tsx|js|mjs|cjs|jsx|vue|json|jsonc|css|scss)$/u;
const SKIP =
  /(^|\/)(node_modules|dist|\.output|\.wxt|\.turbo)\/|(^|\/)(auto-imports|components)\.d\.ts$/u;

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: 'utf-8',
    maxBuffer: 256 * 1024 * 1024,
    ...options,
  });
}

function git(...args) {
  const result = run('git', args);
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr.trim()}`);
  }
  return result.stdout;
}

function lines(text) {
  return text.split('\n').filter(Boolean);
}

const base = git('merge-base', baseRef, 'HEAD').trim();
const tracked = lines(git('diff', '--name-only', '--diff-filter=ACMR', base));
const untracked = lines(git('ls-files', '--others', '--exclude-standard'));
const files = [...new Set([...tracked, ...untracked])].filter(
  (file) => !SKIP.test(file) && existsSync(join(root, file))
);

if (files.length === 0) {
  console.log(`No changed files against ${baseRef}.`);
  process.exit(0);
}

// null means "every line" (a new file).
function changedLines(file) {
  if (untracked.includes(file)) {
    return null;
  }
  const diff = git('diff', '-U0', base, '--', file);
  const changed = new Set();
  for (const match of diff.matchAll(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gmu)) {
    const start = Number(match[1]);
    const count = match[2] === undefined ? 1 : Number(match[2]);
    for (let line = start; line < start + count; line += 1) {
      changed.add(line);
    }
  }
  return changed;
}

let failed = false;
const oxlint = join(root, 'node_modules', '.bin', 'oxlint');
const oxfmt = join(root, 'node_modules', '.bin', 'oxfmt');

const lintFiles = files.filter((file) => LINTABLE.test(file));
if (lintFiles.length > 0 && existsSync(oxlint)) {
  const result = run(oxlint, ['-f', 'json', ...lintFiles]);
  let diagnostics = [];
  try {
    diagnostics = JSON.parse(result.stdout).diagnostics ?? [];
  } catch {
    console.error(result.stdout ?? result.stderr);
    process.exit(2);
  }
  const lineSets = new Map(lintFiles.map((file) => [file, changedLines(file)]));
  const introduced = diagnostics.filter((diagnostic) => {
    const set = lineSets.get(diagnostic.filename);
    const line = diagnostic.labels?.[0]?.span?.line;
    return set === null || line === undefined || set?.has(line);
  });
  console.log(
    `## Lint: ${introduced.length} finding(s) on changed lines (${diagnostics.length} in changed files overall)`
  );
  for (const diagnostic of introduced) {
    const span = diagnostic.labels?.[0]?.span ?? {};
    console.log(
      `${diagnostic.filename}:${span.line ?? '?'}:${span.column ?? '?'} ${diagnostic.severity} ${diagnostic.code}: ${diagnostic.message}`
    );
  }
  failed ||= introduced.length > 0;
}

function formattedAtBase(file) {
  const original = run('git', ['show', `${base}:${file}`]);
  if (original.status !== 0) {
    return true;
  }
  const formatted = run(oxfmt, [`--stdin-filepath=${file}`], {
    input: original.stdout,
  });
  return formatted.status === 0 && formatted.stdout === original.stdout;
}

const formatFiles = files.filter((file) => FORMATTABLE.test(file));
if (formatFiles.length > 0 && existsSync(oxfmt)) {
  const drift = lines(
    run(oxfmt, [
      '--list-different',
      '--no-error-on-unmatched-pattern',
      ...formatFiles,
    ]).stdout
  )
    .map((file) => file.replace(/^\.\//u, ''))
    .filter((file) => formattedAtBase(file));
  console.log(`\n## Format: ${drift.length} file(s) need oxfmt`);
  for (const file of drift) {
    console.log(`pnpm exec oxfmt ${file}`);
  }
  failed ||= drift.length > 0;
}

function workspaceOf(file) {
  let dir = dirname(file);
  while (dir !== '.' && dir !== '') {
    const manifest = join(root, dir, 'package.json');
    if (existsSync(manifest)) {
      return { dir, manifest: JSON.parse(readFileSync(manifest, 'utf-8')) };
    }
    dir = dirname(dir);
  }
  return null;
}

const workspaces = new Map();
for (const file of files) {
  const workspace = workspaceOf(file);
  if (workspace?.manifest.name) {
    workspaces.set(workspace.manifest.name, workspace);
  }
}

console.log('\n## Run next for touched workspaces');
if (workspaces.size === 0) {
  console.log('No workspace package touched (root or docs only).');
}
for (const [name, { manifest }] of workspaces) {
  const scripts = manifest.scripts ?? {};
  const commands = [];
  if (scripts.tsc) {
    commands.push(`pnpm turbo run tsc --filter=${name}`);
  } else if (scripts.compile) {
    // compile is not a turbo task, so run the package script directly.
    commands.push(`pnpm --filter ${name} compile`);
  }
  if (name === '@next/core') {
    commands.push(
      'pnpm --filter @next/core exec vitest run   # Docker required'
    );
  } else if (scripts.test) {
    commands.push(`pnpm --filter ${name} test`);
  }
  console.log(
    `- ${name}: ${commands.length > 0 ? commands.join('  &&  ') : 'no tsc/test scripts; verify manually'}`
  );
}

process.exit(failed ? 1 : 0);
