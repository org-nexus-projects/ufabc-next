#!/usr/bin/env node
// PreToolUse(Bash): deny commands that leak secrets or bypass review, and ask the
// user before commands that destroy local work or change dependencies.
import { decide, isSecretPath, readInput } from './lib.mjs';

const input = readInput();
const command = input.tool_input?.command;

if (typeof command !== 'string' || command.trim().length === 0) {
  process.exit(0);
}

const ENV_SETUP = /^\s*cp\s+\S*\.env\.example\s+\S*\.env\s*$/u;
const pathTokens =
  command.match(/[\w@./~-]*\.(?:env|gitsecret)[\w./-]*/gu) ?? [];
const secretToken = pathTokens.find((token) =>
  isSecretPath(token.replace(/^~\//u, ''))
);

if (secretToken && !ENV_SETUP.test(command)) {
  decide(
    'deny',
    `The command touches ${secretToken}, which holds secrets. Use apps/core/.env.example for variable names and ask the user for values.`
  );
}

const DENY = [
  [
    /\bgit[\s-]+secret\s+(reveal|cat)\b/u,
    'Decrypting git-secret files is reserved for maintainers. Ask the user.',
  ],
  [
    /--no-verify\b/u,
    'Do not skip git hooks. Fix the reported problem instead.',
  ],
  [
    /\bgit\s+push\b(?=.*\s(-f|--force)(\s|$))/u,
    'Force-push is blocked. Use --force-with-lease on your own branch, and only when the user asked for it.',
  ],
  [
    /\bgit\s+push\b.*(\s|:)(main|develop)(\s|$)/u,
    'Pushing to main/develop deploys to production/staging. Push a feature branch and open a PR.',
  ],
  [
    /\b(npm|pnpm)\s+publish\b|\bwxt\s+submit\b/u,
    'Publishing is done by CI (release-extension.yml). Do not publish from a local machine.',
  ],
];

for (const [pattern, reason] of DENY) {
  if (pattern.test(command)) {
    decide('deny', reason);
  }
}

const ASK = [
  [
    /\bgit\s+(reset\s+--hard|clean\s+-\w*f|checkout\s+--\s+\.|restore\s+(--\S+\s+)*\.(\s|$)|branch\s+-D|stash\s+(drop|clear))/u,
    'This discards local work that may not be yours.',
  ],
  [
    /\bgit\s+push\b.*--force-with-lease/u,
    'Force-with-lease rewrites the remote branch.',
  ],
  [
    /\bdocker(\s+compose|-compose)\b.*\bdown\b.*\s(-v|--volumes)\b|\bdocker\s+(volume\s+(rm|prune)|system\s+prune)/u,
    'This deletes local MongoDB/Redis/LocalStack data.',
  ],
  [
    /\bpnpm\s+(?:(?:--filter|-F|-C|--dir)\s+\S+\s+|-w\s+|--workspace-root\s+)*(add|remove|rm|uninstall|up|update|upgrade)\b|\bpnpm\s+(i|install)\s+(?:--?\S+\s+)*[^-\s]/u,
    'Dependency changes are an "Ask first" item in AGENTS.md (versions live in the pnpm catalog).',
  ],
  [
    /\bgh\s+(pr\s+(merge|close)|release\s+create|workflow\s+run|repo\s+delete)\b/u,
    'This acts on GitHub on behalf of the user.',
  ],
  [
    /\bmongo(sh)?\b.*\b(dropDatabase|dropCollection|deleteMany|drop\(\))/u,
    'This deletes database data.',
  ],
];

const BUILD_OUTPUT =
  /^(\.\/)?([\w@.-]+\/)*(node_modules|dist|\.turbo|\.output|\.wxt|coverage)\/?$/u;

for (const segment of command.split(/&&|\|\||[;|\n]/u)) {
  const args = segment.trim().split(/\s+/u);
  const rmIndex = args.findIndex((arg) => arg === 'rm' || arg.endsWith('/rm'));
  if (rmIndex === -1) {
    continue;
  }
  const rest = args.slice(rmIndex + 1);
  const recursive = rest.some(
    (arg) => /^-\w*[rR]/u.test(arg) || arg === '--recursive'
  );
  const targets = rest.filter((arg) => !arg.startsWith('-'));
  if (recursive && !targets.every((target) => BUILD_OUTPUT.test(target))) {
    decide('ask', 'Recursive delete outside build output directories.');
  }
}

for (const [pattern, reason] of ASK) {
  if (pattern.test(command)) {
    decide('ask', reason);
  }
}

process.exit(0);
