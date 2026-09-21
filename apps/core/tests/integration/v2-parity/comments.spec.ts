import { writeFileSync } from 'node:fs';

import { startTestStack, type TestStack } from '@next/testing/containers';
import { fastify, type FastifyInstance } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '../../../src/app.js';
import { DEPRECATION_HEADER_VALUE } from '../../../src/constants.js';
import { omitDeep, sortListsDeep } from '../entities/v2-parity/fixtures.js';
import {
  type CasoComments,
  casosComments,
  idsComments,
  RA_ALUNO,
  seedComments,
  snapshotComments,
} from './fixtures-comments.js';

type Resultado = {
  banco: unknown;
  contentType: string | undefined;
  corpo: unknown;
  deprecation: string | undefined;
  status: number;
};

const LIMITE_POR_CHAMADA_MS = 10_000;

describe('paridade V1/V2: comments e reactions', () => {
  let stack: TestStack | undefined;
  let app: FastifyInstance | undefined;
  let tokenAluno = '';
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

    tokenAluno = app.jwt.sign({
      _id: idsComments.userAluno.toHexString(),
      confirmed: true,
      email: 'aluno.teste@aluno.ufabc.edu.br',
      permissions: [],
      ra: RA_ALUNO,
    });
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

  async function executar(
    caso: CasoComments,
    url: string
  ): Promise<Resultado> {
    if (!app) {
      throw new Error('app nao inicializado');
    }

    await seedComments();
    await app.redis.flushdb();

    const ignorar = new Set(caso.ignorar ?? []);

    const limite = new Promise<undefined>((resolve) => {
      setTimeout(() => resolve(undefined), LIMITE_POR_CHAMADA_MS);
    });

    const res = await Promise.race([
      app.inject({
        headers:
          caso.credencial === 'aluno'
            ? { authorization: `Bearer ${tokenAluno}` }
            : {},
        method: caso.method,
        payload: caso.payload,
        url,
      }),
      limite,
    ]);

    if (!res) {
      return {
        banco: omitDeep(await snapshotComments(), ignorar),
        contentType: undefined,
        corpo: 'sem resposta no limite',
        deprecation: undefined,
        status: 0,
      };
    }

    let corpo: unknown = res.body;
    try {
      corpo = JSON.parse(res.body) as unknown;
    } catch {
      corpo = res.body;
    }

    const corpoNormalizado = omitDeep(corpo, ignorar);

    return {
      banco: omitDeep(await snapshotComments(), ignorar),
      contentType: res.headers['content-type']?.toString(),
      corpo:
        caso.ordemIndiferente === true
          ? sortListsDeep(corpoNormalizado)
          : corpoNormalizado,
      deprecation: res.headers.deprecation?.toString(),
      status: res.statusCode,
    };
  }

  it.each(casosComments)('$nome', async (caso) => {
    const v1 = await executar(caso, caso.url);
    const v2 = await executar(caso, `/v2${caso.url}`);

    relatorio.push({ nome: caso.nome, v1, v2 });

    expect(v2.status).toBe(v1.status);
    expect(v2.contentType).toBe(v1.contentType);
    expect(v2.corpo).toEqual(v1.corpo);
    expect(v2.banco).toEqual(v1.banco);
    expect(v1.deprecation).toBe(DEPRECATION_HEADER_VALUE);
    expect(v2.deprecation).toBeUndefined();
  });
});
