import { z } from 'zod';
import { currentQuad } from '@next/common';
import { type Component, ComponentModel } from '@/models/Component.js';
import { ufProcessor } from '@/services/ufprocessor.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AnyBulkWriteOperation } from 'mongoose';

const ufEnrolledQueryParams = z.object({
  operation: z.enum(['after_kick', 'before_kick']),
});

export async function syncEnrolledStatusHandler(
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
        disciplina_id: Number(enrollmentId),
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

  const start = Date.now();

  try {
    await ComponentModel.bulkWrite(bulkOperations, { ordered: false });
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
