import { currentQuad } from '@next/common';
import { type Disciplina, DisciplinaModel } from '@/models/Disciplina.js';
import type { ProjectionType } from 'mongoose';
import type { RouteHandler } from 'fastify';

export const listDisciplinas: RouteHandler = async () => {
  const season = currentQuad();
  const disciplinasMapper = {
    disciplina: 1,
    turno: 1,
    identifier: 1,
    subject: 1,
    teoria: 1,
    pratica: 1,
    requisicoes: 1,
  } satisfies ProjectionType<Disciplina>;

  const disciplinas = await DisciplinaModel.find(
    {
      season,
    },
    disciplinasMapper,
  )
    .populate(['teoria', 'pratica'])
    .lean<Disciplina[]>({ virtuals: true });

  return disciplinas;
};
