import {
  convertUfabcDisciplinas,
  currentQuad,
  generateIdentifier,
  validateSubjects,
} from '@next/common';
import { ofetch } from 'ofetch';
import { DisciplinaModel } from '@/models/Disciplina.js';
import { SubjectModel } from '@/models/Subject.js';
import { batchInsertItems } from '@/queue/utils/batch-insert.js';
import { valueToJson } from '../utils/valueToJson.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export type SyncDisciplinasRequest = {
  Body: { mappings?: Record<string, string> };
};

type UfabcDisciplina = ReturnType<typeof convertUfabcDisciplinas>;

export async function syncDisciplinasHandler(
  request: FastifyRequest<SyncDisciplinasRequest>,
  reply: FastifyReply,
) {
  const { mappings } = request.body || {};
  const season = currentQuad();

  const rawUfabcDisciplinas = await ofetch(
    'https://matricula.ufabc.edu.br/cache/todasDisciplinas.js',
    {
      parseResponse: valueToJson,
    },
  );
  const UfabcDisciplinas: UfabcDisciplina[] = rawUfabcDisciplinas.map(
    // eslint-disable-next-line unicorn/no-array-callback-reference
    convertUfabcDisciplinas,
  );

  if (!UfabcDisciplinas) {
    request.log.error({ msg: 'Error in ufabc Disciplinas', UfabcDisciplinas });
    throw new Error('Could not parse disciplinas');
  }

  const subjects = await SubjectModel.find({}).lean(true);
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
    return reply.status(400).send({
      msg: 'Subject not in the database, check logs to see missing subjects',
      status: 400,
    });
  }

  const start = Date.now();

  const errors = await batchInsertItems(
    UfabcDisciplinas,
    (disciplina: UfabcDisciplina) => {
      return DisciplinaModel.findOneAndUpdate(
        {
          disciplina_id: disciplina?.disciplina_id,
          identifier: generateIdentifier(disciplina),
          season,
        },
        { disciplina },
        { upsert: true, new: true },
      );
    },
  );

  return {
    status: 'Sync disciplinas successfully',
    time: Date.now() - start,
    errors,
  };
}
