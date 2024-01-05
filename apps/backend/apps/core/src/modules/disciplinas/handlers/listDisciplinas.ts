import { currentQuad } from '@next/common';
import { type Disciplina, DisciplinaModel } from '@/models/Disciplina.js';
import type { RouteHandler } from 'fastify';

export const listDisciplinas: RouteHandler = async () => {
  const season = currentQuad();
  const disciplinas = await DisciplinaModel.find(
    {
      season,
    },
    {
      disciplina: 1,
      disciplina_id: 1,
      turno: 1,
      turma: 1,
      ideal_quad: 1,
      identifier: 1,
      subject: 1,

      vagas: 1,
      requisicoes: 1,
      teoria: 1,
      pratica: 1,
    },
  )
    .populate(['teoria', 'pratica'])
    .lean<Disciplina>({ virtuals: true });

  return disciplinas;
};
