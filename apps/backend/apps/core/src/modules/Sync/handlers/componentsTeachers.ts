import { createHash } from 'node:crypto';
import {
  batchInsertItems,
  convertUfabcDisciplinas,
  generateIdentifier,
  parseXlsx,
  resolveProfessor,
  validateTeachers,
} from '@next/common';
import { TeacherModel } from '@/models/Teacher.js';
import { DisciplinaModel } from '@/models/Disciplina.js';
import { z } from 'zod';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ufProcessor } from '@/services/ufprocessor.js';

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
  const teachers: Array<{ name: string }> = await TeacherModel.find(
    {},
    { name: 1, _id: 0 },
  ).lean(true);
  const componentsWithTeachers = await ufProcessor.getComponents(link);
  return reply.send(componentsWithTeachers);
  // const rawDisciplinas = rawSheetDisciplinas.map((rawDisciplina) =>
  //   convertUfabcDisciplinas(rawDisciplina),
  // );
  // const disciplinas = rawDisciplinas.map(
  //   (disciplina) =>
  //     Object.assign({}, disciplina, {
  //       teoria: resolveProfessor(disciplina?.teoria, teachers),
  //       pratica: resolveProfessor(disciplina?.pratica, teachers),
  //     }) as any,
  // );

  // const errors = validateTeachers(disciplinas);
  // const disciplinaHash = createHash('md5')
  //   .update(JSON.stringify(disciplinas))
  //   .digest('hex');

  // if (disciplinaHash !== hash) {
  //   return {
  //     hash: disciplinaHash,
  //     payload: disciplinas,
  //     errors: [...new Set(errors)],
  //   };
  // }

  // const identifierKeys = ['disciplina', 'turno', 'campus', 'turma'] as const;

  // const start = Date.now();
  // const insertDisciplinasErrors = await batchInsertItems(
  //   disciplinas,
  //   async (disciplina) => {
  //     await DisciplinaModel.findOneAndUpdate(
  //       {
  //         identifier: generateIdentifier(disciplina, identifierKeys),
  //         season,
  //       },
  //       {
  //         teoria: disciplina.teoria?._id || null,
  //         pratica: disciplina.pratica?._id || null,
  //       },
  //       {
  //         new: true,
  //       },
  //     );
  //   },
  // );

  // if (insertDisciplinasErrors.length > 0) {
  //   request.log.error({
  //     msg: 'errors happened during insert',
  //     errors: insertDisciplinasErrors,
  //   });
  //   return reply.internalServerError('Error inserting disciplinas');
  // }

  // return {
  //   status: 'ok',
  //   time: Date.now() - start,
  //   errors,
  // };
}
