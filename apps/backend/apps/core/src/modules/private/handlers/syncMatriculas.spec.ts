import assert from 'node:assert/strict';
import { currentQuad } from '@next/common';
import { buildApp } from '@/app.js';
import { DisciplinaModel } from '@/models/Disciplina.js';
import type { FastifyInstance } from 'fastify';

describe('GET /v2/matriculas/sync', () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    app = await buildApp();
    await app.listen();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should sync disciplines', async () => {
    await app.inject({
      method: 'GET',
      url: '/v2/matriculas/sync',
      query: 'alunos_matriculados',
    });
    const season = currentQuad();
    const Disciplinas = DisciplinaModel.findOne({
      season,
    });
    const disciplina = await Disciplinas.findOne({ disciplina_id: 4 });

    assert.equal(disciplina?.disciplina_id, 4);
    assert(disciplina?.alunos_matriculados.length);
    assert(disciplina?.before_kick.length === 0);
    assert(disciplina?.after_kick.length === 0);
  });

  it('should update before_kick key', async (t) => {
    // 'TODO: find  a way to simulate the before_kick'
    t.skip();
    await app.inject({
      method: 'GET',
      url: '/v2/matriculas/sync',
      query: 'before_kick',
    });

    const season = currentQuad();
    const Disciplinas = DisciplinaModel.findOne({
      season,
    });
    const disciplina = await Disciplinas.findOne({ disciplina_id: 4 });

    assert.equal(disciplina?.disciplina_id, 4);
    assert(disciplina?.alunos_matriculados.length);
    assert(disciplina?.before_kick.length);
    assert(!disciplina?.after_kick.length);
  });

  it('update after_kick key', async (t) => {
    // 'TODO: find  a way to simulate the after_kick'
    t.skip();
    await app.inject({
      method: 'GET',
      url: '/v2/matriculas/sync',
      query: 'after_kick',
    });

    const season = currentQuad();
    const Disciplinas = DisciplinaModel.findOne({
      season,
    });
    const disciplina = await Disciplinas.findOne({ disciplina_id: 4 });

    assert.deepEqual(disciplina?.disciplina_id, 4);
    assert(disciplina?.alunos_matriculados.length === 0);
    assert(disciplina?.before_kick.length === 0);
    assert(disciplina?.after_kick.length);
  });
});
