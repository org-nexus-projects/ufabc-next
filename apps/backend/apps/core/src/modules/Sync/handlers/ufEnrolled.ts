import {
  batchInsertItems,
  currentQuad,
  parseResponseToJson,
} from '@next/common';
import { ofetch } from 'ofetch';
import { isEqual } from 'lodash-es';
import { DisciplinaModel } from '@/models/Disciplina.js';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ufProcessor } from '@/services/ufprocessor.js';
import { storage } from '@/services/unstorage.js';

export type SyncMatriculasRequest = {
  Querystring: {
    operation: 'alunos_matriculados' | 'after_kick' | 'before_kick';
  };
};

const ufEnrolledQueryParams = z.object({
  operation: z.enum(['sync', 'after_kick', 'before_kick']).default('sync'),
});

// TODO(Joabe): validate if sync step still makes sense here
export async function syncEnrolledHandler(
  request: FastifyRequest<SyncMatriculasRequest>,
) {
  const season = currentQuad();
  const { redis } = request.server;
  const { operation } = ufEnrolledQueryParams.parse(request.query);
  const operationMap =
    new Map([
      ['before_kick', 'before_kick'],
      ['after_kick', 'after_kick'],
      ['sync', 'alunos_matriculados'],
    ]).get(operation) ?? 'alunos_matriculados';
  // check if we are doing a sync operation
  // update current enrolled students
  const isSyncMatriculas = operationMap === 'alunos_matriculados';
  const enrolledStudents = await ufProcessor.getEnrolledStudents();

  const start = Date.now();
  const errors = await batchInsertItems(
    Object.keys(enrolledStudents),
    async (componentIds) => {
      const cacheKey = `component:${season}:${componentIds}`;
      const cachedComponents = isSyncMatriculas
        ? await storage.getItem(cacheKey)
        : {};
      if (isEqual(cachedComponents, enrolledStudents[Number(componentIds)])) {
        return cachedComponents;
      }

      const updatedDisciplinas = await DisciplinaModel.findOneAndUpdate(
        {
          season,
          disciplina_id: componentIds,
        },
        { $set: { [operationMap]: enrolledStudents[Number(componentIds)] } },
        { upsert: true, new: true },
      );

      if (isSyncMatriculas) {
        await storage.setItem(
          cacheKey,
          JSON.stringify(enrolledStudents[Number(componentIds)]),
        );
      }
      return updatedDisciplinas;
    },
  );

  return {
    status: 'ok',
    time: Date.now() - start,
    errors,
  };
}
