import { createHash } from 'node:crypto';
import { camelCase } from 'lodash-es';

type Disciplina = {
  identifier: string;
  obrigatorias: number[];
  alunos_matriculados: number[];
  before_kick: number[];
  after_kick: number[];
  year?: number | undefined;
  quad?: number | undefined;
  turno?: string | undefined;
  disciplina?: string | undefined;
  season?: string | undefined;
  teoria?: string;
  pratica?: string;
  campus?: string | undefined;
  turma?: string | undefined;
  subject?: string;
  codigo?: string | undefined;
  disciplina_id?: number | undefined;
  vagas?: number | undefined;
  ideal_quad?: boolean | undefined;
};

type KeysOptions = keyof Disciplina;

const DEFAULT_FIELDS_TO_ENCODE = [
  'disciplina',
  'turno',
  'campus',
  'turma',
] as const;

/**
 * Generates a unique identifier for a given disciplina
 * */
export function generateIdentifier(
  disciplina: Partial<Disciplina>,
  keys: KeysOptions[] | readonly KeysOptions[] = DEFAULT_FIELDS_TO_ENCODE,
) {
  const unorderedDisciplinas = keys.map((key) => String(disciplina[key]));
  const disciplinaToEncode = unorderedDisciplinas
    .map((disciplina) => camelCase(disciplina))
    .join('');

  return createHash('md5').update(disciplinaToEncode).digest('hex');
}
