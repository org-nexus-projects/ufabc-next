import { describe, expect, it } from 'vitest';

import {
  TeacherModel,
  findBestLevenshteinMatch,
} from '../../src/models/Teacher.js';

function buildTeacher(name: string, alias: string[] = []) {
  return TeacherModel.hydrate({ alias, name });
}

describe('findBestLevenshteinMatch', () => {
  it('does not merge different people with similar names', () => {
    const candidates = [
      buildTeacher('Marcela Ribeiro Da Silva'),
      buildTeacher('Delmo Alves De Moura'),
      buildTeacher('Mariselma Ferreira'),
    ];

    expect(findBestLevenshteinMatch('rafaela valero da silva', candidates)).toBeNull();
    expect(findBestLevenshteinMatch('roseli alves de moura', candidates)).toBeNull();
    expect(findBestLevenshteinMatch('tatiana lima ferreira', candidates)).toBeNull();
  });

  it('matches names that only differ by connectors like de, da, dos', () => {
    const teacher = buildTeacher('Marcio Luiz Dos Santos');

    expect(findBestLevenshteinMatch('marcio luiz santos', [teacher])).toBe(teacher);
  });

  it('matches a single-character typo', () => {
    const teacher = buildTeacher('Alexander Gomes');

    expect(findBestLevenshteinMatch('alexandre gomes', [teacher])).toBe(teacher);
  });

  it('treats hyphens as spaces', () => {
    const teacher = buildTeacher('Jean Jacques Bonvent');

    expect(findBestLevenshteinMatch('jean-jacques bonvent', [teacher])).toBe(teacher);
  });

  it('does not match names with a different number of words', () => {
    const teacher = buildTeacher('Ilka Tiemy Kato Prates');

    expect(findBestLevenshteinMatch('ilka tiemy kato', [teacher])).toBeNull();
  });

  it('picks the closest candidate when several are within the distance', () => {
    const farther = buildTeacher('Joao Ricardo Sato');
    const closer = buildTeacher('Jose Ricardo Sato');

    expect(findBestLevenshteinMatch('jose ricardo sat', [farther, closer])).toBe(closer);
  });
});
