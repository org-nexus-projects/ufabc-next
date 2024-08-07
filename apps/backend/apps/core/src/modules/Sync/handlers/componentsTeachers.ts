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
      component.teachers?.professor &&
      !teacherMap.has(component.teachers.professor)
    ) {
      errors.push(component.teachers.professor);
    }
    if (
      component.teachers?.practice &&
      !teacherMap.has(component.teachers.practice)
    ) {
      errors.push(component.teachers.practice);
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
        teacherMap.get(
          // @ts-ignore fix later
          component.teachers?.professor,
        ) || null,
      pratica:
        teacherMap.get(
          // @ts-ignore fix later
          component.teachers.practice,
        ) || null,
      season,
    };
  });

  if (errors.length > 0) {
    return reply.status(403).send({
      msg: 'Missing professors while parsing',
      names: [...new Set(errors)],
    });
  }

  const disciplinaHash = createHash('md5')
    .update(JSON.stringify(nextComponentWithTeachers))
    .digest('hex');

  if (disciplinaHash !== hash) {
    return {
      hash: disciplinaHash,
      payload: nextComponentWithTeachers,
      errors: [...new Set(errors)],
    };
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
          $set: {
            teoria: component.teoria,
            pratica: component.pratica,
          },
        },
        { new: true },
      );
    },
  );

  if (insertComponentsErrors.length > 0) {
    request.log.error({
      msg: 'errors happened during insert',
      errors: insertComponentsErrors,
    });
    return reply.internalServerError('Error inserting disciplinas');
  }

  return {
    status: 'ok',
    time: Date.now() - start,
    errors: [...new Set(errors)],
  };
}
