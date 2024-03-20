import { currentQuad } from '@next/common';
import type { FastifyRequest } from 'fastify';
import type { DisciplinaService } from './disciplina.service.js';

export class DisciplinaHandler {
  constructor(private readonly disciplinaService: DisciplinaService) {}

  async listDisciplinas(request: FastifyRequest) {
    const season = currentQuad();
    const { redis } = request.server;
    const cacheKey = `all_disciplinas_${season}`;
    const cachedResponse = await redis.get(cacheKey);

    if (cachedResponse) {
      return cachedResponse;
    }

    const disciplinas = await this.disciplinaService.findDisciplinas(season);

    await redis.set(cacheKey, JSON.stringify(disciplinas), 'EX', 60 * 60 * 24);
    return disciplinas;
  }
}
