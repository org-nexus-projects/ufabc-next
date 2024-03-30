import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { ofetch } from 'ofetch';
import { pick as lodashPick } from 'lodash-es';
import {
  type Disciplina,
  convertUfabcDisciplinas,
} from './convertUfabcDiscplinas';
import { parseResponseToJson } from './parseResponseToJson';

describe('common.lib.convertUfabcDisciplinas', () => {
  let disciplinas: Disciplina[];
  const pick = ['disciplina', 'ideal_quad', 'turma', 'campus', 'turno'];
  beforeEach(async () => {
    disciplinas = await ofetch(
      'https://matricula.ufabc.edu.br/cache/todasDisciplinas.js',
      {
        parseResponse: parseResponseToJson,
      },
    );
  });

  it('should parse everything correctly', () => {
    const parsedDisciplinas = disciplinas.map((disciplina) =>
      lodashPick(convertUfabcDisciplinas(disciplina), pick),
    );

    assert.ok(
      parsedDisciplinas?.every((disciplina) =>
        ['diurno', 'noturno', 'tarde'].includes(disciplina.turno!),
      ),
    );
    assert.ok(
      parsedDisciplinas.every((disciplina) =>
        ['sao bernardo', 'santo andre'].includes(disciplina.campus!),
      ),
    );
    assert.ok(
      parsedDisciplinas.every(
        (disciplina) =>
          disciplina.turma!.length! > 0 && disciplina.turma!.length! <= 3,
      ),
    );
  });

  it('should work multiple parenthesis', () => {
    // @ts-expect-error Unit test and types are hard
    const resp = convertUfabcDisciplinas({
      nome: 'Aeronáutica I-A (quantas coisas e ---) A3   -    São Bernardo Noturno',
    });
    assert.equal(resp?.disciplina, 'Aeronáutica I-a (quantas Coisas E ---)');
    assert.equal(resp?.turma, 'A3');
    assert.equal(resp?.campus, 'sao bernardo');
    assert.equal(resp?.turno, 'noturno');
  });

  it('should parse with scape characters', () => {
    // @ts-expect-error Unit test and types are hard
    const resp = convertUfabcDisciplinas({
      nome: 'Dinâmica de Fluidos Computacional A-diurno (Santo André) - MINISTRADA EM INGLÊS',
    });
    assert.deepEqual(resp?.disciplina, 'Dinâmica De Fluidos Computacional');
  });

  it('should parse with scape characters and validate title case', () => {
    // @ts-expect-error Unit test and types are hard
    const resp = convertUfabcDisciplinas({
      nome: 'DINÂMICA DE FLUIDOS COMPUTACIONAL A-DIURNO (SANTO ANDRÉ) - MINISTRADA EM INGLÊS',
    });
    const expectedDisciplina = 'Dinâmica De Fluidos Computacional';

    assert.equal(resp?.disciplina, expectedDisciplina);
  });

  it('should work without `-`', { skip: 'Not yet implemented' }, () => {
    // @ts-expect-error Unit test and types are hard
    const resp = convertUfabcDisciplinas({
      nome: 'Introdução às Humanidades e Ciências Sociais A\rdiurno (São Bernardo do Campo)',
    });
    assert.equal(
      resp.disciplina,
      'Introdução às Humanidades e Ciências Sociais',
    );
    assert.equal(resp.turma, 'A');
    assert.equal(resp.campus, 'sao bernardo');
    assert.equal(resp.turno, 'diurno');
  });
});
