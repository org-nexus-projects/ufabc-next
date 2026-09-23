import { writeFileSync } from 'node:fs';

import { startTestStack, type TestStack } from '@next/testing/containers';
import { fastify, type FastifyInstance } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../../src/app.js';
import { DEPRECATION_HEADER_VALUE } from '../../../src/constants.js';
import { omitDeep, toPlainJson } from '../entities/v2-parity/fixtures.js';
import {
  type CasoLogin,
  casosLogin,
  encerrarSimulacaoGoogle,
  seedLogin,
  simularGoogle,
  snapshotLogin,
} from './fixtures-login.js';

vi.mock('ofetch', async (importOriginal) => {
  const original = await importOriginal<typeof import('ofetch')>();
  const { simulacaoOfetch } = await import('./simulacao-ofetch.js');

  const substituto = Object.assign(
    async (url: string, opcoes?: { headers?: Headers }) =>
      simulacaoOfetch.resposta
        ? simulacaoOfetch.resposta(url, opcoes)
        : original.ofetch(url, opcoes),
    original.ofetch
  );

  return { ...original, ofetch: substituto };
});

type Resultado = {
  banco: unknown;
  contentType: string | undefined;
  corpo: unknown;
  cookies: unknown;
  deprecation: string | undefined;
  jobs: unknown;
  location: unknown;
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
      const validade =
        typeof payload.exp === 'number' && typeof payload.iat === 'number'
          ? payload.exp - payload.iat
          : null;

      return { jwt: omitDeep(payload, new Set(['iat', 'exp'])), validade };
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

function normalizarLocation(app: FastifyInstance, location: unknown) {
  if (typeof location !== 'string') {
    return location;
  }

  const url = new URL(location);

  return {
    destino: `${url.origin}${url.pathname}`,
    parametros: normalizarJwt(app, Object.fromEntries(url.searchParams)),
  };
}

describe('paridade V1/V2: login', () => {
  let stack: TestStack | undefined;
  let app: FastifyInstance | undefined;
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

  async function executar(caso: CasoLogin, url: string): Promise<Resultado> {
    if (!app) {
      throw new Error('app nao inicializado');
    }

    const instancia = app;

    await seedLogin();
    await instancia.redis.flushdb();

    simularGoogle(instancia.google.oauth2);

    const jobs: unknown[] = [];
    vi.spyOn(instancia.job, 'dispatch').mockImplementation(
      async (nome, dados) => {
        jobs.push({ dados: toPlainJson(dados), nome });
        return { id: 'job-simulado' } as never;
      }
    );

    const ignorar = new Set(caso.ignorar ?? []);

    const limite = new Promise<undefined>((resolve) => {
      setTimeout(() => resolve(undefined), LIMITE_POR_CHAMADA_MS);
    });

    const res = await Promise.race([
      instancia.inject({ method: caso.method, payload: caso.payload, url }),
      limite,
    ]);

    const banco = omitDeep(await snapshotLogin(), ignorar);

    vi.restoreAllMocks();
    encerrarSimulacaoGoogle();

    if (!res) {
      return {
        banco,
        contentType: undefined,
        corpo: 'sem resposta no limite',
        cookies: undefined,
        deprecation: undefined,
        jobs,
        location: undefined,
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
      corpo: normalizarJwt(instancia, corpo),
      cookies: res.headers['set-cookie'],
      deprecation: res.headers.deprecation?.toString(),
      jobs,
      location: normalizarLocation(instancia, res.headers.location),
      status: res.statusCode,
    };
  }

  it.each(casosLogin)('$nome', async (caso) => {
    const v1 = await executar(caso, caso.url);
    const v2 = await executar(caso, `/v2${caso.url}`);

    relatorio.push({ nome: caso.nome, v1, v2 });

    expect(v2.status).toBe(v1.status);
    expect(v2.contentType).toBe(v1.contentType);
    expect(v2.corpo).toEqual(v1.corpo);
    expect(v2.location).toEqual(v1.location);
    expect(v2.cookies).toEqual(v1.cookies);
    expect(v2.banco).toEqual(v1.banco);
    expect(v2.jobs).toEqual(v1.jobs);
    if (v1.status !== 0) {
      expect(v1.deprecation).toBe(DEPRECATION_HEADER_VALUE);
    }
    expect(v2.deprecation).toBeUndefined();
  });
});
