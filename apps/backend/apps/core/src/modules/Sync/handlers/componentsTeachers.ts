import { createHash } from 'node:crypto';
import { batchInsertItems, generateIdentifier } from '@next/common';
import { TeacherModel } from '@/models/Teacher.js';
import { DisciplinaModel } from '@/models/Disciplina.js';
import { z } from 'zod';
import { ufProcessor } from '@/services/ufprocessor.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

const validateComponentTeachersBody = z.object({
  hash: z.string().optional(),
  season: z.string(),
  link: z.string({
    message: 'O Link deve ser passado',
  }),
});

export async function componentsTeachers(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { season, hash, link } = validateComponentTeachersBody.parse(
    request.body,
  );
  const teachers: Array<{ name: string; _id: string }> =
    await TeacherModel.find({}, { name: 1, _id: 1 }).lean(true);
  const teacherMap = new Map(
    teachers.map((teacher) => [teacher.name.toLocaleLowerCase(), teacher._id]),
  );
  const componentsWithTeachers = await ufProcessor.getComponents(link);
  const errors: string[] = [];
  const nextComponentWithTeachers = componentsWithTeachers.map((component) => {
    if (!component.name) {
      errors.push(
        `Missing required field for component: ${component.UFComponentCode || 'Unknown'}`,
      );
    }

    if (
      component.teachers.professor &&
      !teacherMap.has(component.teachers.professor.toLowerCase())
    ) {
      errors.push(`Missing teacher: ${component.teachers.professor}`);
    }
    if (
      component.teachers.practice &&
      !teacherMap.has(component.teachers.practice.toLowerCase())
    ) {
      errors.push(`Missing practice teacher: ${component.teachers.practice}`);
    }

    return {
      disciplina_id: component.UFComponentId,
      codigo: component.UFComponentCode,
      disciplina: component.name,
      campus: component.campus,
      turma: component.turma,
      turno: component.turno,
      vagas: component.vacancies,
      teoria:
        teacherMap.get(component.teachers.professor?.toLowerCase()) || null,
      pratica:
        teacherMap.get(component.teachers.practice?.toLowerCase()) || null,
      season,
    };
  });

  const disciplinaHash = createHash('md5')
    .update(JSON.stringify(nextComponentWithTeachers))
    .digest('hex');

  if (hash && disciplinaHash !== hash) {
    return {
      hash: disciplinaHash,
      payload: nextComponentWithTeachers,
      errors: [...new Set(errors)],
    };
  }

  if (errors.length > 0) {
    return reply.status(403).send({
      msg: 'Errors found during disciplina processing',
      errors: [...new Set(errors)],
    });
  }

  const start = Date.now();
  const insertComponentsErrors = await batchInsertItems(
    nextComponentWithTeachers,
    async (component) => {
      // @ts-ignore migrating
      const identifier = generateIdentifier(component);
      await DisciplinaModel.findOneAndUpdate(
        {
          identifier,
          season,
        },
        {
          component,
        },
        { upsert: true, new: true },
      );
    },
  );

  if (insertComponentsErrors.length > 0) {
    request.log.error({
      msg: 'errors happened during insert',
      errors: insertDisciplinasErrors,
    });
    return reply.internalServerError('Error inserting disciplinas');
  }

  return {
    status: 'ok',
    time: Date.now() - start,
    errors: [...new Set(errors)],
  };
}
