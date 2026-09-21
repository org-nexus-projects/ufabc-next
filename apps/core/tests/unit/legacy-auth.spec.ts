import type { FastifyInstance } from 'fastify';

import fastifyCookie from '@fastify/cookie';
import { fastifyJwt } from '@fastify/jwt';
import fastifySensible from '@fastify/sensible';
import { fastify } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';

import authorizationPlugin from '../../src/plugins/custom/authorization.js';
import errorHandlerPlugin from '../../src/plugins/v2/error-handler.js';
import {
  legacyAdminHook,
  legacyExtensionHook,
  legacyJwtHook,
} from '../../src/hooks/legacy-auth.js';
import { jwtVerifyHook } from '../../src/hooks/jwt-verify.js';

const JWT_SECRET = 'segredo-de-teste';

const NAO_AUTENTICADO = {
  error: 'UnauthorizedError',
  message: 'You must be authenticated to access this route',
  statusCode: 401,
};

const SEM_PERMISSAO = 'You are not authorized to access this resource.';

describe('hooks de compatibilidade da V1', () => {
  let app: FastifyInstance;
  let tokenComum: string;
  let tokenAdmin: string;

  beforeAll(async () => {
    app = fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    await app.register(fastifySensible);
    await app.register(fastifyCookie);
    await app.register(fastifyJwt, { secret: JWT_SECRET });
    await app.register(authorizationPlugin);
    await app.register(errorHandlerPlugin);

    app.get('/jwt', { onRequest: legacyJwtHook }, () => ({ ok: true }));

    app.get(
      '/jwt-validado',
      {
        onRequest: legacyJwtHook,
        schema: { querystring: z.object({ page: z.coerce.number() }) },
      },
      () => ({ ok: true })
    );

    app.get(
      '/v2-atual-validado',
      {
        preHandler: jwtVerifyHook,
        schema: { querystring: z.object({ page: z.coerce.number() }) },
      },
      () => ({ ok: true })
    );

    app.get(
      '/admin',
      { onRequest: legacyJwtHook, preHandler: legacyAdminHook },
      () => ({ ok: true })
    );

    app.get('/extensao', { onRequest: legacyExtensionHook }, () => ({
      ok: true,
    }));

    await app.ready();

    tokenComum = app.jwt.sign({
      _id: '000000000000000000000001',
      confirmed: true,
      email: 'aluno@aluno.ufabc.edu.br',
      permissions: [],
      ra: 11_202_230_000,
    });
    tokenAdmin = app.jwt.sign({
      _id: '000000000000000000000002',
      confirmed: true,
      email: 'admin@aluno.ufabc.edu.br',
      permissions: ['admin'],
      ra: 11_202_230_001,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('legacyJwtHook', () => {
    it('recusa requisicao sem credencial com o corpo exato da V1', async () => {
      const res = await app.inject({ method: 'GET', url: '/jwt' });

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body)).toEqual(NAO_AUTENTICADO);
    });

    it('recusa token invalido com o mesmo corpo', async () => {
      const res = await app.inject({
        headers: { authorization: 'Bearer nao-e-um-jwt' },
        method: 'GET',
        url: '/jwt',
      });

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body)).toEqual(NAO_AUTENTICADO);
    });

    it('aceita token valido e popula request.user', async () => {
      const res = await app.inject({
        headers: { authorization: `Bearer ${tokenComum}` },
        method: 'GET',
        url: '/jwt',
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ ok: true });
    });
  });

  describe('ordem entre autenticacao e validacao', () => {
    it('responde 401 quando falta credencial e a query e invalida', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/jwt-validado?page=nao-e-numero',
      });

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body)).toEqual(NAO_AUTENTICADO);
    });

    it('valida a query somente depois de autenticar', async () => {
      const res = await app.inject({
        headers: { authorization: `Bearer ${tokenComum}` },
        method: 'GET',
        url: '/jwt-validado?page=nao-e-numero',
      });

      expect(res.statusCode).toBe(400);
    });

    it('documenta por que jwtVerifyHook nao serve para rotas migradas', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v2-atual-validado?page=nao-e-numero',
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body)).not.toEqual(NAO_AUTENTICADO);
    });
  });

  describe('legacyAdminHook', () => {
    it('recusa quem nao tem a permissao com 403 em texto puro', async () => {
      const res = await app.inject({
        headers: { authorization: `Bearer ${tokenComum}` },
        method: 'GET',
        url: '/admin',
      });

      expect(res.statusCode).toBe(403);
      expect(res.body).toBe(SEM_PERMISSAO);
    });

    it('recusa antes da permissao quando falta credencial', async () => {
      const res = await app.inject({ method: 'GET', url: '/admin' });

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body)).toEqual(NAO_AUTENTICADO);
    });

    it('aceita quem tem a permissao admin', async () => {
      const res = await app.inject({
        headers: { authorization: `Bearer ${tokenAdmin}` },
        method: 'GET',
        url: '/admin',
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('legacyExtensionHook', () => {
    it('recusa sem sessao com 403 em texto puro', async () => {
      const res = await app.inject({ method: 'GET', url: '/extensao' });

      expect(res.statusCode).toBe(403);
      expect(res.body).toBe(SEM_PERMISSAO);
    });

    it('aceita session-id e propaga para request.sessionId', async () => {
      const res = await app.inject({
        headers: { 'session-id': 'sessao-de-teste' },
        method: 'GET',
        url: '/extensao',
      });

      expect(res.statusCode).toBe(200);
    });

    it('aceita uf-login sem session-id', async () => {
      const res = await app.inject({
        headers: { 'uf-login': 'aluno' },
        method: 'GET',
        url: '/extensao',
      });

      expect(res.statusCode).toBe(200);
    });
  });
});
