import type { currentQuad } from '@next/common';
import type { DisciplinaRepository } from './disciplina.repository.js';

export class DisciplinaService {
  constructor(private readonly disciplinaRepository: DisciplinaRepository) {}

  async findDisciplinas(season: ReturnType<typeof currentQuad>) {
    const disciplinaMapping = {
      disciplina: 1,
      disciplina_id: 1,
      turno: 1,
      turma: 1,
      ideal_quad: 1,
      identifier: 1,
      subject: 1,

      vagas: 1,
      requisicoes: 1,
      teoria: 1,
      pratica: 1,
    };

    const discplinas = await this.disciplinaRepository.findMany(
      {
        season,
      },
      disciplinaMapping,
      ['pratica', 'teoria'],
    );
    return discplinas;
  }

  async findDisciplina(
    season: ReturnType<typeof currentQuad>,
    disciplinaId: number,
  ) {
    const disciplina = await this.disciplinaRepository.findOne({
      season,
      disciplina_id: disciplinaId,
    });
    return disciplina;
  }

  async findStudentCourses(
    season: ReturnType<typeof currentQuad>,
    kickedsId: number[],
  ) {
    const students = await this.disciplinaRepository.findCursos([
      {
        $match: { season, aluno_id: { $in: kickedsId } },
      },
      { $unwind: '$cursos' },
    ]);
    return students;
  }
}
