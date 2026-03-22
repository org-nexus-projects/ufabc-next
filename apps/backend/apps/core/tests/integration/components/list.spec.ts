import { startTestStack, type TestStack } from '@next/testing/containers';
import { fastify, type FastifyInstance } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { buildApp } from '../../../src/app.js';
import { ComponentModel } from '../../../src/models/Component.js';
import { TeacherModel } from '../../../src/models/Teacher.js';
import { SubjectModel } from '../../../src/models/Subject.js';

describe('GET /v2/components', () => {
  let stack: TestStack;
  let app: FastifyInstance;
  const TEST_SEASON = '2025:1';
  let testTeacherIds: string[] = [];
  let testSubjectId: string | null = null;

  beforeAll(async () => {
    stack = await startTestStack();
    app = fastify({ logger: false });

    await app.register(fp(buildApp), {
      config: { ...stack.config, NODE_ENV: 'test' },
    });

    await app.ready();

    // Setup test data
    const teacher1 = await TeacherModel.create({
      name: 'Dr. Theory Teacher',
    });
    testTeacherIds.push(teacher1._id.toString());

    const teacher2 = await TeacherModel.create({
      name: 'Dr. Practice Teacher',
    });
    testTeacherIds.push(teacher2._id.toString());

    const subject = await SubjectModel.create({
      name: 'Test Subject',
      search: 'Test Subject',
      uf_subject_code: ['TEST001'],
      creditos: 4,
    });
    testSubjectId = subject._id.toString();

    await ComponentModel.create({
      disciplina_id: 12345,
      disciplina: 'Test Component',
      turno: 'diurno',
      turma: 'A',
      vagas: 40,
      codigo: 'TEST001-A',
      campus: 'sbc',
      uf_cod_turma: '1234',
      year: 2025,
      quad: 1,
      season: TEST_SEASON,
      subject: subject._id,
      teoria: teacher1._id,
      pratica: teacher2._id,
      alunos_matriculados: [1, 2, 3],
      groupURL: 'https://chat.whatsapp.com/test',
    });
  });

  afterAll(async () => {
    // Clean up test data
    await ComponentModel.deleteMany({ season: TEST_SEASON });
    if (testTeacherIds.length > 0) {
      await TeacherModel.deleteMany({ _id: { $in: testTeacherIds } });
    }
    if (testSubjectId) {
      await SubjectModel.deleteOne({ _id: testSubjectId });
    }

    await app.close();
    await stack.stop();
  });

  async function getJwtToken() {
    const res = await app.inject({
      method: 'POST',
      url: '/_test/token',
    });
    return JSON.parse(res.body).token;
  }

  it('should reject request without JWT authentication', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v2/components',
      query: { season: TEST_SEASON },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.message).toContain('authenticated');
  });

  it('should return components from database on cache miss', async () => {
    const token = await getJwtToken();

    // Clear cache first
    const cacheKey = `http:list:components:${TEST_SEASON}`;
    await app.redis.del(cacheKey);

    const res = await app.inject({
      method: 'GET',
      url: '/v2/components',
      query: { season: TEST_SEASON },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    // Verify response structure
    const component = body[0];
    expect(component).toHaveProperty('identifier');
    expect(component).toHaveProperty('disciplina_id');
    expect(component).toHaveProperty('subject');
    expect(component).toHaveProperty('turma');
    expect(component).toHaveProperty('turno');
    expect(component).toHaveProperty('vagas');
    expect(component).toHaveProperty('requisicoes');
    expect(component).toHaveProperty('campus');
    expect(component).toHaveProperty('teoria');
    expect(component).toHaveProperty('pratica');
    expect(component).toHaveProperty('teoriaId');
    expect(component).toHaveProperty('praticaId');
    expect(component).toHaveProperty('season');
    expect(component).toHaveProperty('groupURL');
    expect(component).toHaveProperty('uf_cod_turma');
    expect(component).toHaveProperty('subjectId');

    // Verify populated fields
    expect(component.subject).toBe('Test Subject');
    expect(component.teoria).toBe('dr. theory teacher');
    expect(component.pratica).toBe('dr. practice teacher');
    expect(component.requisicoes).toBe(3); // length of alunos_matriculados

    // Verify data was cached in Redis
    const cached = await app.redis.get(cacheKey);
    expect(cached).not.toBeNull();
    const cachedData = JSON.parse(cached!);
    expect(Array.isArray(cachedData)).toBe(true);
    expect(cachedData.length).toBe(body.length);
  });

  it('should return cached components on cache hit', async () => {
    const token = await getJwtToken();

    // First request to populate cache
    const res1 = await app.inject({
      method: 'GET',
      url: '/v2/components',
      query: { season: TEST_SEASON },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(res1.statusCode).toBe(200);
    const body1 = JSON.parse(res1.body);

    // Second request should hit cache
    const res2 = await app.inject({
      method: 'GET',
      url: '/v2/components',
      query: { season: TEST_SEASON },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(res2.statusCode).toBe(200);
    const body2 = JSON.parse(res2.body);

    // Responses should be identical
    expect(body2).toEqual(body1);

    // Verify cache key exists
    const cacheKey = `http:list:components:${TEST_SEASON}`;
    const cached = await app.redis.get(cacheKey);
    expect(cached).not.toBeNull();
  });
});
