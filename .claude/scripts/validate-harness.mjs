#!/usr/bin/env node
// Validates the agent harness so docs do not rot as the code moves:
//   node .claude/scripts/validate-harness.mjs
// - skills and agents have the frontmatter Claude Code needs, and names match their files
// - every rule has `paths:` globs and each glob matches at least one tracked file
// - repo paths quoted in AGENTS.md, CLAUDE.md, and .claude/**/*.md exist
// - relative Markdown links resolve
// - hook commands in settings.json point at existing scripts
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, matchesGlob, relative } from 'node:path';

const root = spawnSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf-8',
}).stdout.trim();
const tracked = spawnSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard'],
  {
    cwd: root,
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  }
)
  .stdout.split('\n')
  .filter(Boolean);
const trackedSet = new Set(tracked);
const trackedDirs = new Set(
  tracked.flatMap((file) => {
    const parts = file.split('/');
    return parts
      .slice(1)
      .map((_, index) => parts.slice(0, index + 1).join('/'));
  })
);

const errors = [];

function fail(file, message) {
  errors.push(`${relative(root, file)}: ${message}`);
}

function parseFrontmatter(file) {
  const text = readFileSync(file, 'utf-8');
  const match = text.match(/^---\n([\s\S]*?)\n---\n/u);
  if (!match) {
    return null;
  }
  const data = {};
  let listKey = null;
  for (const line of match[1].split('\n')) {
    const item = line.match(/^\s+-\s+(.*)$/u);
    if (item && listKey) {
      data[listKey].push(item[1].replaceAll(/^['"]|['"]$/gu, ''));
      continue;
    }
    const pair = line.match(/^([\w-]+):\s*(.*)$/u);
    if (pair) {
      listKey = pair[2] === '' ? pair[1] : null;
      data[pair[1]] = pair[2] === '' ? [] : pair[2];
    }
  }
  return data;
}

function listFiles(dir, predicate) {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .filter(predicate);
}

const claudeDir = join(root, '.claude');

for (const skillDir of readdirSync(join(claudeDir, 'skills'))) {
  const file = join(claudeDir, 'skills', skillDir, 'SKILL.md');
  const data = existsSync(file) ? parseFrontmatter(file) : null;
  if (!data) {
    fail(file, 'missing SKILL.md or frontmatter');
    continue;
  }
  if (data.name !== skillDir) {
    fail(file, `name "${data.name}" must match directory "${skillDir}"`);
  }
  if (!data.description || data.description.length < 40) {
    fail(file, 'description must say what the skill does and when to use it');
  }
}

for (const file of listFiles(join(claudeDir, 'agents'), (path) =>
  path.endsWith('.md')
)) {
  const data = parseFrontmatter(file);
  const expected = file.split('/').pop().replace(/\.md$/u, '');
  if (!data || data.name !== expected) {
    fail(file, `frontmatter name must be "${expected}"`);
  } else if (!data.description) {
    fail(file, 'missing description');
  }
}

for (const file of listFiles(join(claudeDir, 'rules'), (path) =>
  path.endsWith('.md')
)) {
  const data = parseFrontmatter(file);
  if (!data || !Array.isArray(data.paths) || data.paths.length === 0) {
    fail(file, 'rules need a non-empty `paths:` list');
    continue;
  }
  for (const glob of data.paths) {
    if (
      !tracked.some((path) =>
        [glob, `${glob}/**`].some((pattern) => matchesGlob(path, pattern))
      )
    ) {
      fail(file, `glob "${glob}" matches no file in the repo`);
    }
  }
}

const REPO_PATH =
  /`((?:apps|packages|tools|\.claude|\.github)\/[^`\s]+|[\w.-]+\.(?:md|ts|json|ya?ml))`/gu;
const PLACEHOLDER = /[<>*{}$|]|\.\.\./u;
// Personal, git-ignored files that docs mention but a checkout does not contain.
const LOCAL_ONLY = new Set(['.claude/settings.local.json', 'CLAUDE.local.md']);

function pathExists(candidate) {
  const clean = candidate.replace(/[:#].*$/u, '').replace(/\/$/u, '');
  return (
    trackedSet.has(clean) ||
    trackedDirs.has(clean) ||
    existsSync(join(root, clean))
  );
}

// Walk git's file list, not the disk: node_modules makes a recursive readdir take minutes.
const docs = tracked
  .filter(
    (path) =>
      /(^|\/)(AGENTS|CLAUDE)\.md$/u.test(path) ||
      /^\.claude\/.*\.md$/u.test(path)
  )
  .map((path) => join(root, path));

for (const file of new Set(docs)) {
  const text = readFileSync(file, 'utf-8');
  for (const [, candidate] of text.matchAll(REPO_PATH)) {
    if (
      PLACEHOLDER.test(candidate) ||
      LOCAL_ONLY.has(candidate) ||
      !candidate.includes('/')
    ) {
      continue;
    }
    // Paths inside app guides are sometimes relative to the app (src/..., tests/...).
    const appRoot = relative(root, dirname(file));
    if (!pathExists(candidate) && !pathExists(join(appRoot, candidate))) {
      fail(file, `references missing path ${candidate}`);
    }
  }
  for (const [, link] of text.matchAll(
    /\]\((?!https?:|#|mailto:)([^)\s]+)\)/gu
  )) {
    const target = join(dirname(file), link.replace(/#.*$/u, ''));
    if (!existsSync(target)) {
      fail(file, `broken link ${link}`);
    }
  }
}

const settings = JSON.parse(
  readFileSync(join(claudeDir, 'settings.json'), 'utf-8')
);
for (const groups of Object.values(settings.hooks ?? {})) {
  for (const group of groups) {
    for (const hook of group.hooks) {
      const script = hook.command.match(
        /\$CLAUDE_PROJECT_DIR\/([^"\s]+)/u
      )?.[1];
      if (script && !existsSync(join(root, script))) {
        fail(
          join(claudeDir, 'settings.json'),
          `hook script ${script} does not exist`
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Harness validation failed (${errors.length}):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Harness validation passed.');
