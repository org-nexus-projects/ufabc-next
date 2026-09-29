// Shared helpers for Claude Code hooks. Hooks receive a JSON payload on stdin and
// answer on stdout; see https://docs.claude.com/en/docs/claude-code/hooks.
import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

export const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

export function readInput() {
  try {
    return JSON.parse(readFileSync(0, 'utf-8'));
  } catch {
    return {};
  }
}

export function toRepoPath(filePath) {
  const absolute = isAbsolute(filePath)
    ? filePath
    : resolve(projectDir, filePath);
  return relative(projectDir, absolute).split('\\').join('/');
}

// Plaintext env files hold production credentials. apps/container/.env* are committed
// public VITE_* values, and .env.example is a template, so both stay readable.
export function isSecretPath(repoPath) {
  const path = repoPath.replace(/^\.\//u, '');
  if (path.startsWith('.gitsecret/keys/') || path === '.gitsecret/keys') {
    return true;
  }
  const name = path.split('/').pop() ?? '';
  if (!/^\.env(\..+)?$/u.test(name)) {
    return false;
  }
  if (name === '.env.example' || name.endsWith('.secret')) {
    return false;
  }
  return !path.startsWith('apps/container/');
}

const GENERATED_PATTERNS = [
  /(^|\/)auto-imports\.d\.ts$/u,
  /(^|\/)components\.d\.ts$/u,
  /(^|\/)node_modules\//u,
  /(^|\/)dist\//u,
  /(^|\/)\.output\//u,
  /(^|\/)\.wxt\//u,
  /(^|\/)\.turbo\//u,
  /^pnpm-lock\.yaml$/u,
];

export function isGeneratedPath(repoPath) {
  return GENERATED_PATTERNS.some((pattern) => pattern.test(repoPath));
}

export function decide(decision, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: decision,
        permissionDecisionReason: reason,
      },
    })
  );
  process.exit(0);
}
