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
import type { FastifyReply, FastifyRequest } from 'fastify';

export type ParseTeachersRequest = {
  Body: {
    hash: string;
    season: string;
    link: string;
    rename: [
      { from: 'TURMA'; as: 'nome' },
      { from: 'TEORIA'; as: 'horarios' },
      { from: 'DOCENTE TEORIA'; as: 'teoria' },
      { from: 'DOCENTE PRATICA'; as: 'pratica' },
    ];
    mappings?: Record<string, string>;
  };
};

export async function parseTeachersHandler(
  request: FastifyRequest<ParseTeachersRequest>,
  reply: FastifyReply,
) {
  const { season, hash } = request.body;
  const teachers = await TeacherModel.find({}).lean(true);
  const rawSheetDisciplinas = await parseXlsx(request.body);
  const rawDisciplinas = rawSheetDisciplinas.map((rawDisciplina) =>
    convertUfabcDisciplinas(rawDisciplina),
  );
  const disciplinas = rawDisciplinas.map(
    (disciplina) =>
      Object.assign({}, disciplina, {
        teoria: resolveProfessor(disciplina?.teoria, teachers),
        pratica: resolveProfessor(disciplina?.pratica, teachers),
      }) as any,
  );

  const errors = validateTeachers(disciplinas);
  const disciplinaHash = createHash('md5')
    .update(JSON.stringify(disciplinas))
    .digest('hex');

  if (disciplinaHash !== hash) {
    return {
      hash: disciplinaHash,
      payload: disciplinas,
      errors: [...new Set(errors)],
    };
  }

  const identifierKeys = ['disciplina', 'turno', 'campus', 'turma'] as const;

  const start = Date.now();
  const insertDisciplinasErrors = await batchInsertItems(
    disciplinas,
    async (disciplina) => {
      await DisciplinaModel.findOneAndUpdate(
        {
          identifier: generateIdentifier(disciplina, identifierKeys),
          season,
        },
        {
          teoria: disciplina.teoria?._id || null,
          pratica: disciplina.pratica?._id || null,
        },
        {
          new: true,
        },
      );
    },
  );

  if (insertDisciplinasErrors.length > 0) {
    request.log.error({
      msg: 'errors happened during insert',
      errors: insertDisciplinasErrors,
    });
    return reply.internalServerError('Error inserting disciplinas');
  }

  return {
    status: 'ok',
    time: Date.now() - start,
    errors,
  };
}
