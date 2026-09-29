#!/usr/bin/env node
// SessionStart: print a short status of the checkout so the agent starts with the
// facts that usually cause wasted turns (wrong Node, missing install, unbuilt logger).
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { projectDir } from './lib.mjs';

function run(command, args, timeout = 3000) {
  const result = spawnSync(command, args, {
    cwd: projectDir,
    encoding: 'utf-8',
    timeout,
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

const lines = ['## ufabc-next session status'];
const warnings = [];

const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
const counts = run('git', [
  'rev-list',
  '--left-right',
  '--count',
  'origin/main...HEAD',
]);
const dirty =
  run('git', ['status', '--porcelain'])?.split('\n').filter(Boolean).length ??
  0;

if (branch) {
  const [behind, ahead] = counts?.split(/\s+/u) ?? ['?', '?'];
  lines.push(
    `- Branch \`${branch}\`: ${ahead} ahead / ${behind} behind origin/main (last fetch), ${dirty} uncommitted file(s).`
  );
  if (branch === 'main' || branch === 'develop') {
    warnings.push(
      `You are on \`${branch}\`. Create a feature branch before committing.`
    );
  }
}

const wanted = readFileSync(join(projectDir, '.nvmrc'), 'utf-8')
  .trim()
  .replace(/^v/u, '');
const current = process.versions.node;
if (current.split('.')[0] !== wanted.split('.')[0]) {
  warnings.push(
    `Node ${current} is active but the repo requires ${wanted} (.nvmrc, engineStrict). \`pnpm install\` will refuse to run; switch with \`nvm use\`/\`fnm use\`.`
  );
}

if (!existsSync(join(projectDir, 'node_modules'))) {
  warnings.push('Dependencies are not installed. Run `pnpm install`.');
} else if (!existsSync(join(projectDir, 'packages', 'logger', 'dist'))) {
  warnings.push(
    '`@next/logger` is not built, so type checks fail with "Cannot find module @next/logger/...". Run `pnpm turbo run build --filter=@next/logger`.'
  );
}

// Only existence is checked; the file itself holds secrets and is never read.
if (!existsSync(join(projectDir, 'apps', 'core', '.env'))) {
  lines.push(
    '- `apps/core/.env` is missing: core tests and `dev:local` fail on config validation. `cp apps/core/.env.example apps/core/.env` fixes it for tests.'
  );
}

if (run('docker', ['info', '--format', '{{.ServerVersion}}'], 2500) === null) {
  lines.push(
    '- Docker is not reachable: `@next/core` integration tests (Testcontainers) will not run.'
  );
}

for (const warning of warnings) {
  lines.push(`- WARNING: ${warning}`);
}

lines.push(
  '- Start with AGENTS.md and the AGENTS.md of the app you will touch. Use `/verify` before claiming done.'
);

process.stdout.write(`${lines.join('\n')}\n`);
