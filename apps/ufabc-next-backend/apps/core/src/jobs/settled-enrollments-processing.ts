import { defineJob } from '@next/queues/client';
import { z } from 'zod';

import type { Enrollment } from '@/models/Enrollment.js';

import { JOB_NAMES } from '@/constants.js';
import { ComponentModel } from '@/models/Component.js';

import { upsertEnrollment } from './utils/enrollment-upsert.js';

const settledEnrollmentsDataSchema = z.object({
  ra: z.string().describe('Student ID'),
  season: z.string().describe('Season (e.g., 2024:2)'),
  tenantId: z.number().describe('Tenant ID'),
  classes: z.array(z.string()).describe('Array of class codes (uf_cod_turma)'),
  referenceKey: z.string().describe('Reference key for deduplication'),
});

export const settledEnrollmentsProcessingJob = defineJob(
  JOB_NAMES.PROCESS_SETTLED_ENROLLMENTS
)
  .input(
    z.object({
      deliveryId: z.string().uuid().describe('Unique webhook delivery ID'),
      event: z.literal('class.settled').describe('Event type'),
      timestamp: z.string().describe('Event timestamp'),
      data: settledEnrollmentsDataSchema,
    })
  )
  .handler(async ({ job, app }) => {
    const { deliveryId, data } = job.data;
    const { ra, season, classes } = data;

    const [year, quad] = season.split(':').map(Number);
    const raNumber = Number(ra);

    app.log.info(
      {
        deliveryId,
        ra,
        season,
        classCount: classes.length,
      },
      'Processing settled enrollments'
    );

    const results = [];

    for (const ufCodTurma of classes) {
      const component = await ComponentModel.findOne({
        uf_cod_turma: ufCodTurma,
        season,
      }).lean();

      if (!component) {
        app.log.warn(
          { ra, season, ufCodTurma },
          'Component not found for settled enrollment'
        );
        results.push({
          ufCodTurma,
          status: 'component_not_found',
        });
        continue;
      }

      const enrollmentData: Partial<Enrollment> = {
        ra: raNumber,
        year,
        quad,
        season,
        disciplina: component.disciplina.toLowerCase(),
        disciplina_id: component.disciplina_id,
        turma: component.turma,
        uf_cod_turma: component.uf_cod_turma,
        campus: component.campus,
        turno: component.turno,
        subject: component.subject,
        teoria: component.teoria,
        pratica: component.pratica,
        syncedBy: 'ufabc-parser',
        kind: null,
        conceito: null,
        cr_acumulado: null,
        ca_acumulado: null,
        cp_acumulado: null,
      };

      const enrollmentId = await upsertEnrollment(enrollmentData, app.log);

      results.push({
        ufCodTurma,
        status: enrollmentId ? 'processed' : 'failed',
        enrollmentId,
      });
    }

    app.log.info(
      {
        deliveryId,
        ra,
        season,
        processed: results.filter((r) => r.status === 'processed').length,
        failed: results.filter((r) => r.status === 'failed').length,
        notFound: results.filter((r) => r.status === 'component_not_found')
          .length,
      },
      'Settled enrollments processing completed'
    );

    return {
      success: true,
      deliveryId,
      event: 'class.settled',
      processed: results.length,
      results,
    };
  });
