import type { currentQuad } from '@next/common';
import type { DisciplinaRepository } from './disciplina.repository.js';

export type PopulatedComponent = {
  disciplina_id: number;
  turno: 'diurno' | 'noturno';
  turma: string;
  ideal_quad: boolean;
  identifier: string;
  subject?: {
    name: string;
    search: string;
    _id: string;
  };
  vagas: number;
  requisicoes: number;
  teoria?: {
    name: string;
    _id: string;
  };
  pratica?: {
    name: string;
    _id: string;
  };
  id: string;
};

export class DisciplinaService {
  constructor(private readonly disciplinaRepository: DisciplinaRepository) {}

  async findComponents(
    season: ReturnType<typeof currentQuad>,
  ): Promise<PopulatedComponent[]> {
    const disciplinaMapping = {
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
      _id: 0,
    };

    const components = await this.disciplinaRepository.findMany(
      {
        season,
      },
      disciplinaMapping,
      ['pratica', 'teoria', 'subject'],
    );
    return components as unknown as PopulatedComponent[];
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
