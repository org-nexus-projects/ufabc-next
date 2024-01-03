import assert from 'node:assert/strict';
import { ofetch } from 'ofetch';
import { beforeEach, describe, it } from 'node:test';
import { pick as lodashPick } from 'lodash-es';
import {
  type Disciplina,
  convertUfabcDisciplinas,
} from './convertUfabcDiscplinas';

const valueToJson = (payload: string, max?: number) => {
  const parts = payload.split('=');
  if (parts.length < 2) {
    return [];
  }

  const jsonStr = parts[1]?.split(';')[0];
  const json = JSON.parse(jsonStr!) as number[];
  if (max) {
    return json.slice(0, max);
  }
  return json;
};

describe('common.lib.convertUfabcDisciplinas', () => {
  let disciplinas: Disciplina[];
  const pick = ['disciplina', 'ideal_quad', 'turma', 'campus', 'turno'];
  beforeEach(async () => {
    disciplinas = await ofetch(
      'https://matricula.ufabc.edu.br/cache/todasDisciplinas.js',
      {
        parseResponse: valueToJson,
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
    assert.strictEqual(
      resp?.disciplina,
      'Aeronáutica I-A (quantas coisas e ---)',
    );
    assert.strictEqual(resp?.turma, 'A3');
    assert.strictEqual(resp?.campus, 'sao bernardo');
    assert.strictEqual(resp?.turno, 'noturno');
  });

  it('should parse with scape characters', () => {
    // @ts-expect-error Unit test and types are hard
    const resp = convertUfabcDisciplinas({
      nome: 'Dinâmica de Fluidos Computacional A-diurno (Santo André) - MINISTRADA EM INGLÊS',
    });
    assert.deepEqual(resp!.disciplina, 'Dinâmica de Fluidos Computacional');
  });

  it('should work without `-`', { skip: 'Not yet implemented' }, () => {
    // @ts-expect-error Unit test and types are hard
    const resp = convertUfabcDisciplinas({
      nome: 'Introdução às Humanidades e Ciências Sociais A\rdiurno (São Bernardo do Campo)',
    });
    assert.equal(
      // @ts-expect-error Unit test and types are hard
      resp.disciplina,
      'Introdução às Humanidades e Ciências Sociais',
    );
    // @ts-expect-error Unit test and types are hard
    assert.equal(resp.turma, 'A');
    // @ts-expect-error Unit test and types are hard
    assert.equal(resp.campus, 'sao bernardo');
    // @ts-expect-error Unit test and types are hard
    assert.equal(resp.turno, 'diurno');
  });
});
