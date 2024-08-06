import {
  batchInsertItems,
  type convertUfabcDisciplinas,
  currentQuad,
  generateIdentifier,
  parseResponseToJson,
} from '@next/common';
import { ofetch } from 'ofetch';
import { DisciplinaModel, type Disciplina } from '@/models/Disciplina.js';
import { SubjectModel } from '@/models/Subject.js';
import { validateSubjects } from '../utils/validateSubjects.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ufProcessor } from '@/services/ufprocessor.js';
import { camelCase, startCase } from 'lodash-es';

export type SyncDisciplinasRequest = {
  // Rename subjects that we already have
  Body: { mappings?: Record<string, string> };
};

type UfabcDisciplina = ReturnType<typeof convertUfabcDisciplinas>;

export async function syncDisciplinasHandler(
  request: FastifyRequest<SyncDisciplinasRequest>,
  reply: FastifyReply,
) {
  const { mappings } = request.body || {};
  const season = currentQuad();
  const components = await ufProcessor.getComponents();

  if (!components) {
    request.log.warn({ msg: 'Error in Ufabc Disciplinas', components });
    return reply.badRequest('Could not parse disciplinas');
  }

  const subjects: Array<{ name: string }> = await SubjectModel.find(
    {},
    { name: 1, _id: 0 },
  ).lean();
  const subjectNames = subjects.map(({ name }) => name.toLocaleLowerCase());
  const missingSubjects = components.filter(
    ({ name }) => !subjectNames.includes(name),
  );
  const names = missingSubjects.map(({ name }) => name);
  const uniqMissing = [...new Set(names)];

  if (missingSubjects.length > 0) {
    return {
      msg: 'missing subjects',
      uniqMissing,
    };
  }

  const nextComponents = components.map<Disciplina>((component) => ({
    codigo: component.UFComponentCode,
    disciplina_id: component.UFComponentId,
    campus: component.campus,
    disciplina: component.name,
  }));

  const start = Date.now();
  const insertDisciplinasErrors = await batchInsertItems(
    components,
    (component) => {
      return DisciplinaModel.findOneAndUpdate(
        {
          disciplina_id: component?.UFComponentId,
          // this never had sense to me,
          identifier: generateIdentifier(component),
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
