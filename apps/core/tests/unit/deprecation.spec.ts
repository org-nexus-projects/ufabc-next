import type { FastifyInstance } from 'fastify';

import { fastify } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  DEPRECATION_HEADER_VALUE,
  DEPRECATION_LOG_MESSAGE,
  DEPRECATION_METRIC_FAILED_MESSAGE,
  DEPRECATION_METRIC_TTL,
} from '../../src/constants.js';
import {
  deprecationMetricKey,
  registerDeprecationNotice,
} from '../../src/hooks/deprecation.js';

type LinhaDeLog = {
  deprecation?: {
    method: string;
    ra?: number;
    route: string;
    status: number;
    traceId: string;
  };
  msg: string;
};

type Incremento = { key: string; ttl: string };

const TRACE_ID = 'trace-fixo-para-teste';

describe('deprecationMetricKey', () => {
  it('usa o template da rota e o dia, sem identificadores', () => {
    const chave = deprecationMetricKey(
      'GET',
      '/comments/:teacherId/:subjectId',
      new Date('2026-09-13T23:45:00.000Z')
    );

    expect(chave).toBe(
      'deprecation:v1:2026-09-13:GET:/comments/:teacherId/:subjectId'
    );
  });

  it('mantem a mesma chave para requisicoes diferentes da mesma rota', () => {
    const momento = new Date('2026-09-13T10:00:00.000Z');
    const primeira = deprecationMetricKey('GET', '/users/validate/:ra', momento);
    const segunda = deprecationMetricKey('GET', '/users/validate/:ra', momento);

    expect(primeira).toBe(segunda);
  });
});

