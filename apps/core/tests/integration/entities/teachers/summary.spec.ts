import { startTestStack, type TestStack } from '@next/testing/containers';
import { fastify, type FastifyInstance } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';
import { Types } from 'mongoose';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { buildApp } from '../../../../src/app.js';
import { SummaryModel } from '../../../../src/models/Summary.js';
import { TeacherModel } from '../../../../src/models/Teacher.js';

describe('GET /entities/teachers/summary/:teacherId', () => {
  let stack: TestStack;
  let app: FastifyInstance;
  const teacherId = new Types.ObjectId();
  const teacherWithoutSummaryId = new Types.ObjectId();

  beforeAll(async () => {
    stack = await startTestStack();
    app = fastify({ logger: false });
    await app.register(fp(buildApp), {
      config: { ...stack.config, NODE_ENV: 'test' },
    });
    await app.ready();

    await TeacherModel.create([
      { _id: teacherId, name: 'Professor Teste' },
      { _id: teacherWithoutSummaryId, name: 'Professor Sem Resumo' },
    ]);

    await SummaryModel.create({
      teacher: teacherId,
      subject: null,
      summary: 'Resumo de teste.',
      didacticQuality: 4.2,
      takesAttendance: true,
      usesSigaa: null,
      usesMoodle: false,
      commentsCount: 10,
      oldestComment: new Date('2026-01-01'),
      newestComment: new Date('2026-01-10'),
      model: 'gpt-4o-mini',
      promptVersion: 'v1',
      status: 'active',
    });
  });

  afterAll(async () => {
    await SummaryModel.deleteMany({});
    await TeacherModel.deleteMany({});
    await app.close();
    await stack.stop();
  });

  it('is public — no auth required', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/entities/teachers/summary/${teacherId}`,
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns the latest active summary', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/entities/teachers/summary/${teacherId}`,
    });
    const body = JSON.parse(res.body);
    expect(body.summary).toBe('Resumo de teste.');
    expect(body.commentsCount).toBe(10);
  });

  it('404s when teacher has no summary yet', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/entities/teachers/summary/${teacherWithoutSummaryId}`,
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns the most recent summary when there are multiple', async () => {
    const teacherWithMultipleId = new Types.ObjectId();
    await TeacherModel.create({
      _id: teacherWithMultipleId,
      name: 'Professor Múltiplos Resumos',
    });

    await SummaryModel.create([
      {
        teacher: teacherWithMultipleId,
        subject: null,
        summary: 'Resumo antigo.',
        commentsCount: 10,
        oldestComment: new Date('2026-01-01'),
        newestComment: new Date('2026-01-10'),
        model: 'gpt-4o-mini',
        promptVersion: 'v1',
        status: 'active',
        createdAt: new Date('2026-01-15'),
      },
      {
        teacher: teacherWithMultipleId,
        subject: null,
        summary: 'Resumo mais novo.',
        commentsCount: 15,
        oldestComment: new Date('2026-02-01'),
        newestComment: new Date('2026-02-10'),
        model: 'gpt-4o-mini',
        promptVersion: 'v1',
        status: 'active',
        createdAt: new Date('2026-02-15'),
      },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: `/entities/teachers/summary/${teacherWithMultipleId}`,
    });
    expect(JSON.parse(res.body).summary).toBe('Resumo mais novo.');
  });
});
