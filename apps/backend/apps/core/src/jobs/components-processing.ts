import type { Types } from 'mongoose';

import { defineJob } from '@next/queues/client';
import z from 'zod';

import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { JOB_NAMES, PARSER_WEBHOOK_SUPPORTED_EVENTS } from '@/constants.js';
import { ComponentModel, type Component } from '@/models/Component.js';
import { TeacherModel, findBestLevenshteinMatch, normalizeName } from '@/models/Teacher.js';
import { ComponentSateSchema } from '@/schemas/v2/webhook/ufabc-parser.js';

import { findOrCreateSubject } from './utils/subject-resolution.js';

const teacherCache = new Map<string, Types.ObjectId | null>();

async function findTeacher(
  name: string | null
): Promise<Types.ObjectId | null> {
  if (!name) return null;

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
      teacherCache.set(normalizedName, levMatch._id as Types.ObjectId);
      return levMatch._id as Types.ObjectId;
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
      component.subjectKey,
      subjectCode,
      component.name
    );

    const teoriaTeacherId = await findTeacher(component.teachers.professor);
    const praticaTeacherId = await findTeacher(component.teachers.practice);

    const identifier = `${component.season}-${component.ufClassroomCode}`;

    const existingComponent = await ComponentModel.findOne({ identifier });

    if (existingComponent) {
      const updated = await existingComponent.updateOne({
        $set: {
          name: component.name,
          credits: component.credits,
          year: component.year,
          quad: component.quad,
          turno: component.shift,
          turma: component.componentClass,
          vagas: component.vacancies,
          subject: subject._id,
          teoria: teoriaTeacherId ?? undefined,
          pratica: praticaTeacherId ?? undefined,
          tpi: [component.tpi.theory, component.tpi.practice, component.tpi.individual],
          campus: component.campus,
          season: component.season,
          kind: 'api',
        },
      });

      return { component: existingComponent, updated };
    }

    const newComponent = await ComponentModel.create({
      identifier,
      uf_cod_turma: component.ufClassroomCode,
      year: component.year,
      quad: component.quad,
      subject: subject._id,
      name: component.name,
      credits: component.credits,
      turno: component.shift,
      turma: component.componentClass,
      vagas: component.vacancies,
      obrigatorias: [],
      codigo: component.ufComponentCode,
      teoria: teoriaTeacherId ?? undefined,
      pratica: praticaTeacherId ?? undefined,
      tpi: [component.tpi.theory, component.tpi.practice, component.tpi.individual],
      campus: component.campus,
      ideal_quad: false,
      season: component.season,
      kind: 'api',
      alunos_matriculados: [],
      before_kick: [],
      after_kick: [],
    });

    return { component: newComponent, created: true };
  });
