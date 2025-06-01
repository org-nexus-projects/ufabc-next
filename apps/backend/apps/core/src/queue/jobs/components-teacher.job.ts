import { ComponentModel } from '@/models/Component.js';
import type { QueueContext } from '../types.js';

type ComponentTeacher = { 
  disciplina_id: number; 
  codigo: string; 
  disciplina: string; 
  campus: "sa" | "sbc"; 
  turma: string; 
  turno: string; 
  vagas: number; 
  teoria: any; 
  pratica: any; 
  season: string;
  UFClassroomCode: string;
}

export async function processComponentsTeachers(
  ctx: QueueContext<ComponentTeacher>,
) {
  const { data: component } = ctx.job;

  try {
    const result = await ComponentModel.findOneAndUpdate(
      {
        season: component.season,
        disciplina_id: component.disciplina_id,
      },
      {
        $set: {
          teoria: component.teoria,
          pratica: component.pratica,
          // we will be using UFCompositeKey for better lookup
          uf_cod_turma: component.UFClassroomCode
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
