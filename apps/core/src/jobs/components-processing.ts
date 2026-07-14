import { defineJob } from '@next/queues/client';
import type { Types } from 'mongoose';
import z from 'zod';

import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { JOB_NAMES, PARSER_WEBHOOK_SUPPORTED_EVENTS } from '@/constants.js';
import { ComponentModel } from '@/models/Component.js';
import {
  TeacherModel,
  findBestLevenshteinMatch,
  normalizeName,
} from '@/models/Teacher.js';
import { ComponentSateSchema } from '@/schemas/v2/webhook/ufabc-parser.js';

import { findOrCreateSubject } from './utils/subject-resolution.js';

const teacherCache = new Map<string, Types.ObjectId | null>();

async function findTeacher(
  name: string | null
): Promise<Types.ObjectId | null> {
  if (!name) {
    return null;
  }

  const normalizedName = normalizeName(name);

  if (teacherCache.has(normalizedName)) {
    return teacherCache.get(normalizedName)!;
  }

  const teacher = await TeacherModel.findOne({ name: normalizedName });
  if (!teacher) {
    const allTeachers = await TeacherModel.find({});
    const levMatch = findBestLevenshteinMatch(name, allTeachers);
    if (levMatch) {
      await TeacherModel.findByIdAndUpdate(levMatch._id, {
        $addToSet: { alias: { $each: [normalizedName, name.toLowerCase()] } },
      });
      teacherCache.set(normalizedName, levMatch._id);
      return levMatch._id;
    }
  }

  if (!teacher && normalizedName !== '0') {
    teacherCache.set(normalizedName, null);
    return null;
  }

  if (teacher && !teacher.alias.includes(normalizedName)) {
    await TeacherModel.findByIdAndUpdate(teacher._id, {
      $addToSet: { alias: { $each: [normalizedName, name.toLowerCase()] } },
    });
  }

  const teacherId = teacher?._id ?? null;
  teacherCache.set(normalizedName, teacherId);
  return teacherId;
}

export const createComponentJob = defineJob(JOB_NAMES.COMPONENTS_PROCESSING)
  .input(
    z.object({
      data: ComponentSateSchema.shape.data,
      deliveryId: z.string().uuid().describe('Unique webhook delivery ID'),
      event: z.enum(PARSER_WEBHOOK_SUPPORTED_EVENTS),
      timestamp: z.string().describe('Event timestamp'),
    })
  )
  .handler(async ({ job }) => {
    const { globalTraceId, data } = job.data;
    const { componentKey } = data;
    const ufabcParserConnector = new UfabcParserConnector(globalTraceId);
    const [component] =
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

    const main = component.teachers.find(
      (teacher) => teacher.role === 'professor'
    );
    const practice = component.teachers.find(
      (teacher) => teacher.role === 'practice'
    );

    const teoriaTeacherId = await findTeacher(main?.name ?? null);
    const praticaTeacherId = await findTeacher(practice?.name ?? null);

    const existingComponent = await ComponentModel.findOne({
      season: component.season,
      uf_cod_turma: component.ufClassroomCode,
    });

    if (existingComponent) {
      const updated = await existingComponent.updateOne({
        $set: {
          campus: component.campus,
          credits: component.credits,
          disciplina: subject.name,
          kind: 'api',
          pratica: praticaTeacherId ?? undefined,
          subject: subject._id,
          teoria: teoriaTeacherId ?? undefined,
          tpi: [
            component.tpi.theory,
            component.tpi.practice,
            component.tpi.individual,
          ],
          turma: component.componentClass,
          turno: component.shift === 'morning' ? 'diurno' : 'noturno',
          vagas: component.vacancies,
        },
      });

      return {
        componentId: updated._id,
        message: 'Component updated successfully',
      };
    }

    const [year, quad] = component.season.split(':').map(Number);
    const newComponent = await ComponentModel.create({
      after_kick: [],
      alunos_matriculados: [],
      before_kick: [],
      campus: component.campus,
      codigo: component.ufComponentCode,
      disciplina: subject.name ?? component.name,
      disciplina_id:
        component.alternateUfabcComponentId ?? component.ufComponentId,
      ideal_quad: false,
      kind: 'api',
      obrigatorias:
        component.courses
          ?.filter((c) => c.category === 'mandatory')
          .map((c) => c.UFCourseId) ?? [],
      pratica: praticaTeacherId ?? undefined,
      quad,
      season: component.season,
      subject: subject._id,
      teoria: teoriaTeacherId ?? undefined,
      tpi: [
        component.tpi.theory,
        component.tpi.practice,
        component.tpi.individual,
      ],
      turma: component.componentClass,
      turno: component.shift === 'morning' ? 'diurno' : 'noturno',
      uf_cod_turma: component.ufClassroomCode,
      vagas: component.vacancies,
      year,
    });

    return { component: newComponent, created: true };
  });
