import { createHash } from 'node:crypto';
import { camelCase } from 'lodash-es';

type Disciplina = {
  nome: string;
  id: number;
  ra: number;
  year: number;
  quad: number;
  obrigatorias: number[];
  obrigatoriedades: Array<{
    curso_id: number;
    obrigatoriedade: 'limitada' | 'obrigatoria' | 'livre';
  }>;
  campus: 'santo andre' | 'sao bernardo' | 'sbc' | 'sa';
  turno: 'noturno' | 'diurno' | 'tarde' | null;
  horarios:
    | string
    | {
        horas: string[];
      }[];
  turma: string;
  disciplina: string;
  disciplina_id: number | '-';
  teoria: string | null;
  pratica: string | null;
};

type KeysOptions =
  | 'disciplina'
  | 'turno'
  | 'campus'
  | 'turma'
  | 'nome'
  | 'id'
  | 'obrigatorias'
  | 'obrigatoriedades'
  | 'horarios'
  | 'disciplina_id'
  | 'teoria'
  | 'pratica'
  | 'ra'
  | 'year'
  | 'quad';

const DEFAULT_FIELDS_TO_ENCODE = ['disciplina', 'turno', 'campus', 'turma'] as const;

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
