// Regression tests for the harness hooks. Run with:
//   node --test .claude/hooks/hooks.test.mjs
// Each case feeds a Claude Code hook payload on stdin and checks the decision.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const hooksDir = import.meta.dirname;
const projectDir = join(hooksDir, '..', '..');

function runHook(hook, payload) {
  const result = spawnSync('node', [join(hooksDir, hook)], {
    cwd: projectDir,
    encoding: 'utf-8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
    input: JSON.stringify(payload),
  });
  assert.equal(result.status, 0, result.stderr);
  if (result.stdout.trim() === '') {
    return 'allow';
  }
  return JSON.parse(result.stdout).hookSpecificOutput.permissionDecision;
}

function bash(command) {
  return runHook('guard-bash.mjs', {
    tool_input: { command },
    tool_name: 'Bash',
  });
}

function file(toolName, filePath) {
  const key = toolName === 'Grep' ? 'path' : 'file_path';
  return runHook('protect-files.mjs', {
    tool_input: { [key]: filePath },
    tool_name: toolName,
  });
}

describe('guard-bash', () => {
  const cases = [
    // Secrets
    ['cat apps/core/.env', 'deny'],
    ['grep MONGO apps/core/.env.prod', 'deny'],
    ['cat apps/extension/.env.local', 'deny'],
    ['ls .gitsecret/keys', 'deny'],
    ['git secret reveal', 'deny'],
    ['cp apps/core/.env.example apps/core/.env', 'allow'],
    ['cat apps/core/.env.example', 'allow'],
    ['cat apps/container/.env.production', 'allow'],
    // Review bypass and publishing
    ['git commit -m "x" --no-verify', 'deny'],
    ['git push -f origin feat/x', 'deny'],
    ['git push --force origin feat/x', 'deny'],
    ['git push origin main', 'deny'],
    ['git push origin HEAD:develop', 'deny'],
    ['pnpm publish', 'deny'],
    ['pnpm exec wxt submit', 'deny'],
    ['git push -u origin feat/x', 'allow'],
    ['git push --force-with-lease origin feat/x', 'ask'],
    // Destructive local operations
    ['git reset --hard HEAD~1', 'ask'],
    ['git clean -fd', 'ask'],
    ['git branch -D feat/x', 'ask'],
    ['docker compose down -v', 'ask'],
    ['docker volume prune', 'ask'],
    ['docker compose down', 'allow'],
    ['rm -rf apps/core/src', 'ask'],
    ['rm -rf node_modules apps/core/dist', 'allow'],
    ['rm -rf .turbo && pnpm build', 'allow'],
    ['rm apps/core/src/tmp.ts', 'allow'],
    ["mongosh ufabc --eval 'db.users.deleteMany({})'", 'ask'],
    // Dependencies and GitHub side effects
    ['pnpm add zod', 'ask'],
    ['pnpm --filter @next/core add zod', 'ask'],
    ['pnpm install lodash', 'ask'],
    ['pnpm install', 'allow'],
    ['pnpm install --frozen-lockfile', 'allow'],
    ['gh pr merge 12', 'ask'],
    ['gh pr create --draft', 'allow'],
    // Everyday commands
    ['pnpm turbo run lint tsc --filter=@next/core', 'allow'],
    ['git status', 'allow'],
  ];

  for (const [command, expected] of cases) {
    it(`${expected}: ${command}`, () => {
      assert.equal(bash(command), expected);
    });
  }
});

describe('protect-files', () => {
  const cases = [
    ['Read', 'apps/core/.env', 'deny'],
    ['Read', 'apps/core/.env.staging', 'deny'],
    ['Read', 'apps/extension/.env', 'deny'],
    ['Read', '.gitsecret/keys/pubring.kbx', 'deny'],
    ['Grep', 'apps/core/.env.prod', 'deny'],
    ['Read', 'apps/core/.env.example', 'allow'],
    ['Read', 'apps/container/.env.development', 'allow'],
    ['Read', 'apps/core/.env.prod.secret', 'allow'],
    ['Edit', 'apps/core/.env.prod.secret', 'deny'],
    ['Edit', 'apps/container/auto-imports.d.ts', 'deny'],
    ['Write', 'pnpm-lock.yaml', 'deny'],
    ['Edit', 'packages/logger/dist/index.js', 'deny'],
    ['Read', 'pnpm-lock.yaml', 'allow'],
    ['Edit', 'apps/core/src/app.ts', 'allow'],
    ['Read', '/etc/hosts', 'allow'],
  ];

  for (const [toolName, filePath, expected] of cases) {
    it(`${expected}: ${toolName} ${filePath}`, () => {
      assert.equal(file(toolName, filePath), expected);
    });
  }
});
