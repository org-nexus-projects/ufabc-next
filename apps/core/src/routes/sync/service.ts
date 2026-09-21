import type { FastifyBaseLogger } from 'fastify';

import type { UfabcParserConnector } from '@/connectors/ufabc-parser.js';

import { ComponentModel } from '@/models/Component.js';

type EnrolledStudentsSource = {
  getEnrolledStudents: () => Promise<Record<string, number[]>>;
};

export async function syncEnrolledStudents(
  connector: UfabcParserConnector,
  operation: 'after_kick' | 'before_kick',
  season: string,
  log: FastifyBaseLogger
) {
  const enrolledStudents = await (
    connector as unknown as EnrolledStudentsSource
  ).getEnrolledStudents();

  const start = Date.now();

  const enrolledOperationsPromises = Object.entries(enrolledStudents).map(
    async ([componentId, students]) => {
      try {
        await ComponentModel.findOneAndUpdate(
          {
            disciplina_id: Number(componentId),
            season,
          },
          {
            $set: {
              [operation]: students,
            },
          },
          { upsert: true, new: true }
        );
      } catch (error) {
        log.error({
          error: error instanceof Error ? error.message : String(error),
          students,
          msg: 'Failed to process Enrolled processing job',
        });
      }
    }
  );

  const processed = await Promise.all(enrolledOperationsPromises);

  return {
    status: 'ok',
    time: Date.now() - start,
    componentsProcessed: processed.length,
  };
}
