import { ComponentModel, type Component } from '@/models/Component.js';
import type { QueueContext } from '../types.js';
import type { FilterQuery } from 'mongoose';

type ComponentTeacher = {
  disciplina_id: string | number;
  subject: any;
  kind?: string;
  type?: string;
  codigo: string;
  uf_cod_turma: string;
  disciplina: string;
  campus: 'sbc' | 'sa';
  turma: string;
  turno: 'diurno' | 'noturno';
  vagas: number;
  ideal_quad: boolean;
  season: string;
  teoria: any;
  pratica: any;
  year: number;
  quad: number;
  obrigatorias: never[] | number[];
  after_kick: never[];
  before_kick: never[];
  alunos_matriculados: never[];
  identifier?: string;
};

export async function processComponentsTeachers(
  ctx: QueueContext<ComponentTeacher>,
) {
  const { data: component } = ctx.job;

  try {
    const searchCriteria = {
      turma: component.turma,
      campus: component.campus,
      turno: component.turno,
      codigo: component.codigo,
    };

    // Se disciplina_id existir, busca por disciplina_id, senão busca pelo searchCriteria
    let query: FilterQuery<Component> = { season: component.season };

    if (component.uf_cod_turma) {
      query = { ...query, uf_cod_turma: component.uf_cod_turma };
    } else if (String(component.disciplina_id) !== '-') {
      query = { ...query, disciplina_id: component.disciplina_id };
    } else {
      query = { ...query, ...searchCriteria };
    }

    ctx.app.log.info(
      {
        query,
        strategy: component.UFClassroomCode
          ? 'uf_cod_turma'
          : String(component.disciplina_id) !== '-'
            ? 'disciplina_id'
            : 'searchCriteria',
      },
      'Searching for match with',
    );

    const result = await ComponentModel.findOneAndUpdate(
      query,
      {
        $set: {
          teoria: component.teoria,
          pratica: component.pratica,
          uf_cod_turma: component.UFClassroomCode,
        },
      },
      { new: true, upsert: true },
    );

    ctx.app.log.info({
      msg: 'Component processed',
      disciplina: component.disciplina,
      UFCode: component.codigo,
      class: component.turma,
      practice: component.pratica,
      teory: component.teoria,
      action: result?.isNew ? 'inserted' : 'updated',
    });
  } catch (error) {
    ctx.app.log.error({
      msg: 'Error processing component',
      error: error instanceof Error ? error.message : String(error),
      component,
    });
    throw error;
  }
}
