#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  cancel,
  confirm,
  isCancel,
  multiselect,
  outro,
  select,
} from '@clack/prompts';
import { Command, InvalidArgumentError } from 'commander';
import { parse } from 'dotenv';

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));
const apps = [
  { hint: 'Portal Vue', id: 'web', label: 'Web' },
  { hint: 'API Fastify local', id: 'core', label: 'Core' },
  { hint: 'Extensão WXT', id: 'extension', label: 'Extension' },
] as const;
const targets = [
  { hint: 'backend local', id: 'dev', label: 'Dev' },
  { hint: 'backend de produção', id: 'prod', label: 'Prod' },
] as const;

type AppId = (typeof apps)[number]['id'];
type Target = (typeof targets)[number]['id'];
type CliOptions = {
  core?: boolean;
  extension?: Target | true;
  install: boolean;
  jobs: boolean;
  web?: Target | true;
};
type LaunchConfig = {
  appTargets: Map<AppId, Target>;
  installDependencies: boolean;
  jobsEnabled: boolean;
  selectedApps: AppId[];
};

function unwrapPrompt<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel('Inicialização cancelada.');
    throw new Error('cancelled');
  }

  return value;
}

function parseTarget(value: string): Target {
  if (value === 'dev' || value === 'prod') {
    return value;
  }

  throw new InvalidArgumentError('esperado: dev ou prod');
}

function parseJobs(value: string): boolean {
  if (value === 'on' || value === 'off') {
    return value === 'on';
  }

  throw new InvalidArgumentError('esperado: on ou off');
}

function readCliOptions(): CliOptions | undefined {
  if (process.argv.length === 2) {
    return undefined;
  }

  const program = new Command()
    .name('pnpm dev')
    .description('Inicia as aplicações do workspace')
    .option('--web [target]', 'inicia o portal web', parseTarget)
    .option('--core', 'inicia a API Core')
    .option('--extension [target]', 'inicia a extensão browser', parseTarget)
    .option(
      '--jobs <state>',
      'ativa ou desativa os jobs do backend',
      parseJobs,
      true
    )
    .option('--no-install', 'não atualiza as dependências antes de iniciar')
    .addHelpText(
      'after',
      `
Exemplos:
  pnpm dev --web dev --core --extension prod
  pnpm dev --core --jobs off
  pnpm dev --web prod
  pnpm dev --core --no-install
  pnpm dev                # Menu interativo`
    );

  program.parse();
  return program.opts<CliOptions>();
}

function configFromCli(options: CliOptions): LaunchConfig {
  const webTarget = options.web === true ? 'dev' : options.web;
  const extensionTarget =
    options.extension === true ? 'dev' : options.extension;
  const selectedApps: AppId[] = [
    ...(webTarget ? (['web'] as const) : []),
    ...(options.core === true ? (['core'] as const) : []),
    ...(extensionTarget ? (['extension'] as const) : []),
  ];

  if (selectedApps.length === 0) {
    throw new Error(
      'Nenhuma aplicação selecionada. Use --help para ver as opções.'
    );
  }

  return {
    appTargets: new Map([
      ...(webTarget ? ([['web', webTarget]] as const) : []),
      ...(extensionTarget ? ([['extension', extensionTarget]] as const) : []),
    ]),
    installDependencies: options.install,
    jobsEnabled: options.jobs,
    selectedApps,
  };
}

async function configFromPrompts(): Promise<LaunchConfig | undefined> {
  const selectedApps = unwrapPrompt(
    await multiselect<AppId>({
      message: 'Quais aplicações você quer iniciar?',
      options: apps.map(({ id: value, label, hint }) => ({
        hint,
        label,
        value,
      })),
      required: false,
      withGuide: false,
    })
  );

  if (selectedApps.length === 0) {
    outro('Nenhuma aplicação selecionada.');
    return undefined;
  }

  const appTargets = new Map<AppId, Target>();
  for (const appId of selectedApps.filter((selected) => selected !== 'core')) {
    const app = apps.find(({ id }) => id === appId);
    const target = unwrapPrompt(
      await select<Target>({
        message: `Para onde ${app?.label} local deve apontar?`,
        options: targets.map(({ id: value, label, hint }) => ({
          hint,
          label,
          value,
        })),
      })
    );
    appTargets.set(appId, target);
  }

  const jobsEnabled = selectedApps.includes('core')
    ? unwrapPrompt(
        await confirm({
          initialValue: true,
          message: 'Deseja ativar os jobs do backend?',
        })
      )
    : true;

  outro('Configuração concluída.');
  return {
    appTargets,
    installDependencies: true,
    jobsEnabled,
    selectedApps,
  };
}

function getExtensionApiBaseUrl(target: Target): string {
  const env = parse(readFileSync(join(workspaceRoot, '.env')));
  const profile = target === 'dev' ? 'LOCAL' : 'PRODUCTION';
  const key = `WEB_${profile}_API_BASE_URL`;
  const value = env[key];

  if (!value) {
    throw new Error(`A variável ${key} precisa estar definida no .env global.`);
  }

  return value;
}

function environmentFor(
  app: AppId,
  target: Target | undefined,
  jobsEnabled: boolean
): NodeJS.ProcessEnv {
  if (app === 'core') {
    return { NEXT_JOBS_ENABLED: String(jobsEnabled) };
  }

  if (!target) {
    throw new Error(`O alvo de ${app} não foi definido.`);
  }

  return app === 'web'
    ? { NEXT_WEB_TARGET: target }
    : { NEXT_API_BASE_URL: getExtensionApiBaseUrl(target) };
}

async function runProcess(args: string[]): Promise<void> {
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const child = spawn(pnpm, args, {
    cwd: workspaceRoot,
    env: process.env,
    stdio: 'inherit',
  });

  await once(child, 'exit');
  if (child.exitCode !== 0) {
    throw new Error(`pnpm ${args[0]} falhou (código ${child.exitCode})`);
  }
}

async function installDependencies(selectedApps: AppId[]): Promise<void> {
  process.stdout.write('\n📦 Atualizando dependências (pnpm i)...\n\n');

  const filterArgs = selectedApps.flatMap((app) => [
    '--filter',
    `@next/${app}...`,
  ]);

  await runProcess(['install', ...filterArgs]);
}

async function run(): Promise<void> {
  const cliOptions = readCliOptions();
  const config = cliOptions
    ? configFromCli(cliOptions)
    : await configFromPrompts();

  if (!config) {
    return;
  }

  if (config.installDependencies) {
    await installDependencies(config.selectedApps);
  }

  const env = { ...process.env };
  for (const app of config.selectedApps) {
    Object.assign(
      env,
      environmentFor(app, config.appTargets.get(app), config.jobsEnabled)
    );
  }

  const filterArgs = config.selectedApps.flatMap((app) => [
    '--filter',
    `@next/${app}`,
  ]);
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const child = spawn(pnpm, ['turbo', 'run', 'dev', ...filterArgs], {
    cwd: workspaceRoot,
    env,
    stdio: 'inherit',
  });

  function stopChild(signal: NodeJS.Signals) {
    if (!child.killed) {
      child.kill(signal);
    }
  }

  process.once('SIGINT', () => {
    stopChild('SIGINT');
  });
  process.once('SIGTERM', () => {
    stopChild('SIGTERM');
  });

  await once(child, 'exit');
  process.exitCode = child.exitCode ?? 1;
}

try {
  await run();
} catch (error: unknown) {
  if (error instanceof Error && error.message !== 'cancelled') {
    console.error(`\n${error.message}`);
    process.exitCode = 1;
  }
}
