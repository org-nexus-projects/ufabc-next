import { ComponentModel } from '@/models/Component.js';
import type { QueueContext } from '../types.js';

type ComponentTeacher = {
  disciplina_id: number | '-';
  codigo: string;
  disciplina: string;
  campus: 'sa' | 'sbc';
  turma: string;
  turno: string;
  vagas: number;
  teoria: any;
  pratica: any;
  season: string;
  UFClassroomCode: string;
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
    const query =
      String(component.disciplina_id) !== '-'
        ? { season: component.season, disciplina_id: component.disciplina_id }
        : { season: component.season, ...searchCriteria };

    ctx.app.log.info(
      {
        query,
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