describe('registerDeprecationNotice', () => {
  let app: FastifyInstance;
  let logs: LinhaDeLog[];
  let incrementos: Incremento[];
  let redisFalha: boolean;

  beforeEach(async () => {
    logs = [];
    incrementos = [];
    redisFalha = false;

    app = fastify({
      genReqId: () => TRACE_ID,
      logger: {
        hooks: {
          logMethod(args, method) {
            const [primeiro, segundo] = args as [unknown, unknown];

            if (typeof primeiro === 'object' && primeiro !== null) {
              logs.push({
                ...(primeiro as Omit<LinhaDeLog, 'msg'>),
                msg: String(segundo),
              });
            }

            return method.apply(this, args as never);
          },
        },
        level: 'warn',
      },
    });

    app.decorateRequest('redisService', {
      getter: () => ({
        increment: (key: string, ttl: string) => {
          if (redisFalha) {
            return Promise.reject(new Error('redis indisponivel'));
          }

          incrementos.push({ key, ttl });

          return Promise.resolve(incrementos.length);
        },
      }),
    });

    await app.register(async (escopo) => {
      registerDeprecationNotice(escopo);

      escopo.addHook('onRequest', async (request, reply) => {
        if (request.headers['sem-credencial'] === 'sim') {
          return reply.code(401).send({ message: 'sem credencial' });
        }

        if (request.headers['com-usuario'] === 'sim') {
          request.user = { ra: 11_202_230_000 } as never;
        }
      });

      escopo.get('/legado', () => ({ ok: true }));
      escopo.get('/legado/silencioso', { logLevel: 'silent' }, () => ({
        ok: true,
      }));
      escopo.get('/legado/:recurso', () => ({ ok: true }));
      escopo.get('/legado/explode', () => {
        throw new Error('falha proposital');
      });
    });

    app.get('/fora-da-v1', () => ({ ok: true }));

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  function avisos() {
    return logs.filter((linha) => linha.msg === DEPRECATION_LOG_MESSAGE);
  }

  describe('header Deprecation', () => {
    it('marca uma resposta de sucesso', async () => {
      const res = await app.inject({ method: 'GET', url: '/legado' });

      expect(res.statusCode).toBe(200);
      expect(res.headers.deprecation).toBe(DEPRECATION_HEADER_VALUE);
    });

    it('marca tambem a falha de autenticacao', async () => {
      const res = await app.inject({
        headers: { 'sem-credencial': 'sim' },
        method: 'GET',
        url: '/legado',
      });

      expect(res.statusCode).toBe(401);
      expect(res.headers.deprecation).toBe(DEPRECATION_HEADER_VALUE);
    });

    it('marca tambem uma resposta de erro do handler', async () => {
      const res = await app.inject({ method: 'GET', url: '/legado/explode' });

      expect(res.statusCode).toBe(500);
      expect(res.headers.deprecation).toBe(DEPRECATION_HEADER_VALUE);
    });

    it('marca a rota com logLevel silent', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/legado/silencioso',
      });

      expect(res.headers.deprecation).toBe(DEPRECATION_HEADER_VALUE);
    });

    it('nao marca rotas fora da V1', async () => {
      const res = await app.inject({ method: 'GET', url: '/fora-da-v1' });

      expect(res.statusCode).toBe(200);
      expect(res.headers.deprecation).toBeUndefined();
    });
  });

  describe('registro estruturado', () => {
    it('emite um warn com metodo, template e traceId', async () => {
      await app.inject({ method: 'GET', url: '/legado/valor-qualquer' });

      expect(avisos()).toHaveLength(1);
      expect(avisos()[0]?.deprecation).toMatchObject({
        method: 'GET',
        route: '/legado/:recurso',
        status: 200,
        traceId: TRACE_ID,
      });
    });

    it('nao desaparece quando a rota usa logLevel silent', async () => {
      await app.inject({ method: 'GET', url: '/legado/silencioso' });

      expect(avisos()).toHaveLength(1);
      expect(avisos()[0]?.deprecation?.route).toBe('/legado/silencioso');
    });

    it('registra o ra quando ha usuario autenticado', async () => {
      await app.inject({
        headers: { 'com-usuario': 'sim' },
        method: 'GET',
        url: '/legado',
      });

      expect(avisos()[0]?.deprecation?.ra).toBe(11_202_230_000);
    });

    it('omite o ra quando nao ha usuario', async () => {
      await app.inject({ method: 'GET', url: '/legado' });

      expect(avisos()[0]?.deprecation?.ra).toBeUndefined();
    });

    it('registra tambem a falha de autenticacao', async () => {
      await app.inject({
        headers: { 'sem-credencial': 'sim' },
        method: 'GET',
        url: '/legado',
      });

      expect(avisos()[0]?.deprecation?.status).toBe(401);
    });
  });

  describe('contador diario em Redis', () => {
    it('incrementa uma vez por requisicao, com TTL', async () => {
      await app.inject({ method: 'GET', url: '/legado' });

      expect(incrementos).toHaveLength(1);
      expect(incrementos[0]?.ttl).toBe(DEPRECATION_METRIC_TTL);
    });

    it('usa o template da rota, sem o valor do parametro', async () => {
      await app.inject({ method: 'GET', url: '/legado/12345' });

      expect(incrementos[0]?.key).toContain('/legado/:recurso');
      expect(incrementos[0]?.key).not.toContain('12345');
    });

    it('agrupa requisicoes diferentes da mesma rota na mesma chave', async () => {
      await app.inject({ method: 'GET', url: '/legado/aaa' });
      await app.inject({ method: 'GET', url: '/legado/bbb' });

      expect(incrementos).toHaveLength(2);
      expect(incrementos[0]?.key).toBe(incrementos[1]?.key);
    });

    it('conta tambem a falha de autenticacao', async () => {
      await app.inject({
        headers: { 'sem-credencial': 'sim' },
        method: 'GET',
        url: '/legado',
      });

      expect(incrementos).toHaveLength(1);
    });

    it('nao conta rotas fora da V1', async () => {
      await app.inject({ method: 'GET', url: '/fora-da-v1' });

      expect(incrementos).toHaveLength(0);
    });
  });

  describe('falha da metrica', () => {
    it('nao altera o status nem o corpo da resposta', async () => {
      redisFalha = true;

      const res = await app.inject({ method: 'GET', url: '/legado' });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ ok: true });
    });

    it('mantem o header e o warn de depreciacao', async () => {
      redisFalha = true;

      const res = await app.inject({ method: 'GET', url: '/legado' });

      expect(res.headers.deprecation).toBe(DEPRECATION_HEADER_VALUE);
      expect(avisos()).toHaveLength(1);
    });

    it('registra a falha em separado', async () => {
      redisFalha = true;

      await app.inject({ method: 'GET', url: '/legado' });

      const falhas = logs.filter(
        (linha) => linha.msg === DEPRECATION_METRIC_FAILED_MESSAGE
      );

      expect(falhas).toHaveLength(1);
    });
  });
});
