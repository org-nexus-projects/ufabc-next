import {
  batchInsertItems,
  convertUfabcDisciplinas,
  currentQuad,
  generateIdentifier,
  parseResponseToJson,
} from '@next/common';
import { ofetch } from 'ofetch';
import { DisciplinaModel } from '@/models/Disciplina.js';
import { SubjectModel } from '@/models/Subject.js';
import { validateSubjects } from '../utils/validateSubjects.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export type SyncDisciplinasRequest = {
  // Rename subjects that we already have
  Body: { mappings?: Record<string, string> };
  Querystring: {
    writeSubjects: boolean;
  };
};

type UfabcDisciplina = ReturnType<typeof convertUfabcDisciplinas>;

const querystringSchema = z.object({
  writeSubjects: z.coerce.boolean().default(false),
});

export async function syncDisciplinasHandler(
  request: FastifyRequest<SyncDisciplinasRequest>,
  reply: FastifyReply,
) {
  const { mappings } = request.body || {};
  const { writeSubjects } = querystringSchema.parse(request.query);
  const season = currentQuad();
  const rawUfabcDisciplinas = await ofetch<any[]>(
    'https://matricula.ufabc.edu.br/cache/todasDisciplinas.js',
    {
      parseResponse: parseResponseToJson,
    },
  );
  const UfabcDisciplinas: UfabcDisciplina[] = rawUfabcDisciplinas.map(
    (ufabcDisciplina) => convertUfabcDisciplinas(ufabcDisciplina),
  );

  if (!UfabcDisciplinas) {
    request.log.warn({ msg: 'Error in Ufabc Disciplinas', UfabcDisciplinas });
    return reply.badRequest('Could not parse disciplinas');
  }

  const subjects = await SubjectModel.find({});
  // check if subjects actually exists before creating the relation
  const missingSubjects = validateSubjects(
    UfabcDisciplinas,
    subjects,
    mappings,
  );
  const uniqSubjects = [...new Set(missingSubjects)];
  if (missingSubjects.length > 0) {
    request.log.warn({
      msg: 'Some subjects are missing',
      missing: uniqSubjects,
    });

    if (!writeSubjects) {
      return reply.badRequest(
        'Subject not in the database, check logs to see missing subjects',
      );
    }

    const lowercasedSubjects = uniqSubjects.map((subject) =>
      subject.toLocaleLowerCase(),
    );

    const foundSubjects = await SubjectModel.find({
      name: {
        $in: lowercasedSubjects.map(
          (subject) => new RegExp(`^${subject}$`, 'i'),
        ),
      },
    });

    const foundSubjectNames = new Set(
      foundSubjects.map((s) => s.name.toLowerCase()),
    );
    const subjectsToInsert = lowercasedSubjects.filter(
      (subject) => !foundSubjectNames.has(subject),
    );

    return {
      foundSubjectNames,
    };
  }

  const start = Date.now();
  const insertDisciplinasErrors = await batchInsertItems(
    UfabcDisciplinas,
    (disciplina) => {
      return DisciplinaModel.findOneAndUpdate(
        {
          disciplina_id: disciplina?.disciplina_id,
          identifier: generateIdentifier(disciplina),
          season,
        },
        disciplina,
        { upsert: true, new: true },
      );
    },
  );

  if (insertDisciplinasErrors.length > 0) {
    request.log.error({
      msg: 'Something bad happened',
      insertDisciplinasErrors,
    });
    return reply.internalServerError('Error inserting disciplinas');
  }

  return {
    status: 'Sync disciplinas successfully',
    time: Date.now() - start,
  };
}
