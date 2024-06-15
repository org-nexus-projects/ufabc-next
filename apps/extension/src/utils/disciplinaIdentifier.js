import { createHash } from 'crypto';
import _ from 'lodash';

const DEFAULT_FIELDS_TO_ENCODE = ['disciplina', 'turno', 'campus', 'turma'];

/**
 * Generates a unique identifier for a given disciplina
 * */
function generateIdentifier(disciplina, keys = DEFAULT_FIELDS_TO_ENCODE) {
  const unorderedDisciplinas = keys.map((key) => String(disciplina[key]));
  const disciplinaToEncode = unorderedDisciplinas
    .map((disciplina) => _.camelCase(disciplina))
    .join('');

  return createHash('md5').update(disciplinaToEncode).digest('hex');
}

module.exports = {
  generateIdentifier,
};
