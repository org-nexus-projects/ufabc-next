import { writeFileSync } from 'node:fs';

import { startTestStack, type TestStack } from '@next/testing/containers';
import { fastify, type FastifyInstance } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../../src/app.js';
import { DEPRECATION_HEADER_VALUE } from '../../../src/constants.js';
import {
  omitDeep,
  toPlainJson,
} from '../entities/v2-parity/fixtures.js';
import {
  type CasoUsers,
  casosUsers,
  type CredencialUsers,
  EMAIL_PENDENTE,
  idsUsers,
  RA_ADMIN,
  RA_ALUNO,
  RA_PENDENTE,
  seedUsers,
  simularParser,
  snapshotUsers,
  TOKEN_CONFIRMACAO,
} from './fixtures-users.js';

type Resultado = {
  banco: unknown;
  contentType: string | undefined;
  corpo: unknown;
  deprecation: string | undefined;
  jobs: unknown;
  status: number;
};

const LIMITE_POR_CHAMADA_MS = 10_000;

function decodificarJwt(app: FastifyInstance, valor: string) {
  try {
    return app.jwt.decode<Record<string, unknown>>(valor);
  } catch {
    return null;
  }
}

function normalizarJwt(app: FastifyInstance, valor: unknown): unknown {
  if (typeof valor === 'string' && /^[\w-]+\.[\w-]+\.[\w-]+$/u.test(valor)) {
    const payload = decodificarJwt(app, valor);

    if (payload) {
      return omitDeep(payload, new Set(['iat', 'exp']));
    }
  }

  if (Array.isArray(valor)) {
    return valor.map((item: unknown) => normalizarJwt(app, item));
  }

  if (valor !== null && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([chave, item]: [string, unknown]) => [
        chave,
        normalizarJwt(app, item),
      ])
    );
  }

  return valor;
}

describe('paridade V1/V2: users, help e sync', () => {
  let stack: TestStack | undefined;
  let app: FastifyInstance | undefined;
  let tokenConfirmacao = '';
  const cabecalhos = new Map<CredencialUsers, Record<string, string>>();
  const relatorio: Array<{ nome: string; v1: Resultado; v2: Resultado }> = [];
  const ambienteAnterior: Array<[string, string | undefined]> = [];

  beforeAll(async () => {
    stack = await startTestStack();

    const conexoes = {
      ...stack.config,
      MONGODB_CONNECTION_URL: `${stack.config.MONGODB_CONNECTION_URL}/?directConnection=true`,
    };

    for (const [chave, valor] of Object.entries(conexoes)) {
      ambienteAnterior.push([chave, process.env[chave]]);
      process.env[chave] = String(valor);
    }

    app = fastify({ logger: false, pluginTimeout: 60_000 });
    await app.register(fp(buildApp), {
      config: { ...conexoes, NODE_ENV: 'test' },
    });
    await app.ready();

    expect(app.config.MONGODB_CONNECTION_URL).toBe(
      conexoes.MONGODB_CONNECTION_URL
    );
    expect(app.config.REDIS_CONNECTION_URL).toBe(
      conexoes.REDIS_CONNECTION_URL
    );

    const instancia = app;
    const assinar = (
      id: (typeof idsUsers)[keyof typeof idsUsers],
      ra: number | undefined,
      email: string | undefined,
      confirmed: boolean,
      permissions: string[]
    ) =>
      `Bearer ${instancia.jwt.sign({
        _id: id.toHexString(),
        confirmed,
        email: email ?? '',
        permissions,
        ra: ra ?? 0,
      })}`;

    cabecalhos.set('aluno', {
      authorization: assinar(idsUsers.aluno, RA_ALUNO, 'aluno.teste@aluno.ufabc.edu.br', true, []),
    });
    cabecalhos.set('pendente', {
      authorization: assinar(idsUsers.pendente, RA_PENDENTE, EMAIL_PENDENTE, false, []),
    });
    cabecalhos.set('oauth', {
      authorization: assinar(idsUsers.oauth, undefined, undefined, false, []),
    });
    cabecalhos.set('admin', {
      authorization: assinar(idsUsers.admin, RA_ADMIN, 'admin.next@ufabc.edu.br', true, ['admin']),
    });

    tokenConfirmacao = app.createToken(
      JSON.stringify({ email: EMAIL_PENDENTE }),
      app.config
    );
  }, 240_000);

  afterAll(async () => {
    const destino = process.env.PARITY_REPORT;

    if (destino) {
      writeFileSync(destino, JSON.stringify(relatorio, null, 2));
    }

    await app?.close();
    await stack?.stop();

    for (const [chave, valor] of ambienteAnterior) {
      if (valor === undefined) {
        Reflect.deleteProperty(process.env, chave);
      } else {
        process.env[chave] = valor;
      }
    }
  });

  async function executar(caso: CasoUsers, url: string): Promise<Resultado> {
    if (!app) {
      throw new Error('app nao inicializado');
    }

    const instancia = app;

    await seedUsers();
    await instancia.redis.flushdb();

    simularParser();

    const jobs: unknown[] = [];
    vi.spyOn(instancia.job, 'dispatch').mockImplementation(
      async (nome, dados) => {
        jobs.push({ dados: toPlainJson(dados), nome });

        if (caso.falharJob === true) {
          throw new Error('fila indisponivel');
        }

        return { id: 'job-simulado' } as never;
      }
    );

    const ignorar = new Set(caso.ignorar ?? []);
    const payload =
      typeof caso.payload === 'object' && caso.payload.token === TOKEN_CONFIRMACAO
        ? { token: tokenConfirmacao }
        : caso.payload;

    const limite = new Promise<undefined>((resolve) => {
      setTimeout(() => resolve(undefined), LIMITE_POR_CHAMADA_MS);
    });

    const res = await Promise.race([
      instancia.inject({
        headers: {
          ...(caso.credencial === undefined
            ? {}
            : cabecalhos.get(caso.credencial)),
          ...caso.headers,
        },
        method: caso.method,
        payload,
        url,
      }),
      limite,
    ]);

    const banco = omitDeep(await snapshotUsers(), ignorar);
    const jobsNormalizados = omitDeep(jobs, ignorar);

    vi.restoreAllMocks();

    if (!res) {
      return {
        banco,
        contentType: undefined,
        corpo: 'sem resposta no limite',
        deprecation: undefined,
        jobs: jobsNormalizados,
        status: 0,
      };
    }

    let corpo: unknown = res.body;
    try {
      corpo = JSON.parse(res.body) as unknown;
    } catch {
      corpo = res.body;
    }

    return {
      banco,
      contentType: res.headers['content-type']?.toString(),
      corpo: omitDeep(normalizarJwt(instancia, corpo), ignorar),
      deprecation: res.headers.deprecation?.toString(),
      jobs: jobsNormalizados,
      status: res.statusCode,
    };
  }

  it.each(casosUsers)('$nome', async (caso) => {
    const v1 = await executar(caso, caso.url);
    const v2 = await executar(caso, `/v2${caso.url}`);

    relatorio.push({ nome: caso.nome, v1, v2 });

    expect(v2.status).toBe(v1.status);
    expect(v2.contentType).toBe(v1.contentType);
    expect(v2.corpo).toEqual(v1.corpo);
    expect(v2.banco).toEqual(v1.banco);
    expect(v2.jobs).toEqual(v1.jobs);
    if (caso.semDeprecation === true) {
      expect(v1.deprecation).toBeUndefined();
    } else if (v1.status !== 0) {
      expect(v1.deprecation).toBe(DEPRECATION_HEADER_VALUE);
    }
    expect(v2.deprecation).toBeUndefined();
  });
});
