import { createHash } from 'node:crypto';
import { batchInsertItems, generateIdentifier, logger } from '@next/common';
import { TeacherModel } from '@/models/Teacher.js';
import { ComponentModel } from '@/models/Component.js';
import { z } from 'zod';
import { ufProcessor } from '@/services/ufprocessor.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

const validateComponentTeachersBody = z.object({
  hash: z.string().optional(),
  season: z.string(),
  link: z.string({
    message: 'O Link deve ser passado',
  }),
  // util to ignore when UFABC send bad data
  ignoreErrors: z.boolean().optional().default(false),
});

export async function componentsTeachers(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { season, hash, link, ignoreErrors } =
    validateComponentTeachersBody.parse(request.body);
  const componentsWithTeachers = await ufProcessor.getComponentsFile(link);
  const errors: string[] = [];

  const teacherCache = new Map();

  const findTeacher = async (name: string | null) => {
    if (!name) {
      return null;
    }
    const caseSafeName = name.toLowerCase();

    if (teacherCache.has(caseSafeName)) {
      return teacherCache.get(caseSafeName);
    }

    const teacher = await TeacherModel.findByFuzzName(caseSafeName);

    if (!teacher) {
      errors.push(caseSafeName);
      teacherCache.set(caseSafeName, null);
      return null;
    }

    if (!teacher.alias.includes(caseSafeName)) {
      await TeacherModel.findByIdAndUpdate(teacher._id, {
        $addToSet: { alias: caseSafeName },
      });
    }

    teacherCache.set(caseSafeName, teacher._id);
    return teacher._id;
  };

  const nextComponentWithTeachersPromises = componentsWithTeachers.map(
    async (component) => {
      if (!component.name) {
        errors.push(
          `Missing required field for component: ${component.UFComponentCode || 'Unknown'}`,
        );
      }

      const [teoria, pratica] = await Promise.all([
        findTeacher(component.teachers?.professor),
        findTeacher(component.teachers?.practice),
      ]);

      return {
        disciplina_id: component.UFComponentId,
        codigo: component.UFComponentCode,
        disciplina: component.name,
        campus: component.campus,
        turma: component.turma,
        turno: component.turno,
        vagas: component.vacancies,
        teoria,
        pratica,
        season,
      };
    },
  );

  const nextComponentWithTeachers = await Promise.all(
    nextComponentWithTeachersPromises,
  );

  if (!ignoreErrors && errors.length > 0) {
    const errorsSet = [...new Set(errors)];
    return reply.status(403).send({
      msg: 'Missing professors while parsing',
      names: errorsSet,
      size: errorsSet.length,
    });
  }

  const disciplinaHash = createHash('md5')
    .update(JSON.stringify(nextComponentWithTeachers))
    .digest('hex');

  if (disciplinaHash !== hash) {
    return {
      hash: disciplinaHash,
      errors: [...new Set(errors)],
      total: nextComponentWithTeachers.length,
      payload: nextComponentWithTeachers,
    };
  }

  const start = Date.now();
  const insertComponentsErrors = await batchInsertItems(
    nextComponentWithTeachers,
    async (component) => {
      // @ts-ignore migrating
      const identifier = generateIdentifier(component);
      await ComponentModel.findOneAndUpdate(
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
