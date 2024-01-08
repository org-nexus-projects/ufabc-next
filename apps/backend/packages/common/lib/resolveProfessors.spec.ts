import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveProfessor } from './resolveProfessors';

const teachers = [
  { name: 'Carla Lopes Rodriguez' },
  { name: 'Carla Negri Lintzmayer' },
  { name: 'Carlo Kleber Da Silva Rodrigues' },
  { name: 'Carlos Alberto Da Silva' },
  { name: 'Carlos Alberto Dos Reis Filho' },
  { name: 'Carlos Alberto Kamienski' },
  { name: 'Carlos Alberto Rocha Pimentel' },
  { name: 'Carlos Da Rocha' },
];

describe('common.lib.resolveProfessors', () => {
  it('Should return the professors name if I pass their entire name', () => {
    assert.deepStrictEqual(
      resolveProfessor('Carlos Alberto Rocha Pimentel', teachers),
      { name: 'Carlos Alberto Rocha Pimentel' },
    );
  });

  it("should return the professor's name if I pass parts of their name", () => {
    assert.deepStrictEqual(resolveProfessor('Carla Rodriguez', teachers), {
      name: 'Carla Lopes Rodriguez',
    });
  });

  it("should not return the name of a professor that doesn't exist", () => {
    assert.deepStrictEqual(resolveProfessor('tomate', teachers), {
      error: 'Missing Teacher: Tomate',
    });
  });
});
