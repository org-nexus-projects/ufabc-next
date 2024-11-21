import { currentQuad } from '@next/common';
import { ComponentModel } from '@/models/Component.js';
import type { QueueContext } from '../types.js';
import { getEnrolledStudents } from '@/modules-v2/ufabc-parser.js';

export async function syncEnrolled({ app }: QueueContext<void>) {
  const tenant = currentQuad();
  const enrollments = await getEnrolledStudents();

  const enrollmentTasks = Object.entries(enrollments).map(
    ([componentId, students]) => ({
      componentId,
      students,
    }),
  );

  // Process enrollments in batches
  const enrolledPromises = enrollmentTasks.map((enrolled) => {
    app.job.dispatch('ProcessSingleEnrolled', {
      tenant,
      componentId: enrolled.componentId,
      students: enrolled.students,
    });
  });

  await Promise.all(enrolledPromises);

  app.log.info({
    msg: 'Enrollment sync tasks dispatched',
    totalEnrollments: enrollmentTasks.length,
  });

  return {
    msg: 'Enrollment sync initiated',
    totalEnrollments: enrollmentTasks.length,
  };
}

// Process a single enrollment update
export async function processSingleEnrolled({
  app,
  job,
}: QueueContext<{
  tenant: string;
  componentId: string;
  students: number[];
}>) {
  const { tenant, componentId, students } = job.data;

  try {
    // Update single component's enrollments
    const result = await ComponentModel.findOneAndUpdate(
      {
        disciplina_id: Number(componentId),
        season: tenant,
      },
      {
        $set: {
          alunos_matriculados: students,
        },
      },
      {
        new: true,
      },
    );

    if (!result) {
      app.log.warn({
        msg: 'Component not found for enrollment update',
        componentId,
        tenant,
      });

      return {
        status: 'warning',
        message: 'Component not found',
        componentId,
      };
    }

    app.log.info({
      msg: 'Component enrollment updated',
      componentId,
      studentCount: students.length,
    });
  } catch (error) {
    app.log.error({
      msg: 'Error processing enrollment update',
      error: error instanceof Error ? error.message : String(error),
      componentId,
    });

    throw error;
  }
}
