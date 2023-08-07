import type { Model, Query, Types } from 'mongoose';

export type Disciplina = {
  disciplina_id: number;
  disciplina: string;
  turno: string;
  turma: string;
  vagas: number;
  obrigatorias: number[];
  codigo: string;
  campus: string;
  ideal_quad: boolean;

  subject: Types.ObjectId;
  identifier: string;

  alunos_matriculados: number[];
  before_kick: number[];
  after_kick: number[];

  year: number;
  quad: number;

  teoria: Types.ObjectId;
  pratica: Types.ObjectId;
};

export type DisciplinaQuery = Query<Disciplina, Disciplina>;

export type DisciplinaVirtuals = {
  requisicoes(): number;
};

export type DisciplinaModel = Model<
  Disciplina,
  unknown,
  unknown,
  DisciplinaVirtuals
>;
