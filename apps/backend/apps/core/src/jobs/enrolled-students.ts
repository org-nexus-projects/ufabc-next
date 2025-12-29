import { JOB_NAMES } from '@/constants.js';
import { defineJob } from '@next/queues/client';
import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { currentQuad } from '@next/common';
import { ComponentModel } from '@/models/Component.js';

const connector = new UfabcParserConnector();

export const enrolledStudentsJob = defineJob(JOB_NAMES.ENROLLED_STUDENTS)
  .handler(async ({ manager }) => {
    const tenant = currentQuad();
    const enrollments = await connector.getEnrolled();

    const enrollmentTasks = Object.entries(enrollments).map(([componentId, students]) => ({
      componentId,
      students,
    }));

    await manager.dispatchFlow({
      name: 'enrolled-students',
      queueName: JOB_NAMES.ENROLLED_STUDENTS,
      children: enrollmentTasks.map((enrollment) => ({
        name: JOB_NAMES.PROCESS_ENROLLED_STUDENTS,
        data: {
          componentId: enrollment.componentId,
          students: enrollment.students,
          tenant,
        },
        queueName: JOB_NAMES.PROCESS_ENROLLED_STUDENTS,
      })),
    });

    return {
      success: true,
      flowStarted: true,
    };
  })
  .every('45 minutes');

export const processEnrollmentJob = defineJob(JOB_NAMES.PROCESS_ENROLLED_STUDENTS)
  .handler(async ({ job, manager }) => {
    const { tenant, componentId, students } = job.data;
    const component = await ComponentModel.findOneAndUpdate(
      {
        disciplina_id: componentId,
        season: tenant,
      },
      {
        $set: {
          alunos_matriculados: students,
        },
      },
    );

    if (!component) {
      await manager.dispatch(JOB_NAMES.CREATE_COMPONENT, {
        componentId,
      });
      throw new Error('Component not found');
    }

    return component.toJSON();
  })
  .options({
    removeOnComplete: 1000,
    removeOnFail: 50000,
  });
