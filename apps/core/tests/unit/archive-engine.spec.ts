import { beforeEach, describe, expect, it, vi } from 'vitest';

import { findTeacher } from '../../src/models/Teacher.js';
import { ArchiveEngine } from '../../src/services/archive-engine.js';

const repositoryMock = vi.hoisted(() => ({
  findByCodigo: vi.fn(),
  findByDisciplinaKeywords: vi.fn(),
  setMoodleCourseId: vi.fn(),
}));

vi.mock('../../src/repositories/components-repository.js', () => ({
  ComponentsRepository: vi.fn(() => repositoryMock),
}));
const moodleMock = vi.hoisted(() => ({ getUsersByCoursePage: vi.fn() }));

vi.mock('../../src/connectors/moodle.js', () => ({
  MoodleConnector: vi.fn(() => moodleMock),
}));
vi.mock('../../src/models/Teacher.js', () => ({ findTeacher: vi.fn() }));

const codelessCourse = {
  fullname: 'Computação Gráfica',
  id: 1911,
  viewurl: 'https://moodle.ufabc.edu.br/course/view.php?id=1911',
};

describe('ArchiveEngine.findComponentByMoodleCourse', () => {
  beforeEach(() => {
    repositoryMock.findByCodigo.mockReset();
    repositoryMock.findByDisciplinaKeywords.mockReset();
    repositoryMock.setMoodleCourseId.mockReset();
  });

  it('matches a course without a discipline code by keywords within the enrolled codes', async () => {
    const component = { _id: 'component-id', disciplina: 'computação gráfica' };
    repositoryMock.findByDisciplinaKeywords.mockResolvedValue(component);

    const engine = new ArchiveEngine();
    const matched = await engine.findComponentByMoodleCourse(
      codelessCourse,
      [],
      ['MCCC007-23']
    );

    expect(matched).toBe(component);
    expect(repositoryMock.findByDisciplinaKeywords).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ codigo: { $in: ['MCCC007-23'] } })
    );
  });

  it('does not guess by keywords alone when there is no code, teacher or enrollment filter', async () => {
    const engine = new ArchiveEngine();
    const matched = await engine.findComponentByMoodleCourse(
      codelessCourse,
      [],
      []
    );

    expect(matched).toBeNull();
    expect(repositoryMock.findByDisciplinaKeywords).not.toHaveBeenCalled();
  });
});

describe('ArchiveEngine teacher handling', () => {
  it('extracts teacher names without the avatar initials', async () => {
    moodleMock.getUsersByCoursePage.mockResolvedValue(`
      <a href="https://moodle.ufabc.edu.br/user/view.php?id=1"><span class="userinitials size-35">JM</span>João Marcelo Borovina Josko</a>
      <a href="https://moodle.ufabc.edu.br/user/view.php?id=2"><img class="userpicture" alt="" />Carlos da Silva dos Santos</a>
    `);

    const engine = new ArchiveEngine({
      session: { sessionId: 'session', sessKey: 'key' },
    });
    const names = await engine.extractTeacherNames(1911);

    expect(names).toEqual([
      'João Marcelo Borovina Josko',
      'Carlos da Silva dos Santos',
    ]);
  });

  it('never creates teachers while matching a Moodle course', async () => {
    vi.mocked(findTeacher).mockResolvedValue(null);

    const engine = new ArchiveEngine();
    await engine.findComponentByMoodleCourse(codelessCourse, ['Some Name'], []);

    expect(findTeacher).toHaveBeenCalledWith('Some Name', {
      createIfMissing: false,
    });
  });

  const keywordCases: Array<[string, string[]]> = [
    [
      'Turma NA1 - Algoritmos em Grafos - Alexandre Noma - 2026.Q3',
      ['algoritmos', 'grafos'],
    ],
    ['Compiladores&amp;Interpretadores', ['compiladores', 'interpretadores']],
    ['Biofísica2026', ['biofísica']],
    [
      'FHAL - FORMAÇÃO HISTÓRICA DA AMERICA LATINA 2026.3 FUSER',
      ['formação', 'histórica', 'america', 'latina'],
    ],
  ];

  for (const [fullname, expectedKeywords] of keywordCases) {
    it(`finds keywords for "${fullname}"`, async () => {
      const component = { _id: 'component-id', disciplina: 'match' };
      repositoryMock.findByDisciplinaKeywords.mockImplementation(
        async (keywords: string[]) => {
          if (keywords.join(' ') === expectedKeywords.join(' ')) {
            return component;
          }
          return null;
        }
      );

      const engine = new ArchiveEngine();
      const matched = await engine.findComponentByMoodleCourse(
        {
          fullname,
          id: 1,
          viewurl: 'https://moodle.ufabc.edu.br/course/view.php?id=1',
        },
        [],
        ['MCCC007-23']
      );

      expect(matched).toBe(component);
    });
  }
});
