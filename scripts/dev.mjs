#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import readline from 'node:readline';

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));
const apps = [
  { id: 'web', label: 'Web', description: 'Portal Vue' },
  { id: 'core', label: 'Core', description: 'API Fastify local' },
  { id: 'extension', label: 'Extension', description: 'Extensão WXT' },
];

const targets = [
  { id: 'dev', label: 'Dev', description: 'backend local' },
  { id: 'prod', label: 'Prod', description: 'backend de produção' },
];

const clearScreen = () => process.stdout.write('\x1Bc');

const withKeypresses = (onKeypress) =>
  new Promise((resolve, reject) => {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const cleanup = () => {
      process.stdin.off('keypress', onKey);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };

    const onKey = (_, key) => {
      if (key.ctrl && key.name === 'c') {
        cleanup();
        reject(new Error('cancelled'));
        return;
      }

      const result = onKeypress(key);
      if (result !== undefined) {
        cleanup();
        resolve(result);
      }
    };

    process.stdin.on('keypress', onKey);
  });

const selectApps = async () => {
  let cursor = 0;
  const selected = new Set();

  const render = () => {
    clearScreen();
    process.stdout.write('Quais aplicações você quer iniciar?\n\n');

    apps.forEach((app, index) => {
      const marker = selected.has(app.id) ? '●' : '○';
      const pointer = index === cursor ? '›' : ' ';
      process.stdout.write(`${pointer} ${marker} ${app.label} — ${app.description}\n`);
    });

    process.stdout.write('\n↑↓ navegar · espaço marcar · Enter confirmar · Ctrl+C sair\n');
  };

  render();
  await withKeypresses((key) => {
    if (key.name === 'up') {
      cursor = (cursor - 1 + apps.length) % apps.length;
      render();
      return;
    }

    if (key.name === 'down') {
      cursor = (cursor + 1) % apps.length;
      render();
      return;
    }

    if (key.name === 'space') {
      const app = apps[cursor];
      selected.has(app.id) ? selected.delete(app.id) : selected.add(app.id);
      render();
      return;
    }

    if (key.name === 'return') {
      return [...selected];
    }
  });

  return [...selected];
};

const selectTarget = async (app) => {
  let cursor = 0;

  const render = () => {
    clearScreen();
    process.stdout.write(`Para onde ${app.label} local deve apontar?\n\n`);

    targets.forEach((target, index) => {
      const pointer = index === cursor ? '›' : ' ';
      process.stdout.write(`${pointer} ${target.label} — ${target.description}\n`);
    });

    process.stdout.write('\n↑↓ navegar · Enter confirmar · Ctrl+C sair\n');
  };

  render();
  return withKeypresses((key) => {
    if (key.name === 'up') {
      cursor = (cursor - 1 + targets.length) % targets.length;
      render();
      return;
    }

    if (key.name === 'down') {
      cursor = (cursor + 1) % targets.length;
      render();
      return;
    }

    if (key.name === 'return') {
      return targets[cursor].id;
    }
  });
};

const selectJobsEnabled = async () => {
  let cursor = 0;
  const options = [
    { id: true, label: 'Ativado', description: 'Jobs e queue worker ativos' },
    { id: false, label: 'Desativado', description: 'Apenas API, sem jobs' },
  ];

  const render = () => {
    clearScreen();
    process.stdout.write('Deseja ativar os jobs do backend?\n\n');

    options.forEach((option, index) => {
      const pointer = index === cursor ? '›' : ' ';
      process.stdout.write(`${pointer} ${option.label} — ${option.description}\n`);
    });

    process.stdout.write('\n↑↓ navegar · Enter confirmar · Ctrl+C sair\n');
  };

  render();
  return withKeypresses((key) => {
    if (key.name === 'up') {
      cursor = (cursor - 1 + options.length) % options.length;
      render();
      return;
    }

    if (key.name === 'down') {
      cursor = (cursor + 1) % options.length;
      render();
      return;
    }

    if (key.name === 'return') {
      return options[cursor].id;
    }
  });
};

const parseEnvFile = () => {
  const file = join(workspaceRoot, '.env');
  const content = readFileSync(file, 'utf8');

  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
        return [key, value];
      }),
  );
};

const getExtensionApiBaseUrl = (target) => {
  const env = parseEnvFile();
  const profile = target === 'dev' ? 'LOCAL' : 'PRODUCTION';
  const key = `WEB_${profile}_API_BASE_URL`;
  const value = env[key];

  if (!value) {
    throw new Error(`A variável ${key} precisa estar definida no .env global.`);
  }

  return value;
};

const commandFor = (app, target, jobsEnabled = true) => {
  if (app === 'core') {
    return {
      args: ['--filter', '@next/core', 'dev'],
      env: { NEXT_JOBS_ENABLED: String(jobsEnabled) },
    };
  }

  if (app === 'web') {
    return {
      args: ['--filter', '@next/web', 'dev'],
      env: { NEXT_WEB_TARGET: target },
    };
  }

  return {
    args: ['--filter', '@next/extension', 'dev'],
    env: { NEXT_API_BASE_URL: getExtensionApiBaseUrl(target) },
  };
};

const run = async () => {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('A CLI de desenvolvimento precisa de um terminal interativo.');
  }

  const selectedApps = await selectApps();
  if (selectedApps.length === 0) {
    process.stdout.write('\nNenhuma aplicação selecionada.\n');
    return;
  }

  const appTargets = new Map();
  for (const app of selectedApps.filter((app) => app !== 'core')) {
    appTargets.set(app, await selectTarget(apps.find(({ id }) => id === app)));
  }

  let jobsEnabled = true;
  if (selectedApps.includes('core')) {
    jobsEnabled = await selectJobsEnabled();
  }

  clearScreen();

  // Build environment variables for all selected apps
  const env = { ...process.env };
  for (const app of selectedApps) {
    const { env: appEnv } = commandFor(app, appTargets.get(app), jobsEnabled);
    Object.assign(env, appEnv);
  }

  // Build turbo filter arguments for selected apps
  const filterArgs = selectedApps.flatMap((app) => ['--filter', `@next/${app}`]);

  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

  const child = spawn(pnpm, ['turbo', 'run', 'dev', ...filterArgs], {
    cwd: workspaceRoot,
    env,
    stdio: 'inherit',
  });

  const stopChild = (signal) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.once('SIGINT', () => stopChild('SIGINT'));
  process.once('SIGTERM', () => stopChild('SIGTERM'));

  child.once('error', () => {
    process.exitCode = 1;
  });

  child.once('exit', (code) => {
    process.exitCode = code ?? 1;
  });
};

run().catch((error) => {
  if (error.message !== 'cancelled') {
    console.error(`\n${error.message}`);
    process.exitCode = 1;
  }
});
