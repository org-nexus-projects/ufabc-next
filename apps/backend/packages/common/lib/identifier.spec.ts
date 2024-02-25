import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateIdentifier } from './identifier';

describe('common.lib.identifier', () => {
  it('should generate a valid hash with default keys', () => {
    const mockedDisciplinas: any = {
      _id: '637239704ffcadea47e2413c',
      disciplina_id: 681,
      identifier: '46727e0e63d979da9715e1a71c35216c',
      season: '2023:1',
      __v: 0,
      campus: 'santo andre',
      codigo: 'MCTD022-18',
      createdAt: '2022-11-14T12:49:52.152Z',
      disciplina: 'Álgebra na Educação Básica',
      ideal_quad: false,
      quad: 3,
      subject: '5d439912931e87001021657a',
      turma: 'A',
      turno: 'diurno',
      updatedAt: '2023-06-23T02:41:32.687Z',
      vagas: 45,
      year: 2023,
      pratica: '5bf5fb65d741524f090c920f',
      teoria: null,
    };
    const disciplinaHash = generateIdentifier(mockedDisciplinas);
    assert(disciplinaHash);
  });

  it('should generate a valid hash with custom keys', () => {
    const customKeys = ['year', 'quad', 'disciplina'] as const;
    const mockedDisciplinas: any = {
      _id: '637239704ffcadea47e2413c',
      disciplina_id: 681,
      identifier: '46727e0e63d979da9715e1a71c35216c',
      season: '2023:1',
      __v: 0,
      campus: 'santo andre',
      codigo: 'MCTD022-18',
      createdAt: '2022-11-14T12:49:52.152Z',
      disciplina: 'Álgebra na Educação Básica',
      ideal_quad: false,
      quad: 3,
      subject: '5d439912931e87001021657a',
      turma: 'A',
      turno: 'diurno',
      updatedAt: '2023-06-23T02:41:32.687Z',
      vagas: 45,
      year: 2023,
      pratica: '5bf5fb65d741524f090c920f',
      teoria: null,
    };

    // @ts-expect-error Unit test and types are hard
    const disciplinaHash = generateIdentifier(mockedDisciplinas, customKeys);

    assert(disciplinaHash);
  });

  it('should be equal to the saved hash', () => {
    const mockedDisciplinas: any = {
      _id: '637239704ffcadea47e2413c',
      disciplina_id: 681,
      identifier: '46727e0e63d979da9715e1a71c35216c',
      season: '2023:1',
      __v: 0,
      campus: 'santo andre',
      codigo: 'MCTD022-18',
      createdAt: '2022-11-14T12:49:52.152Z',
      disciplina: 'Álgebra na Educação Básica',
      ideal_quad: false,
      quad: 3,
      subject: '5d439912931e87001021657a',
      turma: 'A',
      turno: 'diurno',
      updatedAt: '2023-06-23T02:41:32.687Z',
      vagas: 45,
      year: 2023,
      pratica: '5bf5fb65d741524f090c920f',
      teoria: null,
    };
    const disciplinaHash = generateIdentifier(mockedDisciplinas);
    // insert the hash in the mockedObject
    mockedDisciplinas.identifier = disciplinaHash;
    assert.deepEqual(disciplinaHash, mockedDisciplinas.identifier);
  });
});
