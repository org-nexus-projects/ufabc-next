import type { Types } from 'mongoose';

import { defineJob } from '@next/queues/client';
import z from 'zod';

import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { JOB_NAMES, PARSER_WEBHOOK_SUPPORTED_EVENTS } from '@/constants.js';
import { ComponentModel, type Component } from '@/models/Component.js';
import { TeacherModel } from '@/models/Teacher.js';
import { ComponentSateSchema } from '@/schemas/v2/webhook/ufabc-parser.js';

import { findOrCreateSubject } from './utils/subject-resolution.js';

const teacherCache = new Map<string, Types.ObjectId | null>();

async function findTeacher(
  name: string | null
): Promise<Types.ObjectId | null> {
  if (!name) return null;

  const normalizedName = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (teacherCache.has(normalizedName)) {
    return teacherCache.get(normalizedName)!;
  }

  const teacher = await TeacherModel.findByFuzzName(normalizedName);

  if (!teacher && normalizedName !== '0') {
    teacherCache.set(normalizedName, null);
    return null;
  }

  if (teacher && !teacher.alias.includes(normalizedName)) {
    await TeacherModel.findByIdAndUpdate(teacher._id, {
      $addToSet: { alias: [normalizedName, name.toLowerCase()] },
    });
  }

  const teacherId = teacher?._id ?? null;
  teacherCache.set(normalizedName, teacherId);
  return teacherId;
}

export const createComponentJob = defineJob(JOB_NAMES.COMPONENTS_PROCESSING)
  .input(
    z.object({
      deliveryId: z.string().uuid().describe('Unique webhook delivery ID'),
      event: z.enum(PARSER_WEBHOOK_SUPPORTED_EVENTS),
      timestamp: z.string().describe('Event timestamp'),
      data: ComponentSateSchema.shape.data,
    })
  )
  .handler(async ({ job }) => {
    const { globalTraceId, data } = job.data;
    const { componentKey } = data;
    const ufabcParserConnector = new UfabcParserConnector(globalTraceId);
    const component =
      await ufabcParserConnector.getComponentByKey(componentKey);

    if (!component) {
      throw new Error('Component not found');
    }

    const subjectCode = component.ufComponentCode.split('-')[0];
    const subject = await findOrCreateSubject(
      component.name,
      component.credits,
      subjectCode
    );

    const professorTeacher = component.teachers?.find(
      (t) => t.role === 'professor' && !t.isSecondary
    );
    const practiceTeacher = component.teachers?.find(
      (t) => t.role === 'practice' && !t.isSecondary
    );

    const [teoria, pratica] = await Promise.all([
      findTeacher(professorTeacher?.name ?? null),
      findTeacher(practiceTeacher?.name ?? null),
    ]);

    const dbComponent = {
      after_kick: [],
      before_kick: [],
      alunos_matriculados: [],
      disciplina_id: component.ufComponentId,
      disciplina: subject.name,
      turno: component.shift === 'morning' ? 'diurno' : 'noturno',
      turma: component.componentClass,
      vagas: component.vacancies,
      obrigatorias:
        component.courses
          ?.filter((c) => c.category === 'mandatory')
          .map((c) => c.UFCourseId) ?? [],
      uf_cod_turma: component.ufClassroomCode,
      campus: component.campus,
      codigo: component.ufComponentCode,
      kind: 'api',
      ideal_quad: false,
      tpi: [
        component.tpi.theory,
        component.tpi.practice,
        component.tpi.individual,
      ],
      subject: subject._id,
      year: Number(component.season.split(':')[0]),
      quad: Number(component.season.split(':')[1]),
      season: component.season,
      teoria,
      pratica,
    } satisfies Omit<Component, 'createdAt' | 'updatedAt'>;

    const createdComponent = await ComponentModel.findOneAndUpdate(
      { season: component.season, uf_cod_turma: component.ufClassroomCode },
      dbComponent,
      { upsert: true, new: true }
    );
    return {
      success: true,
      component: createdComponent._id,
    };
  });
