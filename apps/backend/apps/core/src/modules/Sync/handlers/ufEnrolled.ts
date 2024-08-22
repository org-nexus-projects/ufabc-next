import { z } from 'zod';
import { currentQuad } from '@next/common';
import { type Component, DisciplinaModel } from '@/models/Disciplina.js';
import { ufProcessor } from '@/services/ufprocessor.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AnyBulkWriteOperation } from 'mongoose';

const ufEnrolledQueryParams = z.object({
  operation: z
    .enum(['alunos_matriculados', 'after_kick', 'before_kick'])
    .default('alunos_matriculados'),
});

export async function syncEnrolledHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const tenant = currentQuad();
  const { operation } = ufEnrolledQueryParams.parse(request.query);
  const enrolledStudents = await ufProcessor.getEnrolledStudents();

  const bulkOperations: AnyBulkWriteOperation<Component>[] = Object.entries(
    enrolledStudents,
  ).map(([enrollmentId, students]) => ({
    updateOne: {
      filter: {
        disciplina_id: enrollmentId,
        season: tenant,
      },
      update: {
        $set: {
          [operation]: students,
        },
      },
      upsert: true,
    },
  }));

  const BATCH_SIZE = 150;
  const start = Date.now();

  try {
    for (let i = 0; i < bulkOperations.length; i += BATCH_SIZE) {
      const batch = bulkOperations.slice(i, i + BATCH_SIZE);
      await DisciplinaModel.bulkWrite(batch, { ordered: false });
    }
    return {
      status: 'ok',
      time: Date.now() - start,
      componentsProcessed: bulkOperations.length,
    };
  } catch (error) {
    request.log.error({ error }, 'Error Syncing Enrolled Students');
    return reply.internalServerError('Error Syncing Enrolled Students');
  }
}
