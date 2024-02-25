import { createHash } from 'node:crypto';
import { camelCase } from 'lodash-es';
import type { Disciplina } from './convertUfabcDiscplinas';

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
