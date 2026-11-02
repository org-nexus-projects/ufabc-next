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

const showHelp = () => {
  process.stdout.write(`
Uso: pnpm dev [OPTIONS]

Opciones de apps (pelo menos um obrigatório):
  --web [dev|prod]       Inicia o portal web
  --core                 Inicia a API Core (padrão: jobs ativado)
  --extension [dev|prod] Inicia a extensão browser

Opções adicionais:
  --jobs [on|off]        Ativa/desativa jobs do backend (padrão: on)
  --help                 Mostra esta mensagem

Exemplos:
  pnpm dev --web dev --core --extension prod
  pnpm dev --core --jobs off
  pnpm dev --web prod
  pnpm dev                # Menu interativo
`);
};

const parseCliArgs = (args) => {
  const result = {
    web: null,
    core: false,
    extension: null,
    jobsEnabled: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help') {
      showHelp();
      process.exit(0);
    }

    if (arg === '--web') {
      const next = args[i + 1];
      if (!next || next.startsWith('--')) {
        result.web = 'dev'; // Default to dev
      } else if (['dev', 'prod'].includes(next)) {
        result.web = next;
        i++;
      } else {
        throw new Error(`Valor inválido para --web: "${next}". Esperado: dev ou prod`);
      }
    } else if (arg === '--core') {
      result.core = true;
    } else if (arg === '--extension') {
      const next = args[i + 1];
      if (!next || next.startsWith('--')) {
        result.extension = 'dev'; // Default to dev
      } else if (['dev', 'prod'].includes(next)) {
        result.extension = next;
        i++;
      } else {
        throw new Error(`Valor inválido para --extension: "${next}". Esperado: dev ou prod`);
      }
    } else if (arg === '--jobs') {
      const next = args[i + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('--jobs requer um valor: on ou off');
      } else if (['on', 'off'].includes(next)) {
        result.jobsEnabled = next === 'on';
        i++;
      } else {
        throw new Error(`Valor inválido para --jobs: "${next}". Esperado: on ou off`);
      }
    } else if (!arg.startsWith('--')) {
      throw new Error(`Argumento desconhecido: "${arg}"`);
    }
  }

  return result;
};

const run = async () => {
  // Parse CLI arguments
  const cliArgs = process.argv.slice(2);
  let selectedApps, appTargets, jobsEnabled;

  if (cliArgs.length > 0) {
    // CLI mode
    const cliConfig = parseCliArgs(cliArgs);

    selectedApps = [
      ...(cliConfig.web ? ['web'] : []),
      ...(cliConfig.core ? ['core'] : []),
      ...(cliConfig.extension ? ['extension'] : []),
    ];

    if (selectedApps.length === 0) {
      throw new Error('Nenhuma aplicação selecionada. Use --help para ver as opções.');
    }

    appTargets = new Map();
    if (cliConfig.web) appTargets.set('web', cliConfig.web);
    if (cliConfig.extension) appTargets.set('extension', cliConfig.extension);

    jobsEnabled = cliConfig.jobsEnabled;
  } else {
    // Interactive mode (fallback)
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw new Error('A CLI de desenvolvimento precisa de um terminal interativo. Use pnpm dev --help para ver as opções de CLI.');
    }

    selectedApps = await selectApps();
    if (selectedApps.length === 0) {
      process.stdout.write('\nNenhuma aplicação selecionada.\n');
      return;
    }

    appTargets = new Map();
    for (const app of selectedApps.filter((app) => app !== 'core')) {
      appTargets.set(app, await selectTarget(apps.find(({ id }) => id === app)));
    }

    jobsEnabled = true;
    if (selectedApps.includes('core')) {
      jobsEnabled = await selectJobsEnabled();
    }

    clearScreen();
  }

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
